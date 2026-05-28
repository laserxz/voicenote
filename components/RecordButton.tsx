"use client";
import { useState, useRef } from "react";

type RecordState = "idle" | "recording" | "processing" | "done" | "error";

interface Props {
  onComplete: (result: { note: unknown; structured: unknown }) => void;
}

export function RecordButton({ onComplete }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = async () => {
    if (state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start(100);
      mediaRef.current = recorder;

      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(
        () => setDuration((d) => d + 1),
        1000
      );
      autoStopRef.current = setTimeout(() => stopRecording(), 300_000);
    } catch (err) {
      console.error("[record] mic error:", err);
      setState("error");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
  };

  const handleStop = async () => {
    setState("processing");
    const mimeType = mediaRef.current?.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const form = new FormData();
    form.append("audio", blob, "recording.webm");

    try {
      const res = await fetch("/api/notes/process", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Processing failed");
      }
      const data = await res.json();
      setState("done");
      onComplete(data);
    } catch (err) {
      console.error("[record] process error:", err);
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setDuration(0);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onPointerDown={state === "idle" ? startRecording : undefined}
        onPointerUp={state === "recording" ? stopRecording : undefined}
        onPointerLeave={state === "recording" ? stopRecording : undefined}
        onClick={state === "error" || state === "done" ? reset : undefined}
        className={[
          "w-36 h-36 rounded-full font-semibold text-sm select-none touch-none transition-all duration-200",
          state === "idle"
            ? "bg-red-500 hover:bg-red-400 active:scale-95 text-white shadow-lg shadow-red-500/30"
            : "",
          state === "recording"
            ? "bg-red-600 scale-110 animate-pulse text-white shadow-xl shadow-red-600/40"
            : "",
          state === "processing"
            ? "bg-zinc-700 cursor-wait text-zinc-300"
            : "",
          state === "done" ? "bg-emerald-600 text-white cursor-pointer" : "",
          state === "error"
            ? "bg-orange-600 text-white cursor-pointer"
            : "",
        ].join(" ")}
      >
        {state === "idle" && (
          <span className="flex flex-col items-center gap-1">
            <span className="text-2xl">🎙</span>
            <span>Hold to Record</span>
          </span>
        )}
        {state === "recording" && (
          <span className="flex flex-col items-center gap-1">
            <span className="text-2xl font-mono">{fmt(duration)}</span>
            <span className="text-xs opacity-75">Recording</span>
          </span>
        )}
        {state === "processing" && "Processing…"}
        {state === "done" && (
          <span className="flex flex-col items-center gap-1">
            <span className="text-2xl">✓</span>
            <span>Tap to reset</span>
          </span>
        )}
        {state === "error" && (
          <span className="flex flex-col items-center gap-1">
            <span className="text-2xl">⚠</span>
            <span>Tap to retry</span>
          </span>
        )}
      </button>

      {state === "recording" && (
        <p className="text-sm text-zinc-500 animate-pulse">
          Release to stop recording
        </p>
      )}
      {state === "processing" && (
        <p className="text-sm text-zinc-500">
          Transcribing and structuring your note…
        </p>
      )}
    </div>
  );
}
