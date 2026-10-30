import React from 'react'
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  RotateCcw,
  Clock,
  Send,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react'

interface InterviewAudioControlsProps {
  // TTS Controls
  isMuted: boolean
  speechRate: number
  isSpeaking: boolean
  onToggleMute: () => void
  onChangeSpeechRate: (rate: number) => void
  onReplayQuestion: () => void

  // Recording Controls
  isRecording: boolean
  isPaused: boolean
  elapsedSeconds: number
  totalSeconds: number
  audioLevel: number
  onStartRecording: () => void
  onPauseRecording: () => void
  onResumeRecording: () => void
  onStopRecording: () => void
  onReRecord: () => void
  onSubmitAnswer: () => void
  canSubmit: boolean
  isEvaluating: boolean
  recordingDisabled: boolean
}

export default function InterviewAudioControls({
  isMuted,
  speechRate,
  isSpeaking,
  onToggleMute,
  onChangeSpeechRate,
  onReplayQuestion,
  isRecording,
  isPaused,
  elapsedSeconds,
  totalSeconds,
  audioLevel,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onReRecord,
  onSubmitAnswer,
  canSubmit,
  isEvaluating,
  recordingDisabled,
}: InterviewAudioControlsProps) {
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const percentLeft = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Controls Row: Voice playback settings & Replay */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          paddingBottom: '12px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
            Interviewer Voice:
          </span>

          <button
            type="button"
            className="button button-quiet"
            style={{ padding: '5px 9px', fontSize: '11.5px' }}
            onClick={onReplayQuestion}
            title="Replay spoken question"
          >
            <RotateCcw size={13} />
            Replay Question
          </button>

          <button
            type="button"
            className="button button-quiet"
            style={{ padding: '5px 9px', fontSize: '11.5px' }}
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={13} color="#ef4444" /> : <Volume2 size={13} />}
            <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={13} color="#64748b" />
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Speech Speed:</span>
          {[0.8, 1.0, 1.2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onChangeSpeechRate(rate)}
              style={{
                background: speechRate === rate ? '#4f46e5' : '#ffffff',
                color: speechRate === rate ? '#ffffff' : '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Middle Row: Countdown Timer & Live Microphone Meter */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 1fr) minmax(200px, 1.5fr)',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Countdown Timer */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Clock size={13} />
              Answer Countdown
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color:
                  remainingSeconds < 15
                    ? '#dc2626'
                    : remainingSeconds < 30
                    ? '#d97706'
                    : '#059669',
              }}
            >
              {formatTime(remainingSeconds)}
            </span>
          </div>

          <div
            style={{
              height: '8px',
              width: '100%',
              background: '#e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percentLeft}%`,
                background:
                  remainingSeconds < 15
                    ? '#ef4444'
                    : remainingSeconds < 30
                    ? '#f59e0b'
                    : '#10b981',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {/* Real-time Microphone Input Level Indicator */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Mic size={13} color={isRecording ? '#16a34a' : '#64748b'} />
              Microphone Activity
            </span>
            <span style={{ fontSize: '11px', color: isRecording ? '#16a34a' : '#94a3b8' }}>
              {isRecording ? 'Listening live' : 'Not recording'}
            </span>
          </div>

          <div
            style={{
              height: '8px',
              width: '100%',
              background: '#e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${audioLevel}%`,
                background:
                  audioLevel > 75
                    ? '#ef4444'
                    : audioLevel > 50
                    ? '#f59e0b'
                    : 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                transition: 'width 0.08s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Candidate Recording Control Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isRecording ? (
            <button
              type="button"
              className="button button-primary"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                background: '#16a34a',
                borderColor: '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
              }}
              onClick={onStartRecording}
              title={
                isSpeaking
                  ? 'Click to answer immediately (interrupts question)'
                  : 'Start recording your answer'
              }
            >
              <Mic size={15} />
              {isSpeaking ? 'Speak Answer Now' : 'Start Recording'}
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                  onClick={onResumeRecording}
                >
                  <Play size={14} />
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                  onClick={onPauseRecording}
                >
                  <Pause size={14} />
                  Pause
                </button>
              )}

              <button
                type="button"
                className="button button-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderColor: '#fecaca',
                }}
                onClick={onStopRecording}
              >
                <Square size={14} fill="#b91c1c" />
                Stop Recording
              </button>
            </>
          )}

          <button
            type="button"
            className="button button-quiet"
            style={{ padding: '7px 12px', fontSize: '12px' }}
            onClick={onReRecord}
            disabled={isRecording}
          >
            <RotateCcw size={13} />
            Record Again
          </button>
        </div>

        {/* Submit Answer Action */}
        <button
          type="button"
          className="button button-primary"
          style={{
            padding: '9px 20px',
            fontSize: '13px',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={onSubmitAnswer}
          disabled={!canSubmit || isEvaluating || isRecording}
        >
          <Send size={14} />
          {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  )
}

