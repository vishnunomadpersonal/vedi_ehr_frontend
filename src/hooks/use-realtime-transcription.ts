// ============================================================================
// Vedi EHR — Real-time Transcription Hook (EPIC 0.3)
//
// Uses MediaRecorder (webm/opus) → WebSocket → Backend → Deepgram nova-3-medical
// (diarize) → live diarised segments back to UI.
//
// MediaRecorder produces real audio reliably across all browsers, bypassing the
// AudioWorklet PCM16 pipeline that produces zero-filled buffers on certain
// Windows audio drivers / Chrome versions.
//
// A single MediaRecorder serves dual duty:
//   • 250ms timeslice chunks streamed to Deepgram via WS for real-time STT
//   • All chunks collected into a .webm Blob for playback / upload on stop
// ============================================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TranscriptSegment } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TranscriptionStatus =
  | 'idle'
  | 'connecting'
  | 'recording'
  | 'stopping'
  | 'completed'
  | 'error';

interface WSSegmentMessage {
  type: 'segment';
  data: Omit<TranscriptSegment, 'id'>[];
}

interface WSFinalMessage {
  type: 'final';
  data: {
    encounter_id: number;
    patient_id: string;
    segments: Omit<TranscriptSegment, 'id'>[];
    full_text: string;
    segment_count: number;
    word_count: number;
    confidence_avg: number;
  };
}

interface WSStatusMessage {
  type: 'status';
  data: { status: string; message: string; model: string };
}

interface WSErrorMessage {
  type: 'error';
  data: { message: string };
}

type WSMessage =
  | WSSegmentMessage
  | WSFinalMessage
  | WSStatusMessage
  | WSErrorMessage
  | { type: string };

export interface RealtimeTranscriptionResult {
  segments: Omit<TranscriptSegment, 'id'>[];
  fullText: string;
  stats: {
    segmentCount: number;
    wordCount: number;
    confidenceAvg: number;
  };
}

interface UseRealtimeTranscriptionOptions {
  /** e.g. "ws://localhost:8000" — falls back to NEXT_PUBLIC_WS_URL or auto-detect */
  wsBaseUrl?: string;
  /** Specific audio input device ID (from navigator.mediaDevices.enumerateDevices) */
  deviceId?: string;
  /** Called with each new batch of segments pushed from the backend */
  onSegment?: (segments: Omit<TranscriptSegment, 'id'>[]) => void;
  /** Called when the final transcript arrives after stop */
  onFinal?: (result: RealtimeTranscriptionResult) => void;
  /** Called on any error */
  onError?: (error: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWsBaseUrl(override?: string): string {
  if (override) return override;
  // Route through nginx proxy (same origin) — wss:// on HTTPS, ws:// on HTTP
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  return 'ws://localhost:8000';
}

// ─── Enumerate audio input devices ──────────────────────────────────────────

export async function getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  try {
    // Request temporary permission so we get device labels
    const tmpStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    tmpStream.getTracks().forEach((t) => t.stop());
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'audioinput');
  } catch {
    return [];
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useRealtimeTranscription(
  encounterId: string | number,
  patientId: string | number,
  options: UseRealtimeTranscriptionOptions = {}
) {
  const { wsBaseUrl, deviceId, onSegment, onFinal, onError } = options;

  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [segments, setSegments] = useState<Omit<TranscriptSegment, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [chunksSent, setChunksSent] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkCountRef = useRef<number>(0);

  // Audio level monitoring refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Keep callback refs fresh (avoid stale closures)
  const onSegmentRef = useRef(onSegment);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSegmentRef.current = onSegment;
  }, [onSegment]);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // ── Audio level monitoring ────────────────────────────────────────────

  const startLevelMonitor = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = ctx;

      // Use TIME-DOMAIN data (waveform) — much more reliable than frequency data
      // for detecting if the mic is actually picking up sound.
      // Values are centred at 128 (silence). Deviations from 128 = audio.
      const buf = new Uint8Array(analyser.fftSize);
      let logCounter = 0;
      const poll = () => {
        analyser.getByteTimeDomainData(buf);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128; // Normalise to -1..1
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / buf.length);
        // RMS of speech typically 0.02-0.3; scale to 0-100
        const level = Math.min(100, Math.round(rms * 350));
        setAudioLevel(level);

