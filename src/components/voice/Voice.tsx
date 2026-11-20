"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Cancel01Icon,
  Mic01Icon,
  PauseIcon,
  PlayIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";

/*
 * Voice notes, ChatGPT / Claude style: tap the mic, a live waveform follows your voice,
 * tap ✓ to attach the recording (or ✕ to throw it away). The note is kept as a data URL,
 * so it can be played back and saved with chat messages.
 */

export type VoiceNote = {
  id: string;
  name: string;
  src: string;
  duration: number;
  mime: string;
};

type Status = "idle" | "starting" | "recording" | "saving";

const BARS = 48;
const pickMime = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return (
    ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
      (t) => MediaRecorder.isTypeSupported(t),
    ) ?? ""
  );
};
export const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function useVoiceRecorder({
  onDone,
  maxSeconds = 180,
}: {
  onDone: (note: VoiceNote) => void;
  maxSeconds?: number;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const r = useRef<{
    rec?: MediaRecorder;
    stream?: MediaStream;
    ctx?: AudioContext;
    raf?: number;
    chunks: Blob[];
    startedAt: number;
    cancelled: boolean;
    lastPush: number;
  }>({ chunks: [], startedAt: 0, cancelled: false, lastPush: 0 });
  const done = useRef(onDone);
  done.current = onDone;

  const cleanup = useCallback(() => {
    const s = r.current;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.stream?.getTracks().forEach((t) => t.stop());
    s.ctx?.close().catch(() => {});
    s.raf = undefined;
    s.stream = undefined;
    s.ctx = undefined;
  }, []);

  useEffect(
    () => () => {
      r.current.cancelled = true;
      if (r.current.rec?.state === "recording") r.current.rec.stop();
      cleanup();
    },
    [cleanup],
  );

  const stop = useCallback(() => {
    const rec = r.current.rec;
    if (rec && rec.state === "recording") {
      setStatus("saving");
      rec.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    r.current.cancelled = true;
    if (r.current.rec?.state === "recording") r.current.rec.stop();
    cleanup();
    setStatus("idle");
    setLevels(Array(BARS).fill(0));
    setElapsed(0);
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Voice recording isn't supported in this browser.");
      return;
    }
    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (e) {
      const name = (e as DOMException)?.name;
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access is blocked. Allow it from the icon in the address bar, then try again."
          : name === "NotFoundError"
            ? "No microphone was found."
            : "Couldn't start the microphone.",
      );
      setStatus("idle");
      return;
    }
    const mime = pickMime();
    const rec = new MediaRecorder(
      stream,
      /* 32 kbps is plenty for speech and keeps notes small enough to store */
      mime
        ? { mimeType: mime, audioBitsPerSecond: 32000 }
        : { audioBitsPerSecond: 32000 },
    );
    const s = r.current;
    s.rec = rec;
    s.stream = stream;
    s.chunks = [];
    s.cancelled = false;
    s.startedAt = performance.now();
    s.lastPush = 0;
    rec.ondataavailable = (ev) => ev.data.size && s.chunks.push(ev.data);
    rec.onstop = () => {
      const duration = (performance.now() - s.startedAt) / 1000;
      const type = rec.mimeType || mime || "audio/webm";
      cleanup();
      setLevels(Array(BARS).fill(0));
      setElapsed(0);
      if (s.cancelled || !s.chunks.length) {
        setStatus("idle");
        return;
      }
      const blob = new Blob(s.chunks, { type });
      const reader = new FileReader();
      reader.onload = () => {
        const ext = type.includes("mp4")
          ? "m4a"
          : type.includes("ogg")
            ? "ogg"
            : "webm";
        const stamp = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        done.current({
          id: `v${Date.now()}`,
          name: `Voice note ${stamp}.${ext}`,
          src: String(reader.result),
          duration,
          mime: type,
        });
        setStatus("idle");
      };
      reader.onerror = () => {
        setError("Couldn't save the recording.");
        setStatus("idle");
      };
      reader.readAsDataURL(blob);
    };

    /* live level meter for the waveform */
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      s.ctx = ctx;
      const buf = new Uint8Array(analyser.fftSize);
      const tick = (t: number) => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const level = Math.min(1, rms * 4.5);
        if (t - s.lastPush > 70) {
          s.lastPush = t;
          setLevels((l) => [...l.slice(1), level]);
        }
        const secs = (performance.now() - s.startedAt) / 1000;
        setElapsed(secs);
        if (secs >= maxSeconds && rec.state === "recording") {
          setStatus("saving");
          rec.stop();
          return;
        }
        s.raf = requestAnimationFrame(tick);
      };
      s.raf = requestAnimationFrame(tick);
    } catch {
      /* no meter – recording still works */
    }

    rec.start(250);
    setStatus("recording");
  }, [cleanup, maxSeconds]);

  return {
    status,
    levels,
    elapsed,
    error,
    start,
    stop,
    cancel,
    clearError: () => setError(null),
    active: status !== "idle",
  };
}

