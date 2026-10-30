import React from 'react'
import {
  Volume2,
  VolumeX,
  Mic,
  BrainCircuit,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import type { AvatarAnimationState } from '../../types'

interface AIInterviewerAvatarProps {
  voice: 'female' | 'male'
  state: AvatarAnimationState
  currentPrompt?: string
  conversationalLeadIn?: string
  isMuted?: boolean
  onToggleMute?: () => void
  onReplayQuestion?: () => void
  onRetry?: () => void
  isFollowUp?: boolean
}

export default function AIInterviewerAvatar({
  voice,
  state,
  currentPrompt,
  conversationalLeadIn,
  isMuted = false,
  onToggleMute,
  onReplayQuestion,
  onRetry,
  isFollowUp = false,
}: AIInterviewerAvatarProps) {
  const avatarImg =
    voice === 'female' ? '/interviewer_female.jpg' : '/interviewer_male.jpg'
  const interviewerName =
    voice === 'female' ? 'Sarah (AI Interviewer)' : 'David (AI Interviewer)'

  // State metadata
  const stateMeta = {
    idle: {
      label: 'AI Interviewer',
      color: '#6366f1',
      bg: '#e0e7ff',
      dotColor: '#4f46e5',
      icon: Sparkles,
      description: 'Ready to proceed',
    },
    speaking: {
      label: 'Speaking Question',
      color: '#4f46e5',
      bg: '#ede9fe',
      dotColor: '#7c3aed',
      icon: Volume2,
      description: 'Listen carefully to the question',
    },
    listening: {
      label: 'Listening to You',
      color: '#15803d',
      bg: '#dcfce7',
      dotColor: '#22c55e',
      icon: Mic,
      description: 'Your turn. Please answer clearly into your microphone.',
    },
    thinking: {
      label: 'Analyzing Response',
      color: '#d97706',
      bg: '#fef3c7',
      dotColor: '#f59e0b',
      icon: BrainCircuit,
      description: 'Synthesizing key concepts and problem-solving flow...',
    },
    evaluating: {
      label: 'Evaluating Technical Criteria',
      color: '#7c3aed',
      bg: '#f3e8ff',
      dotColor: '#a855f7',
      icon: Sparkles,
      description: 'Generating feedback metrics & dynamic follow-up...',
    },
    error: {
      label: 'Interruption Occurred',
      color: '#b91c1c',
      bg: '#fee2e2',
      dotColor: '#ef4444',
      icon: AlertCircle,
      description: 'Audio or evaluation encountered an issue.',
    },
  }[state]

  const StateIcon = stateMeta.icon

  return (
    <div
      className="panel"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '20px 24px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes avatarBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes soundWaveRipple {
          0% {
            transform: scale(0.96);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.35;
          }
          100% {
            transform: scale(1.18);
            opacity: 0;
          }
        }

        @keyframes listeningPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(34, 197, 94, 0);
          }
        }

        @keyframes orbitSpinner {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes scanBeam {
          0% { top: -10%; opacity: 0; }
          40% { opacity: 0.7; }
          100% { top: 110%; opacity: 0; }
        }

        @keyframes barDance {
          0%, 100% { height: 4px; }
          50% { height: 18px; }
        }
      `}</style>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 230px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Left: Avatar Visual Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Avatar Stage Circle with Animation Overlays */}
          <div
            style={{
              position: 'relative',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {/* Speaking concentric ripples */}
            {state === 'speaking' && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    border: '2px solid rgba(99, 102, 241, 0.6)',
                    animation: 'soundWaveRipple 2s infinite ease-out',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '-18px',
                    borderRadius: '50%',
                    border: '2px solid rgba(124, 58, 237, 0.4)',
                    animation: 'soundWaveRipple 2s infinite 0.6s ease-out',
                    pointerEvents: 'none',
                  }}
                />
              </>
            )}

            {/* Thinking / Evaluating Orbit Ring */}
            {(state === 'thinking' || state === 'evaluating') && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: '50%',
                  border: '2px dashed #818cf8',
                  animation: 'orbitSpinner 4s linear infinite',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Avatar Image Circle */}
            <div
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                boxShadow:
                  state === 'listening'
                    ? '0 0 25px rgba(34, 197, 94, 0.35)'
                    : state === 'speaking'
                    ? '0 0 25px rgba(99, 102, 241, 0.35)'
                    : '0 8px 24px rgba(15, 23, 42, 0.12)',
                border:
                  state === 'listening'
                    ? '3px solid #22c55e'
                    : state === 'speaking'
                    ? '3px solid #6366f1'
                    : state === 'error'
                    ? '3px solid #ef4444'
                    : '3px solid #e2e8f0',
                animation: state === 'idle' ? 'avatarBreathe 4s infinite ease-in-out' : 'none',
                transition: 'border 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <img
                src={avatarImg}
                alt={interviewerName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Scanning effect during evaluation */}
              {state === 'evaluating' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '24px',
                    background:
                      'linear-gradient(180deg, rgba(168, 85, 247, 0) 0%, rgba(168, 85, 247, 0.65) 50%, rgba(168, 85, 247, 0) 100%)',
                    animation: 'scanBeam 2s infinite ease-in-out',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Speaking Equalizer Bar Overlay on Bottom of Avatar */}
              {state === 'speaking' && !isMuted && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '3px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5].map((delay, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '3px',
                        background: '#818cf8',
                        borderRadius: '2px',
                        animation: `barDance 0.8s infinite ease-in-out ${delay}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Avatar Name and Voice Badge */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <strong style={{ fontSize: '13.5px', color: '#1e293b', display: 'block' }}>
              {interviewerName}
            </strong>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
              {voice} voice · CareerVerse AI
            </span>
          </div>
        </div>

        {/* Right: State Notification & Interactive Dialogue Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Top Status Pill & Quick Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '4px 11px',
                  borderRadius: '20px',
                  background: stateMeta.bg,
                  color: stateMeta.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: stateMeta.dotColor,
                    boxShadow: `0 0 6px ${stateMeta.dotColor}`,
                  }}
                />
                <StateIcon size={13} />
                {stateMeta.label}
              </span>

              {isFollowUp && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                >
                  Dynamic Follow-up Question
                </span>
              )}
            </div>

            {/* Replay & Mute Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {onReplayQuestion && (
                <button
                  type="button"
                  className="button button-quiet"
                  style={{ padding: '6px 10px', fontSize: '11.5px' }}
                  onClick={onReplayQuestion}
                  title="Replay spoken question"
                >
                  <RotateCcw size={13} />
                  Replay
                </button>
              )}

              {onToggleMute && (
                <button
                  type="button"
                  className="button button-quiet"
                  style={{ padding: '6px 10px', fontSize: '11.5px' }}
                  onClick={onToggleMute}
                  title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                >
                  {isMuted ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} />}
                  <span>{isMuted ? 'Muted' : 'Sound On'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Conversational Lead-in Speech Bubble */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              position: 'relative',
            }}
          >
            {conversationalLeadIn && (
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#4f46e5',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{conversationalLeadIn}&rdquo;
              </p>
            )}

            <p
              style={{
                margin: 0,
                fontSize: '13.5px',
                color: '#334155',
                lineHeight: 1.6,
              }}
            >
              {currentPrompt || stateMeta.description}
            </p>

            {/* Error Retry Button */}
            {state === 'error' && onRetry && (
              <button
                type="button"
                className="button button-secondary"
                style={{ marginTop: '10px', padding: '6px 12px', fontSize: '12px' }}
                onClick={onRetry}
              >
                <RotateCcw size={13} />
                Retry Question
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

