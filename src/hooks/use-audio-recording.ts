// ============================================================================
// Vedi EHR — Audio Recording Hook (EPIC 0.3)
// Captures microphone audio using Web Audio API + MediaRecorder
// Streams chunks for real-time transcription (WebSocket ready)
// ============================================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  audioLevel: number;
}

interface UseAudioRecordingOptions {
  onAudioChunk?: (chunk: Blob) => void;
  onRecordingComplete?: (blob: Blob) => void;
  mimeType?: string;
  timeslice?: number; // ms between chunks
}

export function useAudioRecording(options: UseAudioRecordingOptions = {}) {
  const {
    onAudioChunk,
    onRecordingComplete,
    mimeType = 'audio/webm;codecs=opus',
    timeslice = 1000
  } = options;

  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
    audioLevel: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average =
      dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalized = Math.min(average / 128, 1);

    setState((prev) => ({ ...prev, audioLevel: normalized }));
    animFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });
      streamRef.current = stream;

      // Audio analysis for level meter
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start recorder
      const selectedMime = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          onAudioChunk?.(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMime });
        onRecordingComplete?.(blob);
      };

      recorder.start(timeslice);

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime) / 1000)
        }));
      }, 1000);

      // Start audio level monitoring
      updateAudioLevel();

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
        audioLevel: 0
      });
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access in your browser settings.'
          : 'Failed to start recording. Please check your microphone.';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [
    mimeType,
    timeslice,
    onAudioChunk,
    onRecordingComplete,
    updateAudioLevel
  ]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      audioLevel: 0
    }));
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      const currentDuration = state.duration;
      const resumeTime = Date.now();
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration:
            currentDuration + Math.floor((Date.now() - resumeTime) / 1000)
        }));
      }, 1000);
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.duration]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
}
