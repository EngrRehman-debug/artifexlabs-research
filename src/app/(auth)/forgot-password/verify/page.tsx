"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton, PrimaryButton } from "@/components/auth/ui";

const LENGTH = 6;

export default function VerifyCodePage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [active, setActive] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const focus = (i: number) => refs.current[i]?.focus();

  const setDigit = (i: number, value: string) => {
    const v = value.replace(/\D/g, "");
    if (!v) return;
    const next = [...digits];
    v.slice(0, LENGTH - i)
      .split("")
      .forEach((d, k) => (next[i + k] = d));
    setDigits(next);
    focus(Math.min(i + v.length, LENGTH - 1));
  };

  return (
    <div className="flex w-full max-w-[412px] flex-col gap-6">
      <BackButton href="/forgot-password" />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.04em] text-dark">
          Two-factor authentication
        </h1>
        <p className="max-w-[361px] text-base leading-6 tracking-[-0.02em] text-body">
          Check your email! We’ve sent a 6-digit code to fisuhan@gmail.com
          Enter it below to continue.
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (digits.some((d) => !d)) {
            focus(digits.findIndex((d) => !d));
            return;
          }
          router.push("/forgot-password/reset");
        }}
      >
        <div className="flex justify-between gap-2 sm:gap-5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              maxLength={LENGTH}
              onFocus={() => setActive(i)}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  const next = [...digits];
                  if (next[i]) next[i] = "";
                  else if (i > 0) {
                    next[i - 1] = "";
                    focus(i - 1);
                  }
                  setDigits(next);
                }
                if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
                if (e.key === "ArrowRight" && i < LENGTH - 1) focus(i + 1);
              }}
              className={`size-[52px] min-w-0 rounded-lg border bg-black-50 text-center text-2xl leading-8 font-semibold tracking-[-0.02em] text-dark outline-none ${
                active === i ? "border-dark" : "border-black-100"
              }`}
            />
          ))}
        </div>

        <p className="text-sm leading-[1.5] text-body">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            disabled={seconds > 0}
            onClick={() => setSeconds(30)}
            className="font-semibold text-dark underline underline-offset-2 enabled:hover:text-blue disabled:cursor-default disabled:opacity-60"
          >
            {seconds > 0
              ? `Resend in 00:${String(seconds).padStart(2, "0")}`
              : "Resend code"}
          </button>
        </p>

        <PrimaryButton type="submit">Verify</PrimaryButton>
      </form>
    </div>
  );
}
