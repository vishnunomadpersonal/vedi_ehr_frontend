'use client';

import {
  useEhrShow,
  useEhrUpdate,
  useEhrCreate,
  useEhrList
} from '@/hooks/use-ehr-data';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Square,
  User,
  Stethoscope,
  Wifi,
  WifiOff,
  Volume2,
  Play
} from 'lucide-react';
import Link from 'next/link';
import {
  useRealtimeTranscription,
  getAudioInputDevices,
  type RealtimeTranscriptionResult
} from '@/hooks/use-realtime-transcription';
import type {
  Encounter,
  TranscriptSegment,
  Recording,
  Transcript,
  Patient
} from '@/types';
import { PatientSummary } from '@/components/clinical/patient-summary';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function RecordingPage() {
  const params = useParams();
  const router = useRouter();
  const encounterId = params.encounterId as string;

  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [currentRecordingId, setCurrentRecordingId] = useState<number | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<string | null>(null);

  // Mic device selector
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Load available audio devices on mount
  useEffect(() => {
    getAudioInputDevices().then((devices) => {
      setAudioDevices(devices);
      if (devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Blob URL for playback
  const playbackUrl = useMemo(
    () => (recordingBlob ? URL.createObjectURL(recordingBlob) : null),
    [recordingBlob]
  );
  // Cleanup blob URL on unmount / new blob
  useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, [playbackUrl]);

  const { query } = useEhrShow<Encounter>({
    resource: 'encounters',
    id: encounterId
  });

  const encounter = query.data?.data;

  const { query: patientQuery } = useEhrShow<Patient>({
    resource: 'patients',
    id: encounter?.patient_id ?? '',
    queryOptions: { enabled: !!encounter?.patient_id }
  });
  const patient = patientQuery.data?.data;
  const { mutate: updateEncounter } = useEhrUpdate();
  const { mutate: createRecording } = useEhrCreate<Recording>();
  const { mutate: updateRecording } = useEhrUpdate();
  const { mutate: createTranscript } = useEhrCreate<Transcript>();

  // Load existing transcript for this encounter (if any)
  const { result: existingTranscriptsResult } = useEhrList<Transcript>({
    resource: 'transcripts',
    filters: [{ field: 'encounter_id', operator: 'eq', value: encounterId }],
    pagination: { currentPage: 1, pageSize: 1 }
  });

  // ── Real-time transcription via Deepgram WebSocket ────────────────────
  const finalResultRef = useRef<RealtimeTranscriptionResult | null>(null);

  const {
    status: transcriptionStatus,
    segments: transcriptSegments,
    error: transcriptionError,
    audioLevel,
    chunksSent,
    start: startTranscription,
    stop: stopTranscription,
    reset: resetTranscription
  } = useRealtimeTranscription(
    encounterId,
    String(encounter?.patient_id || ''),
    {
      deviceId: selectedDeviceId || undefined,
      onFinal: (result) => {
        finalResultRef.current = result;
      },
      onError: (err) => {
        console.error('[Transcription WS Error]', err);
      }
    }
  );

  const isRecording =
    transcriptionStatus === 'recording' || transcriptionStatus === 'connecting';

  // Pre-populate transcript segments from existing data
  useEffect(() => {
    const existing = existingTranscriptsResult?.data?.[0];
    if (
      existing?.segments?.length &&
      transcriptSegments.length === 0 &&
      transcriptionStatus === 'idle'
    ) {
      // Transcription hook owns `segments` state, so we can't set it externally.
      // We display existing segments in a separate ref if needed.
    }
  }, [
    existingTranscriptsResult,
    transcriptSegments.length,
    transcriptionStatus
  ]);

  // Duration timer
  useEffect(() => {
    if (transcriptionStatus === 'recording') {
      const startMs = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [transcriptionStatus]);

  const handleStartRecording = async () => {
    recordingStartTime.current = new Date().toISOString();
    setDuration(0);
    finalResultRef.current = null;

    // Start real-time transcription (mic + WebSocket + Deepgram)
    await startTranscription();

    // Create a recording record in the backend
    createRecording(
      {
        resource: 'recordings',
        values: {
          encounter_id: Number(encounterId),
          patient_id: String(encounter?.patient_id || ''),
          format: 'webm',
          mime_type: 'audio/webm;codecs=opus',
          sample_rate: 48000, // WebM/Opus default
          channels: 1,
          status: 'recording',
          device_info: `${navigator.userAgent.slice(0, 100)}`,
          recording_started_at: recordingStartTime.current
        }
      },
      {
        onSuccess: (data: any) => {
          const rec = data?.data;
          setCurrentRecordingId(rec?.recording_id ?? rec?.id ?? null);
        }
      }
    );

    // Update encounter status to in_progress
    if (encounter?.status === 'scheduled') {
      updateEncounter({
        resource: 'encounters',
        id: encounterId,
        values: { status: 'in_progress', started_at: new Date().toISOString() }
      });
    }
  };

  const handleStopRecording = async () => {
    // Stop transcription — returns a webm blob from the parallel MediaRecorder
    const blob = await stopTranscription();
    if (blob) setRecordingBlob(blob);

    // Update recording status + duration
    if (currentRecordingId) {
      updateRecording({
        resource: 'recordings',
        id: currentRecordingId,
        values: {
          status: 'completed',
          duration_seconds: duration,
          recording_ended_at: new Date().toISOString()
        }
      });
    }
  };

  /** Save transcript segments and finish encounter */
  const handleFinishEncounter = async () => {
    setSaving(true);

    // Save transcript to backend if we have segments
    const segs = finalResultRef.current?.segments ?? transcriptSegments;
    if (segs.length > 0) {
      const segments = segs.map((seg, i) => ({
        id: `seg-${i + 1}`,
        speaker: seg.speaker,
        text: seg.text,
        start_time: seg.start_time,
        end_time: seg.end_time,
        confidence: seg.confidence
      }));

      createTranscript({
        resource: 'transcripts',
        values: {
          encounter_id: Number(encounterId),
          recording_id: currentRecordingId,
          patient_id: String(encounter?.patient_id || ''),
          segments,
          language: 'en',
          stt_provider: 'deepgram',
          stt_model: 'nova-3-medical',
          status: 'completed'
        }
      });
    }

    // Update encounter with transcript summary (keep in_progress — doctor signs later on chart)
    updateEncounter({
      resource: 'encounters',
      id: encounterId,
      values: {
        ended_at: new Date().toISOString(),
        summary:
          segs.length > 0
            ? segs.map((s) => `${s.speaker}: ${s.text}`).join('\n')
            : undefined
      }
    });

    setSaving(false);
    router.push(`/dashboard/encounters/${encounterId}/chart`);
  };

  if (query.isLoading) {
    return (
      <div className='max-w-3xl space-y-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className='py-12 text-center'>
        <p className='text-muted-foreground'>Encounter not found</p>
        <Button asChild variant='link' className='mt-2'>
          <Link href='/dashboard/encounters'>Back to encounters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-6'>
      {/* Patient Sidebar */}
      <aside className='hidden w-72 shrink-0 lg:block'>
        <Card className='h-full overflow-hidden'>
          {patient ? (
            <PatientSummary patient={patient} />
          ) : (
            <div className='space-y-3 p-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
            </div>
          )}
        </Card>
      </aside>

      {/* Main content */}
      <div className='flex min-w-0 flex-1 flex-col gap-4 overflow-hidden'>
        {/* Header */}
        <div className='flex shrink-0 items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button asChild variant='ghost' size='icon' className='h-8 w-8'>
              <Link href={`/dashboard/encounters/${encounterId}`}>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
            <div>
              <h1 className='text-xl font-bold tracking-tight'>
                Session Recording
              </h1>
              <p className='text-muted-foreground text-sm'>
                {encounter.patient_name} &middot;{' '}
                {encounter.chief_complaint || 'Clinical session'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {transcriptionStatus === 'recording' && (
              <Badge
                variant='outline'
                className='gap-1 border-green-600/30 text-green-600'
              >
                <Wifi className='h-3 w-3' />
                Deepgram Live
              </Badge>
            )}
            {transcriptionStatus === 'error' && (
              <Badge
                variant='outline'
                className='gap-1 border-red-600/30 text-red-600'
              >
                <WifiOff className='h-3 w-3' />
                Disconnected
              </Badge>
            )}
            {!isRecording && transcriptSegments.length > 0 && (
              <Button
                size='sm'
                onClick={handleFinishEncounter}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Finish & Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Two-column: Recording controls + Live Transcript */}
        <div className='grid min-h-0 flex-1 gap-4 md:grid-cols-[340px_1fr]'>
          {/* Left: Recording Controls */}
          <div className='space-y-4'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex flex-col items-center gap-6'>
                  {/* Audio Level Indicator */}
                  <div className='relative'>
                    <div
                      className={`flex h-32 w-32 items-center justify-center rounded-full transition-all duration-200 ${
                        isRecording
                          ? 'border-2 border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                          : 'bg-muted border-muted-foreground/20 border-2'
                      }`}
                      style={
                        isRecording
                          ? {
                              boxShadow: `0 0 ${12 + audioLevel * 0.4}px ${4 + audioLevel * 0.2}px rgba(239,68,68,${0.1 + audioLevel * 0.006})`
                            }
                          : undefined
                      }
                    >
                      {isRecording ? (
                        <Mic className='h-12 w-12 text-red-500' />
                      ) : (
                        <MicOff className='text-muted-foreground h-12 w-12' />
                      )}
                    </div>
                    {isRecording && (
                      <div className='absolute -top-1 -right-1'>
                        <span className='relative flex h-4 w-4'>
                          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
                          <span className='relative inline-flex h-4 w-4 rounded-full bg-red-500' />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Audio Level Bar */}
                  {isRecording && (
                    <div className='w-full space-y-1'>
                      <div className='flex items-center gap-2'>
                        <Volume2 className='text-muted-foreground h-3.5 w-3.5' />
                        <div className='bg-muted h-3 flex-1 overflow-hidden rounded-full'>
                          <div
                            className={`h-full rounded-full transition-all duration-75 ${
                              audioLevel > 60
                                ? 'bg-green-500'
                                : audioLevel > 20
                                  ? 'bg-yellow-500'
                                  : audioLevel > 0
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${audioLevel}%` }}
                          />
                        </div>
                        <span className='text-muted-foreground w-8 text-right text-xs tabular-nums'>
                          {audioLevel}%
                        </span>
                      </div>
                      {audioLevel === 0 && (
                        <p className='text-center text-xs font-medium text-red-500'>
                          ⚠ No audio detected — check your microphone!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Timer */}
                  <div className='text-center'>
                    <p className='font-mono text-4xl font-bold tracking-wider'>
                      {formatTime(duration)}
                    </p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {transcriptionStatus === 'connecting'
                        ? 'Connecting to Deepgram...'
                        : transcriptionStatus === 'recording'
                          ? 'Recording & Transcribing...'
                          : transcriptionStatus === 'stopping'
                            ? 'Finalizing transcript...'
                            : transcriptionStatus === 'completed'
                              ? 'Recording complete'
                              : transcriptionStatus === 'error'
                                ? 'Connection error'
                                : 'Ready to record'}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className='flex items-center gap-3'>
                    {transcriptionStatus === 'idle' && (
                      <Button
                        size='lg'
                        className='bg-red-600 text-white hover:bg-red-700'
                        onClick={handleStartRecording}
                      >
                        <Mic className='mr-2 h-5 w-5' />
                        Start Recording
                      </Button>
                    )}

                    {transcriptionStatus === 'connecting' && (
                      <Button size='lg' variant='outline' disabled>
                        <Mic className='mr-2 h-5 w-5 animate-pulse' />
                        Connecting...
                      </Button>
                    )}

                    {transcriptionStatus === 'recording' && (
                      <Button
                        size='lg'
                        variant='destructive'
                        onClick={handleStopRecording}
                      >
                        <Square className='mr-2 h-5 w-5' />
                        Stop
                      </Button>
                    )}

                    {(transcriptionStatus === 'completed' ||
                      transcriptionStatus === 'error') && (
                      <Button
                        size='lg'
                        className='bg-red-600 text-white hover:bg-red-700'
                        onClick={() => {
                          resetTranscription();
                          setRecordingBlob(null);
                          setCurrentRecordingId(null);
                          setDuration(0);
                        }}
                      >
                        <Mic className='mr-2 h-5 w-5' />
                        Record Again
                      </Button>
                    )}
                  </div>

                  {transcriptionError && (
                    <div className='bg-destructive/10 border-destructive/20 text-destructive w-full rounded-md border px-4 py-3 text-sm'>
                      {transcriptionError}
                    </div>
                  )}

                  {/* Mic Device Selector */}
                  {transcriptionStatus === 'idle' &&
                    audioDevices.length > 0 && (
                      <div className='w-full space-y-1.5'>
                        <label className='text-muted-foreground text-xs font-medium'>
                          Microphone
                        </label>
                        <Select
                          value={selectedDeviceId}
                          onValueChange={setSelectedDeviceId}
                        >
                          <SelectTrigger className='w-full text-sm'>
                            <SelectValue placeholder='Select microphone' />
                          </SelectTrigger>
                          <SelectContent>
                            {audioDevices.map((d) => (
                              <SelectItem key={d.deviceId} value={d.deviceId}>
                                {d.label ||
                                  `Microphone ${d.deviceId.slice(0, 8)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  {/* Audio Playback */}
                  {playbackUrl &&
                    (transcriptionStatus === 'completed' ||
                      transcriptionStatus === 'idle') && (
                      <div className='w-full space-y-1.5'>
                        <label className='text-muted-foreground flex items-center gap-1 text-xs font-medium'>
                          <Play className='h-3 w-3' /> Playback Recording
                        </label>
                        <audio
                          controls
                          src={playbackUrl}
                          className='h-10 w-full'
                        />
                        <p className='text-muted-foreground text-center text-[10px]'>
                          If playback is silent, your mic was not capturing
                          audio
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Connection Status Bar */}
            {transcriptionStatus === 'recording' && (
              <Card>
                <CardContent className='space-y-2 pt-4'>
                  <div className='flex items-center gap-3'>
                    <span className='text-muted-foreground w-14 text-xs'>
                      Status
                    </span>
                    <div className='flex items-center gap-2 text-sm text-green-600'>
                      <Wifi className='h-3.5 w-3.5' />
                      <span>
                        Deepgram nova-3-medical &middot; Diarization ON
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-muted-foreground w-14 text-xs'>
                      Chunks
                    </span>
                    <span className='text-xs tabular-nums'>
                      {chunksSent} sent
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Live Transcript — full height */}
          <Card className='flex min-h-0 flex-col'>
            <CardHeader className='shrink-0 pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>Live Transcript</CardTitle>
                {transcriptSegments.length > 0 && (
                  <Badge variant='secondary' className='text-xs'>
                    {transcriptSegments.length} segments
                  </Badge>
                )}
              </div>
              <CardDescription>
                {transcriptSegments.length > 0
                  ? 'Real-time transcription from Deepgram'
                  : 'Transcript will appear here during recording'}
              </CardDescription>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 pb-4'>
              {transcriptSegments.length === 0 ? (
                <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
                  <Mic className='mb-3 h-8 w-8 opacity-40' />
                  <p className='text-sm'>
                    Start recording to see live transcription
                  </p>
                </div>
              ) : (
                <ScrollArea className='h-full pr-3'>
                  <div className='space-y-4'>
                    {transcriptSegments.map((segment, index) => {
                      const isDoctor = segment.speaker === 'doctor';
                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-2 ${isDoctor ? 'justify-start' : 'justify-end'}`}
                        >
                          {isDoctor && (
                            <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20'>
                              <Stethoscope className='h-3.5 w-3.5 text-blue-400' />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] ${isDoctor ? '' : 'text-right'}`}
                          >
                            <div
                              className={`rounded-2xl px-3 py-2 text-sm ${
                                isDoctor
                                  ? 'bg-muted/60 rounded-tl-sm'
                                  : 'bg-primary/10 rounded-tr-sm'
                              }`}
                            >
                              {segment.text}
                            </div>
                            <div className='mt-0.5 flex items-center gap-1.5 px-1'>
                              <span className='text-muted-foreground text-[10px]'>
                                {formatTime(Math.floor(segment.start_time))}{' '}
                                &mdash;{' '}
                                {formatTime(Math.floor(segment.end_time))}
                              </span>
                              {segment.confidence < 0.95 && (
                                <span className='text-[10px] text-amber-500'>
                                  &#9650; {Math.round(segment.confidence * 100)}
                                  %
                                </span>
                              )}
                            </div>
                          </div>
                          {!isDoctor && (
                            <div className='bg-primary/20 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full'>
                              <span className='text-primary text-[10px] font-bold'>
                                Pt
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isRecording && (
                      <div className='flex items-center gap-2 pl-9'>
                        <div className='flex gap-1'>
                          <span
                            className='bg-primary h-2 w-2 animate-bounce rounded-full'
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className='bg-primary h-2 w-2 animate-bounce rounded-full'
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className='bg-primary h-2 w-2 animate-bounce rounded-full'
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                        <span className='text-muted-foreground text-xs'>
                          Listening...
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