        // Log every ~2 seconds so we can see if values change
        if (logCounter++ % 120 === 0) {
          console.log(
            `[Transcription] Audio level: ${level}% (rms=${rms.toFixed(4)}, ctx.state=${ctx.state})`
          );
        }
        animFrameRef.current = requestAnimationFrame(poll);
      };
      // Resume AudioContext if suspended (Chrome autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('[Transcription] AudioContext resumed');
          poll();
        });
      } else {
        poll();
      }
      console.log(
        '[Transcription] Audio level monitor started (time-domain, fftSize=2048)'
      );
    } catch (e) {
      console.warn('[Transcription] Level monitor failed:', e);
    }
  }, []);

  const stopLevelMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // Stop level monitor
    stopLevelMonitor();

    // Stop MediaRecorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Release mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Close WS
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, [stopLevelMonitor]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // ── Start ─────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    try {
      setError(null);
      setSegments([]);
      setStatus('connecting');
      chunksRef.current = [];
      chunkCountRef.current = 0;
      setChunksSent(0);

      // 1. Request microphone access
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      };
      if (deviceId) {
        audioConstraints.deviceId = { exact: deviceId };
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });
      streamRef.current = stream;

      // Log which device we got
      const track = stream.getAudioTracks()[0];
      console.log(
        '[Transcription] Mic device:',
        track?.label,
        '| enabled:',
        track?.enabled,
        '| muted:',
        track?.muted
      );

      // Start audio level monitoring
      startLevelMonitor(stream);

      // 2. Determine best MIME type for MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      console.log(
        '[Transcription] Using MediaRecorder with mimeType:',
        mimeType
      );

      // 3. Open WebSocket to backend transcription endpoint
      const base = getWsBaseUrl(wsBaseUrl);
      const wsUrl = `${base}/api/v1/transcribe/ws/${encounterId}?patient_id=${patientId}`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      // 4. Create MediaRecorder — started once WS is open
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          // Collect chunk for final blob AND stream it to Deepgram via WS
          chunksRef.current.push(e.data);
          chunkCountRef.current += 1;
          const chunkNum = chunkCountRef.current;
          setChunksSent(chunkNum);
          if (ws.readyState === WebSocket.OPEN) {
            const buffer = await e.data.arrayBuffer();
            ws.send(buffer);
            if (chunkNum <= 5 || chunkNum % 20 === 0) {
              console.log(
                `[Transcription] Sent chunk #${chunkNum}: ${buffer.byteLength} bytes (ws=${ws.readyState})`
              );
            }
          } else {
            console.warn(
              `[Transcription] WS not open (state=${ws.readyState}), dropped chunk #${chunkNum}`
            );
          }
        }
      };

      ws.onopen = () => {
        // Tell backend we're sending webm/opus (not raw PCM16)
        ws.send(JSON.stringify({ type: 'config', encoding: mimeType }));
        // Start recording with 250ms timeslice for near real-time streaming
        recorder.start(250);
        setStatus('recording');
        console.log(
          '[Transcription] WS open, MediaRecorder started (250ms chunks)'
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);

          if (msg.type === 'segment') {
            const segMsg = msg as WSSegmentMessage;
            console.log(
              '[Transcription] Received segment:',
              segMsg.data.length,
              'items'
            );
            setSegments((prev) => [...prev, ...segMsg.data]);
            onSegmentRef.current?.(segMsg.data);
          } else if (msg.type === 'final') {
            const finalMsg = msg as WSFinalMessage;
            console.log(
              '[Transcription] Received final transcript:',
              finalMsg.data.segment_count,
              'segments'
            );
            const result: RealtimeTranscriptionResult = {
              segments: finalMsg.data.segments,
              fullText: finalMsg.data.full_text,
              stats: {
                segmentCount: finalMsg.data.segment_count,
                wordCount: finalMsg.data.word_count,
                confidenceAvg: finalMsg.data.confidence_avg
              }
            };
            setSegments(finalMsg.data.segments);
            setStatus('completed');
            onFinalRef.current?.(result);
            // Close WS now that we have the final transcript
            if (wsRef.current) {
              wsRef.current.close();
              wsRef.current = null;
            }
          } else if (msg.type === 'error') {
            const errMsg = msg as WSErrorMessage;
            setError(errMsg.data.message);
            onErrorRef.current?.(errMsg.data.message);
          } else if (msg.type === 'status') {
            console.log(
              '[Transcription] Status:',
              (msg as WSStatusMessage).data
            );
          }
          // utterance_end / pong — no special UI handling needed
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        const errText = 'WebSocket connection error — is the backend running?';
        setError(errText);
        setStatus('error');
        onErrorRef.current?.(errText);
      };

      ws.onclose = () => {
        // If we haven't explicitly stopped, mark as error
        setStatus((prev) =>
          prev === 'stopping' || prev === 'completed' ? prev : 'error'
        );
      };
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access.'
          : `Failed to start transcription: ${err instanceof Error ? err.message : String(err)}`;
      setError(message);
      setStatus('error');
      onErrorRef.current?.(message);
      cleanup();
    }
  }, [encounterId, patientId, wsBaseUrl, deviceId, cleanup, startLevelMonitor]);

  // ── Stop ──────────────────────────────────────────────────────────────

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      setStatus('stopping');

      // Send stop to backend (triggers final transcript)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
      }

      // Stop MediaRecorder to get blob, but keep WS alive for final transcript
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorderRef.current?.mimeType || 'audio/webm'
          });
          // Release mic tracks (stops browser recording indicator)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          mediaRecorderRef.current = null;
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        // Release mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        resolve(null);
      }

      // Safety: close WS after 10 seconds if final transcript never arrives
      setTimeout(() => {
        if (wsRef.current) {
          console.log('[Transcription] Safety timeout — closing WS');
          wsRef.current.close();
          wsRef.current = null;
        }
      }, 10000);
    });
  }, [cleanup]);

  // ── Reset (clear segments, return to idle) ────────────────────────────

  const reset = useCallback(() => {
    cleanup();
    setStatus('idle');
    setSegments([]);
    setError(null);
  }, [cleanup]);

  return {
    status,
    segments,
    error,
    audioLevel,
    chunksSent,
    start,
    stop,
    reset
  };
}
