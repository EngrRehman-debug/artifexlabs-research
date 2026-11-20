import { NextResponse } from "next/server";
import { AiError, transcribe } from "@/lib/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Voice note (data URL) → text, with Groq Whisper. */
export async function POST(req: Request) {
  try {
    const { audio } = (await req.json()) as { audio?: string };
    if (typeof audio !== "string" || !audio.startsWith("data:audio"))
      return NextResponse.json({ error: "No audio" }, { status: 400 });
    return NextResponse.json({ text: await transcribe(audio) });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError(String(e));
    console.error("[ai] transcription failed:", err.message);
    return NextResponse.json(
      { error: "Couldn't transcribe the voice note." },
      { status: 502 },
    );
  }
}
