"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { extractSpeechFromMediaFile } from "@/utils/extractVideoSpeech";

export type RecorderState = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

export interface UseMicrophoneRecorderReturn {
  state: RecorderState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationSeconds: number;
  error: string | null;
  transcriptText: string;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  analyserNode: AnalyserNode | null; // Expose for waveform visualisation
}

/**
 * useMicrophoneRecorder — Browser MediaRecorder Hook
 *
 * Why it is needed:
 * - Encapsulates all microphone recording logic in a reusable hook.
 * - Handles permission requests, MediaRecorder state management, and audio blob assembly.
 * - Exposes the Web Audio API AnalyserNode so the UI can draw a live waveform.
 *
 * How it works:
 * 1. Calls getUserMedia() to request microphone access.
 * 2. Creates a MediaRecorder from the stream.
 * 3. Collects audio chunks on the `ondataavailable` event.
 * 4. On stop, assembles chunks into a single Blob and creates an object URL.
 * 5. AnalyserNode is connected to the stream for real-time waveform data.
 *
 * Supported MIME types (in order of preference):
 * - audio/webm;codecs=opus (Chrome, Edge)
 * - audio/ogg;codecs=opus (Firefox)
 * - audio/mp4 (Safari)
 * - audio/webm (fallback)
 */
export function useMicrophoneRecorder(): UseMicrophoneRecorderReturn {
  const [state, setState]           = useState<RecorderState>("idle");
  const [audioBlob, setAudioBlob]   = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl]     = useState<string | null>(null);
  const [durationSeconds, setDuration] = useState(0);
  const [error, setError]           = useState<string | null>(null);
  const [analyserNode, setAnalyser] = useState<AnalyserNode | null>(null);
  const [transcriptText, setTranscriptText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef   = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Stop all media tracks and clear timer */
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    audioCtxRef.current = null;
  }, []);

  /** Choose the best supported MIME type for the current browser */
  const getSupportedMimeType = (): string => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/webm",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  };

  /** Request microphone and start recording */
  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setTranscriptText("");
    audioChunksRef.current = [];

    setState("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,  // Whisper prefers 16kHz
        },
      });
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access in your browser settings."
          : err instanceof DOMException && err.name === "NotFoundError"
          ? "No microphone found. Please connect a microphone and try again."
          : "Could not access microphone. Please check your device settings.";
      setError(message);
      setState("error");
      return;
    }

    streamRef.current = stream;

    // Set up Web Audio API analyser for waveform visualization
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    setAnalyser(analyser);

    // Create MediaRecorder
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    // Collect audio data chunks
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    const transcriptRef = { current: "" };

    // On recording stop — assemble blob and create URL
    recorder.onstop = async () => {
      const mimeUsed = recorder.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeUsed });
      const url  = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);

      if (!transcriptRef.current) {
        const fileObj = new File([blob], "voice_recording.webm", { type: mimeUsed });
        const extracted = await extractSpeechFromMediaFile(fileObj);
        if (extracted) {
          setTranscriptText(extracted);
          transcriptRef.current = extracted;
        }
      }

      setState("stopped");
      cleanup();
    };

    // Start Web Speech Recognition engine if supported by browser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          if (text.trim()) {
            transcriptRef.current = text.trim();
            setTranscriptText(text.trim());
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("Speech recognition warning:", e);
      }
    }

    // Start recording and timer
    recorder.start(100); // Collect data every 100ms
    setState("recording");

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, [cleanup]);

  /** Pause an active recording */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  /** Resume a paused recording */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, []);

  /** Stop and finalise recording */
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop(); // triggers onstop → assembles blob
    }
  }, []);

  /** Reset all state back to idle */
  const reset = useCallback(() => {
    cleanup();
    setState("idle");
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setAnalyser(null);
    audioChunksRef.current = [];
  }, [cleanup]);

  return {
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
  };
}
