"use client";
import { useState, useRef } from "react";

type RecordState = "idle" | "recording" | "processing" | "done" | "error";

// Press shorter than this is a tap (toggle mode); longer is hold-to-record.
const HOLD_THRESHOLD_MS = 600;

interface Props {
  onComplete: (result: { note: unknown; structured: unknown }) => void;
}

export function RecordButton({ onComplete }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const startRecording = async () => {
    if (state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      blobRef.current = null;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start(100);
      mediaRef.current = recorder;

      // Keep the screen awake so mobile doesn't kill the mic mid-recording
      try {
        wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        wakeLockRef.current = null;
      }

      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(
        () => setDuration((d) => d + 1),
        1000
      );
      autoStopRef.current = setTimeout(() => stopRecording(), 300_000);
    } catch (err) {
      console.error("[record] mic error:", err);
      setErrorMsg("Microphone unavailable");
      setState("error");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
  };

  const handleStop = async () => {
    const mimeType = mediaRef.current?.mimeType || "audio/webm";
    blobRef.current = new Blob(chunksRef.current, { type: mimeType });
    await submit();
  };

  const submit = async () => {
    if (!blobRef.current) {
      setState("idle");
      return;
    }
    setState("processing");
    const form = new FormData();
    form.append("audio", blobRef.current, "recording.webm");

    try {
      const res = await fetch("/api/notes/process", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Processing failed");
      }
      const data = await res.json();
      blobRef.current = null;
      setState("done");
      onComplete(data);
    } catch (err) {
      console.error("[record] process error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
      setState("error");
    }
  };

  const reset = () => {
    blobRef.current = null;
    setErrorMsg("");
    setState("idle");
    setDuration(0);
  };

  const handlePointerDown = () => {
    if (state === "idle") {
      pressStartRef.current = Date.now();
      startRecording();
    } else if (state === "recording") {
      // Second tap in tap-to-record mode
      stopRecording();
    }
  };

  const handlePointerUp = () => {
    // Only stop on release if this was a hold; a quick tap keeps recording
    if (
      mediaRef.current?.state === "recording" &&
      Date.now() - pressStartRef.current > HOLD_THRESHOLD_MS
    ) {
      stopRecording();
    }
  };

  const handleClick = () => {
    if (state === "done") reset();
    if (state === "error") {
      // Retry the upload with the audio we still have; without audio just reset
      if (blobRef.current) submit();
      else reset();
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const FACE: Record<RecordState, string> = {
    idle: [
      "cursor-pointer",
      "bg-[radial-gradient(circle_at_32%_26%,#fb7185_0%,#ef4444_38%,#b91c1c_78%,#7f1d1d_100%)]",
      "shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-14px_28px_rgba(0,0,0,0.4),0_0_36px_-8px_rgba(239,68,68,0.55),0_18px_36px_-16px_rgba(0,0,0,0.9)]",
      "hover:brightness-110 active:scale-[0.96] active:brightness-95",
    ].join(" "),
    recording: [
      "bg-[radial-gradient(circle_at_32%_26%,#ef4444_0%,#dc2626_42%,#991b1b_82%,#7f1d1d_100%)]",
      "shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-14px_28px_rgba(0,0,0,0.45)]",
      "animate-[rec-breathe_1.9s_ease-in-out_infinite]",
    ].join(" "),
    processing: [
      "cursor-wait",
      "bg-[radial-gradient(circle_at_32%_26%,#3f3f46_0%,#27272a_55%,#18181b_100%)]",
      "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-14px_28px_rgba(0,0,0,0.5)]",
    ].join(" "),
    done: [
      "cursor-pointer",
      "bg-[radial-gradient(circle_at_32%_26%,#34d399_0%,#10b981_40%,#047857_80%,#064e3b_100%)]",
      "shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-14px_28px_rgba(0,0,0,0.35),0_0_36px_-8px_rgba(16,185,129,0.5),0_18px_36px_-16px_rgba(0,0,0,0.9)]",
      "active:scale-[0.96]",
    ].join(" "),
    error: [
      "cursor-pointer",
      "bg-[radial-gradient(circle_at_32%_26%,#fbbf24_0%,#f59e0b_40%,#b45309_80%,#78350f_100%)]",
      "shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-14px_28px_rgba(0,0,0,0.35),0_0_36px_-8px_rgba(245,158,11,0.5),0_18px_36px_-16px_rgba(0,0,0,0.9)]",
      "active:scale-[0.96]",
    ].join(" "),
  };

  const HINT: Record<RecordState, string> = {
    idle: "Tap or hold to record",
    recording: "Tap — or release — to stop",
    processing: "Transcribing and structuring your note…",
    done: "Note saved · tap to record another",
    error: errorMsg || "Something went wrong",
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative">
        {/* Sonar rings while recording */}
        {state === "recording" && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-[rec-ring_2.4s_ease-out_infinite]"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-[rec-ring_2.4s_ease-out_infinite] [animation-delay:1.2s]"
            />
          </>
        )}

        {/* Spinner while processing */}
        {state === "processing" && (
          <span
            aria-hidden
            className="absolute -inset-1.5 rounded-full border-2 border-zinc-800 border-t-zinc-300 animate-spin [animation-duration:1.4s]"
          />
        )}

        {/* Recessed bezel with machined tick ring */}
        <div className="relative h-52 w-52 rounded-full bg-zinc-900 p-3.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85),inset_0_-1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(255,255,255,0.06)]">
          <div
            aria-hidden
            className="absolute inset-1.5 rounded-full opacity-70"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.22) 0deg 1.4deg, transparent 1.4deg 15deg)",
              WebkitMask:
                "radial-gradient(closest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
              mask: "radial-gradient(closest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
            }}
          />

          <button
            aria-label={HINT[state]}
            onPointerDown={
              state === "idle" || state === "recording"
                ? handlePointerDown
                : undefined
            }
            onPointerUp={state === "recording" ? handlePointerUp : undefined}
            onClick={
              state === "error" || state === "done" ? handleClick : undefined
            }
            className={`relative flex h-full w-full select-none touch-none items-center justify-center rounded-full text-white transition-all duration-300 ${FACE[state]}`}
          >
            {state === "idle" && (
              <svg
                viewBox="0 0 24 24"
                className="h-16 w-16 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <rect
                  x="9"
                  y="2.5"
                  width="6"
                  height="11.5"
                  rx="3"
                  fill="currentColor"
                  stroke="none"
                />
                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
                <line x1="12" y1="18" x2="12" y2="21" />
              </svg>
            )}

            {state === "recording" && (
              <span className="flex flex-col items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.25em] text-red-50/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-[rec-blink_1.2s_steps(1)_infinite]" />
                  REC
                </span>
                <span className="font-mono text-4xl font-medium tabular-nums tracking-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                  {fmt(duration)}
                </span>
                <span aria-hidden className="flex h-4 items-center gap-[3px]">
                  {[0.9, 1.15, 0.75, 1.3, 1.0, 0.85, 1.2].map((dur, i) => (
                    <span
                      key={i}
                      className="h-full w-[3px] origin-center rounded-full bg-white/75 animate-[rec-eq_1s_ease-in-out_infinite]"
                      style={{
                        animationDuration: `${dur}s`,
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                </span>
              </span>
            )}

            {state === "processing" && (
              <svg
                viewBox="0 0 24 24"
                className="h-14 w-14 text-zinc-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <rect
                  x="9"
                  y="2.5"
                  width="6"
                  height="11.5"
                  rx="3"
                  fill="currentColor"
                  stroke="none"
                />
                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
                <line x1="12" y1="18" x2="12" y2="21" />
              </svg>
            )}

            {state === "done" && (
              <svg
                viewBox="0 0 24 24"
                className="h-16 w-16 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}

            {state === "error" && (
              <span className="flex flex-col items-center gap-1.5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3.5L21.5 20h-19L12 3.5z" />
                  <line x1="12" y1="10" x2="12" y2="14.5" />
                  <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
                </svg>
                <span className="text-xs font-semibold tracking-wide">
                  {blobRef.current ? "Tap to retry" : "Tap to reset"}
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status line — fixed height so the layout never jumps */}
      <div className="flex h-10 flex-col items-center justify-start gap-1.5">
        <p
          className={`text-sm ${
            state === "error"
              ? "text-amber-400"
              : state === "recording"
                ? "text-zinc-400 animate-pulse"
                : "text-zinc-500"
          }`}
        >
          {HINT[state]}
        </p>
        {state === "error" && blobRef.current && (
          <button
            onClick={reset}
            className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
          >
            Discard recording
          </button>
        )}
      </div>
    </div>
  );
}