export type VoiceRecorder = ReturnType<typeof useVoiceRecorder>;

/** Mic button (36px or 32px) */
export function MicButton({
  rec,
  size = 36,
  className = "",
}: {
  rec: VoiceRecorder;
  size?: 32 | 36;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Record a voice note"
      title="Record a voice note"
      onClick={() => (rec.active ? rec.stop() : rec.start())}
      disabled={rec.status === "starting" || rec.status === "saving"}
      className={`flex shrink-0 items-center justify-center rounded-[10px] border transition-colors disabled:opacity-60 ${
        rec.active
          ? "border-[#F04438]/30 bg-[#FEF3F2] text-[#F04438]"
          : "border-[#EDEDF0] bg-white text-body hover:text-[#101D37]"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon icon={huge(Mic01Icon)} size={size === 36 ? 16 : 15} stroke={1.5} />
    </button>
  );
}

/** Replaces the input while recording: ● live waveform 0:07  ✕ ✓ */
export function RecordingBar({
  rec,
  className = "",
}: {
  rec: VoiceRecorder;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#F04438]/60" />
        <span className="relative size-2.5 rounded-full bg-[#F04438]" />
      </span>
      <span className="sr-only">
        {rec.status === "starting"
          ? "Starting the microphone"
          : rec.status === "saving"
            ? "Saving the recording"
            : "Recording"}
      </span>
      <div
        className="flex h-7 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden"
        aria-hidden
      >
        {rec.levels.map((l, i) => (
          <span
            key={i}
            className="w-[3px] shrink-0 rounded-full bg-blue transition-[height] duration-75"
            style={{
              height: `${Math.max(3, Math.round(l * 28))}px`,
              opacity: l > 0.02 ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-[#101D37] tabular-nums">
        {rec.status === "saving" ? "…" : fmtTime(rec.elapsed)}
      </span>
      <button
        type="button"
        onClick={rec.cancel}
        aria-label="Discard recording"
        title="Discard"
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#EDEDF0] bg-white text-body hover:text-[#F04438]"
      >
        <Icon icon={huge(Cancel01Icon)} size={15} stroke={1.7} />
      </button>
      <button
        type="button"
        onClick={rec.stop}
        disabled={rec.status !== "recording"}
        aria-label="Stop and attach recording"
        title="Stop and attach"
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-blue text-white disabled:opacity-60"
      >
        <Icon icon={huge(Tick02Icon)} size={16} stroke={2} />
      </button>
    </div>
  );
}

/* deterministic bar heights for a note's static waveform */
const shape = (id: string, n: number) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const wave = Math.sin(i / 2.2) * 0.25 + 0.55;
    return Math.max(0.18, Math.min(1, wave + ((h % 100) / 100 - 0.5) * 0.6));
  });
};

/** Playable voice note: ▶ waveform 0:12  (✕ when removable) */
export function VoiceChip({
  note,
  onRemove,
  compact,
}: {
  note: VoiceNote;
  onRemove?: () => void;
  compact?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const bars = shape(note.id, compact ? 22 : 30);
  const total = note.duration || 0;
  const progress = total ? Math.min(1, pos / total) : 0;
  return (
    <span
      className={`flex max-w-full items-center gap-2 rounded-[12px] border border-[#EDEDF0] bg-white ${compact ? "h-9 pr-2 pl-1" : "h-11 pr-2.5 pl-1.5"}`}
    >
      <button
        type="button"
        onClick={() => {
          const a = audio.current;
          if (!a) return;
          if (a.paused) a.play().catch(() => {});
          else a.pause();
        }}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className={`flex shrink-0 items-center justify-center rounded-full bg-blue text-white ${compact ? "size-7" : "size-8"}`}
      >
        <Icon
          icon={huge(playing ? PauseIcon : PlayIcon)}
          size={compact ? 13 : 15}
          stroke={2}
        />
      </button>
      <span className="flex h-6 items-center gap-[2px]" aria-hidden>
        {bars.map((b, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${i / bars.length < progress ? "bg-blue" : "bg-[#C5D3F6]"}`}
            style={{ height: `${Math.round(b * (compact ? 18 : 22))}px` }}
          />
        ))}
      </span>
      <span className="shrink-0 text-xs font-medium text-body tabular-nums">
        {fmtTime(playing || pos ? pos : total)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove voice note"
          className="shrink-0 text-body hover:text-[#F04438]"
        >
          <Icon icon={huge(Cancel01Icon)} size={14} stroke={1.6} />
        </button>
      )}
      <audio
        ref={audio}
        src={note.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setPos(0);
        }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
      />
    </span>
  );
}

/** Small red line for recorder errors */
export function VoiceError({ rec }: { rec: VoiceRecorder }) {
  if (!rec.error) return null;
  return (
    <p role="alert" className="flex items-center gap-2 text-xs text-[#F04438]">
      {rec.error}
      <button
        type="button"
        onClick={rec.clearError}
        className="font-semibold text-body hover:text-[#101D37]"
      >
        Dismiss
      </button>
    </p>
  );
}
