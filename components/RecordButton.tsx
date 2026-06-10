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

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onPointerDown={
          state === "idle" || state === "recording" ? handlePointerDown : undefined
        }
        onPointerUp={state === "recording" ? handlePointerUp : undefined}
        onClick={state === "error" || state === "done" ? handleClick : undefined}
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
            <span>Tap or hold to record</span>
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
            <span>{blobRef.current ? "Tap to retry" : "Tap to reset"}</span>
          </span>
        )}
      </button>

      {state === "recording" && (
        <p className="text-sm text-zinc-500 animate-pulse">
          Tap (or release) to stop
        </p>
      )}
      {state === "processing" && (
        <p className="text-sm text-zinc-500">
          Transcribing and structuring your note…
        </p>
      )}
      {state === "error" && (
        <div className="flex flex-col items-center gap-2">
          {errorMsg && <p className="text-sm text-orange-400">{errorMsg}</p>}
          {blobRef.current && (
            <button
              onClick={reset}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Discard recording
            </button>
          )}
        </div>
      )}
    </div>
  );
}
