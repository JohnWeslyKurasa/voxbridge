"use client";

import { useEffect, useRef } from "react";
import { Mic, Pause, Play, Square, RotateCcw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMicrophoneRecorder } from "@/hooks/useMicrophoneRecorder";

export interface MicrophoneRecorderProps {
  /** Called when recording is finalised and user is ready to upload the blob */
  onRecordingReady: (blob: Blob, filename: string, transcriptText?: string) => void;
}

/**
 * MicrophoneRecorder — Live Microphone Recording UI Component
 *
 * Why it is needed:
 * - Provides the user interface for the "Record Voice" input mode.
 * - Shows a live waveform animation, recording timer, and recording controls.
 *
 * How it works:
 * 1. Uses the `useMicrophoneRecorder` hook for all recording state management.
 * 2. The AnalyserNode from the hook drives a canvas-based waveform visualisation.
 * 3. Controls:
 *    - Start: requests mic permission and begins recording
 *    - Pause / Resume: pauses/resumes the MediaRecorder
 *    - Stop: finalises the recording into a Blob
 *    - Use Recording: sends the blob to the parent via onRecordingReady()
 *    - Re-record: resets all state
 */
export default function MicrophoneRecorder({ onRecordingReady }: MicrophoneRecorderProps) {
  const {
    state,
    audioBlob,
    audioUrl,
    durationSeconds,
    error,
    transcriptText,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    analyserNode,
  } = useMicrophoneRecorder();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Waveform Animation ─────────────────────────────────────────────────────
  // Draws a real-time oscilloscope waveform using the Web Audio AnalyserNode.
  useEffect(() => {
    if (!analyserNode || state !== "recording") {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#3b82f6"; // Blue-500
      ctx.beginPath();

      const sliceWidth = W / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, state]);

  /** Format seconds into MM:SS display */
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /** Send the recorded blob to the parent upload pipeline */
  const handleUseRecording = () => {
    if (audioBlob) {
      const filename = `voice_recording_${Date.now()}.webm`;
      onRecordingReady(audioBlob, filename, transcriptText);
    }
  };

  return (
    <div className="w-full rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/30 p-8 space-y-6 text-center">
      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-left"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle State */}
      {state === "idle" && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center">
              <Mic className="h-10 w-10 text-rose-500" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-800">Record Your Voice</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Click Start to record. We&apos;ll transcribe and translate your speech automatically.
              </p>
            </div>
          </div>
          <button
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-xl gradient-bg px-6 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/20 hover:opacity-90 transition-all"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </button>
        </div>
      )}

      {/* Requesting Permission State */}
      {state === "requesting" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-16 w-16 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Requesting microphone access...</p>
        </div>
      )}

      {/* Recording / Paused State */}
      {(state === "recording" || state === "paused") && (
        <div className="space-y-5">
          {/* Recording indicator + timer */}
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={state === "recording" ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : { scale: 1, opacity: 0.5 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="h-3 w-3 rounded-full bg-rose-500"
            />
            <span className="font-mono text-2xl font-black text-slate-800">
              {formatDuration(durationSeconds)}
            </span>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
              {state === "paused" ? "PAUSED" : "REC"}
            </span>
          </div>

          {/* Live Waveform Canvas */}
          <div className="w-full h-16 rounded-xl bg-white border border-slate-100 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" width={600} height={64} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {state === "recording" ? (
              <button
                onClick={pauseRecording}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
            )}

            <button
              onClick={stopRecording}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/20"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Stopped — Preview and Confirm */}
      {state === "stopped" && audioUrl && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-slate-800">Recording Complete</p>
            <p className="text-xs text-slate-500">Duration: {formatDuration(durationSeconds)}</p>
          </div>

          {/* Audio Playback Preview */}
          <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-record
            </button>
            <button
              onClick={handleUseRecording}
              className="flex items-center gap-2 rounded-xl gradient-bg px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-90 transition-all"
            >
              <Mic className="h-4 w-4" />
              Use This Recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
