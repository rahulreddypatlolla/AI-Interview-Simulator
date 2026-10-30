import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  Video,
  Mic,
  Monitor,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Maximize2,
  ArrowLeft,
  Sparkles,
  Camera,
  Activity,
  Layers,
  HelpCircle,
  Eye,
  Check,
} from 'lucide-react'
import { proctoringService } from '../../services/proctoringService'
import '../../styles/interview-setup.css'

type PermissionStatus = 'not_requested' | 'requesting' | 'granted' | 'denied'

interface PracticePreferences {
  sessionId?: string
  role?: string
  type?: 'Technical' | 'Behavioral' | 'HR' | 'Mixed'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  voice?: 'male' | 'female'
  source?: 'profile' | 'job_post'
  gaps?: string[]
}

export default function InterviewPermissionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  // Retrieve or generate sessionId
  const rawSessionId =
    params.sessionId ||
    (location.state as PracticePreferences)?.sessionId

  const sessionId = useMemo(() => {
    if (rawSessionId && rawSessionId !== 'session-free') {
      return rawSessionId
    }
    try {
      const stored = sessionStorage.getItem('activePractice')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.sessionId && parsed.sessionId !== 'session-free') return parsed.sessionId
      }
    } catch {
      // Ignore
    }
    return `TWIN-${Date.now()}`
  }, [rawSessionId])

  // -------------------------------------------------------------
  // Consent Checkboxes
  // -------------------------------------------------------------
  const [cameraMicConsent, setCameraMicConsent] = useState(false)
  const [attentionConsent, setAttentionConsent] = useState(false)
  const [screenConsent, setScreenConsent] = useState(false)
  const [ageConsent, setAgeConsent] = useState(false)

  // -------------------------------------------------------------
  // Browser Permissions Status
  // -------------------------------------------------------------
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('not_requested')
  const [micStatus, setMicStatus] = useState<PermissionStatus>('not_requested')
  const [screenStatus, setScreenStatus] = useState<PermissionStatus>('not_requested')

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [screenError, setScreenError] = useState<string | null>(null)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)

  // -------------------------------------------------------------
  // Expanded Details Accordion
  // -------------------------------------------------------------
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    cameraMic: false,
    attention: false,
    screen: false,
    age: false,
  })

  const toggleDetails = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // -------------------------------------------------------------
  // Live Camera Preview & Audio Meter
  // -------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [cameraLoading, setCameraLoading] = useState<boolean>(false)
  const isStartingInterviewRef = useRef<boolean>(false)
  const animFrameRef = useRef<number | null>(null)

  // Attach camera stream to video preview element whenever it changes
  const attachStreamToVideo = useCallback((stream: MediaStream | null) => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {
          // Handled by user gesture
        })
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  // Guarantee stream attachment whenever cameraStatus transitions to granted
  useEffect(() => {
    if (cameraStatus === 'granted') {
      const stream = proctoringService.getCameraStream()
      if (stream) {
        attachStreamToVideo(stream)
      }
    }
  }, [cameraStatus, attachStreamToVideo])

  // Setup real-time audio volume monitoring
  useEffect(() => {
    const stream = proctoringService.getCameraStream()
    if (!stream || micStatus !== 'granted') {
      setAudioLevel(0)
      return
    }

    const meter = proctoringService.createAudioMeter(stream)
    if (!meter) return

    let isMounted = true

    const updateAudio = () => {
      if (!isMounted) return
      const vol = meter.getVolume()
      setAudioLevel(vol)
      animFrameRef.current = requestAnimationFrame(updateAudio)
    }

    updateAudio()

    return () => {
      isMounted = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      meter.cleanup()
    }
  }, [micStatus, cameraStatus])

  // Stop media tracks when leaving unless proceeding to interview
  useEffect(() => {
    return () => {
      if (!isStartingInterviewRef.current) {
        proctoringService.stopAllMediaStreams()
      }
    }
  }, [])

  // -------------------------------------------------------------
  // Request Handlers
  // -------------------------------------------------------------

  /**
   * Request Camera and Microphone access
   */
  const requestCameraAndMicAccess = async () => {
    setCameraLoading(true)
    setCameraStatus('requesting')
    setMicStatus('requesting')
    setCameraError(null)

    const res = await proctoringService.requestCameraAndMicrophone()
    setCameraLoading(false)

    if (res.success && res.stream) {
      setCameraStatus('granted')
      setMicStatus('granted')
      setCameraError(null)
      attachStreamToVideo(res.stream)
    } else {
      setCameraStatus('denied')
      setMicStatus('denied')
      setCameraError(res.error || 'Failed to acquire camera and microphone.')
      attachStreamToVideo(null)
    }
  }

  /**
   * Request Screen Sharing access
   */
  const requestScreenSharingAccess = async () => {
    setScreenStatus('requesting')
    setScreenError(null)

    const res = await proctoringService.requestScreenShare(() => {
      // Screen share stopped callback
      setScreenStatus('not_requested')
      setScreenError('Screen sharing was ended. Please re-share your screen.')
    })

    if (res.success && res.stream) {
      setScreenStatus('granted')
      setScreenError(null)
    } else {
      setScreenStatus('denied')
      setScreenError(res.error || 'Failed to acquire screen sharing permission.')
    }
  }

  /**
   * Master "Agree to all four" toggle
   */
  const handleAgreeToAll = async (checked: boolean) => {
    setCameraMicConsent(checked)
    setAttentionConsent(checked)
    setScreenConsent(checked)
    setAgeConsent(checked)

    if (checked) {
      // Step 1: Request Camera & Mic
      if (cameraStatus !== 'granted' || micStatus !== 'granted') {
        await requestCameraAndMicAccess()
      }

      // Step 2: Request Screen Sharing
      if (screenStatus !== 'granted') {
        await requestScreenSharingAccess()
      }
    }
  }

  const allConsentsGiven =
    cameraMicConsent && attentionConsent && screenConsent && ageConsent

  const allPermissionsGranted =
    cameraStatus === 'granted' &&
    micStatus === 'granted' &&
    screenStatus === 'granted' &&
    proctoringService.getCameraStream() !== null &&
    proctoringService.getScreenStream() !== null

  const isReadyToStart = allConsentsGiven && allPermissionsGranted

  // -------------------------------------------------------------
  // Start Mock Interview in Fullscreen
  // -------------------------------------------------------------
  const handleStartMockInterview = async () => {
    if (!isReadyToStart) return

    setFullscreenError(null)

    // Ensure camera & mic streams are present
    const camStream = proctoringService.getCameraStream()
    if (!camStream || !camStream.active) {
      setFullscreenError('Camera stream is disconnected. Please re-enable camera access.')
      return
    }

    // Ensure screen stream is present
    const scrStream = proctoringService.getScreenStream()
    if (!scrStream || !scrStream.active) {
      setFullscreenError('Screen sharing stream is inactive. Please re-share your screen.')
      return
    }

    // Must be invoked directly on this click gesture
    const fsResult = await proctoringService.requestFullscreen()

    if (!fsResult.success) {
      setFullscreenError(
        fsResult.error ||
          'Fullscreen mode was rejected or is unavailable in your browser. Mock interview requires fullscreen proctoring to begin.'
      )
      return
    }

    // Mark flag so cleanup effect doesn't kill tracks
    isStartingInterviewRef.current = true

    // Pass configuration forward
    const config = (location.state as PracticePreferences) || {}
    navigate(`/interview/${sessionId}`, {
      state: {
        ...config,
        sessionId,
      },
    })
  }

  return (
    <div className="interview-setup-page" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Top Header */}
      <header className="setup-header">
        <button
          type="button"
          className="back-button"
          onClick={() => {
            proctoringService.stopAllMediaStreams()
            navigate('/interview/setup')
          }}
        >
          <ArrowLeft size={17} />
          Back to setup
        </button>

        <div className="setup-brand">
          <Sparkles size={20} />
          <span>CareerVerse</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="setup-container" style={{ maxWidth: '860px' }}>
        {/* Heading */}
        <div className="setup-heading">
          <span className="setup-eyebrow">
            <ShieldCheck size={13} style={{ marginRight: '5px' }} />
            VERIFICATION &amp; PROCTORING
          </span>
          <h1>Before you start</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
            Each permission is needed to guarantee test integrity, simulate real-world technical assessments, and capture your spoken responses.
          </p>
        </div>

        {/* Master "Agree to all four" Card */}
        <div
          className="panel"
          style={{
            background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)',
            border: '2px solid #c7d2fe',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              flex: 1,
              minWidth: '260px',
            }}
          >
            <input
              type="checkbox"
              checked={allConsentsGiven}
              onChange={(e) => handleAgreeToAll(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#4f46e5',
                cursor: 'pointer',
              }}
            />
            <div>
              <strong style={{ fontSize: '15px', color: '#1e1b4b', display: 'block' }}>
                Agree to all four (Requests Camera, Mic &amp; Screen)
              </strong>
              <span style={{ fontSize: '12.5px', color: '#6366f1' }}>
                Selects all consent categories and prompts browser permissions sequentially.
              </span>
            </div>
          </label>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: allPermissionsGranted ? '#dcfce7' : '#fef3c7',
                color: allPermissionsGranted ? '#15803d' : '#b45309',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {allPermissionsGranted ? (
                <>
                  <CheckCircle2 size={13} />
                  Permissions ready
                </>
              ) : (
                <>
                  <Activity size={13} />
                  Action required
                </>
              )}
            </span>
          </div>
        </div>

        {/* 4 Permission Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card A: Camera and Microphone Recording */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px 22px',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                <input
                  type="checkbox"
                  id="consent-camera-mic"
                  checked={cameraMicConsent}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setCameraMicConsent(checked)
                    if (checked && cameraStatus !== 'granted') {
                      requestCameraAndMicAccess()
                    }
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '3px',
                    accentColor: '#2563eb',
                    cursor: 'pointer',
                  }}
                />

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Video size={20} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                      Camera and Microphone Recording
                    </h2>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    Grants webcam and microphone access to record your interview responses and allow the evaluator to assess candidate presentation.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={cameraStatus === 'granted' && micStatus === 'granted' ? 'granted' : cameraStatus === 'denied' ? 'denied' : 'not_requested'} />

                {cameraStatus !== 'granted' && (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={requestCameraAndMicAccess}
                    disabled={cameraLoading}
                  >
                    {cameraStatus === 'denied' ? (
                      <>
                        <RotateCcw size={13} />
                        Retry
                      </>
                    ) : (
                      'Request Access'
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleDetails('cameraMic')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    padding: '6px',
                  }}
                >
                  Details
                  {expanded.cameraMic ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Error & Instructions */}
            {cameraError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Camera or Microphone Blocked:</strong> {cameraError}
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#7f1d1d' }}>
                    💡 <em>To enable in your browser:</em> Click the lock/settings icon next to the URL in your browser address bar, set Camera and Microphone to &quot;Allow&quot;, then click <strong>Retry</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expanded.cameraMic && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: '0 0 6px' }}>
                  <strong>How we process your media:</strong> Video and audio are accessed locally in your browser through the standard W3C <code>navigator.mediaDevices.getUserMedia()</code> API.
                </p>
                <p style={{ margin: 0 }}>
                  Audio is processed locally for speech recognition and interview evaluation. No raw media is streamed or stored on external servers without candidate consent.
                </p>
              </div>
            )}
          </div>

          {/* Card B: Face-Attention Check */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px 22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                <input
                  type="checkbox"
                  id="consent-attention"
                  checked={attentionConsent}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setAttentionConsent(checked)
                    if (checked && cameraStatus !== 'granted') {
                      requestCameraAndMicAccess()
                    }
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '3px',
                    accentColor: '#2563eb',
                    cursor: 'pointer',
                  }}
                />

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Eye size={20} />
                </div>

                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Face-Attention Check
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    Confirms that your camera feed remains active and you are positioned facing the screen during the simulation.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={cameraStatus === 'granted' ? 'granted' : cameraStatus === 'denied' ? 'denied' : 'not_requested'} />

                <button
                  type="button"
                  onClick={() => toggleDetails('attention')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    padding: '6px',
                  }}
                >
                  Details
                  {expanded.attention ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expanded.attention && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Attention check disclosure:</strong> Your active camera feed is displayed in the interview room so evaluators can verify candidate presence and camera alignment.
                </p>
                <p style={{ margin: 0 }}>
                  We do not execute intrusive biometric facial recognition scanning. Video presence checks are used to simulate real interview settings and guarantee human review integrity.
                </p>
              </div>
            )}
          </div>

          {/* Card C: Screen Sharing, Page Events and Transcription */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px 22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                <input
                  type="checkbox"
                  id="consent-screen"
                  checked={screenConsent}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setScreenConsent(checked)
                    if (checked && screenStatus !== 'granted') {
                      requestScreenSharingAccess()
                    }
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '3px',
                    accentColor: '#2563eb',
                    cursor: 'pointer',
                  }}
                />

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Monitor size={20} />
                </div>

                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Screen Sharing, Page Events and Transcription
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    Allows screen sharing for proctoring verification, monitors fullscreen events, and uses microphone audio for real-time speech transcription.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={screenStatus} />

                {screenStatus !== 'granted' ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={requestScreenSharingAccess}
                  >
                    Share Screen
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-quiet"
                    style={{ padding: '6px 10px', fontSize: '11px', color: '#059669' }}
                    onClick={requestScreenSharingAccess}
                  >
                    Change Screen
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleDetails('screen')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    padding: '6px',
                  }}
                >
                  Details
                  {expanded.screen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {screenError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Screen Sharing Required:</strong> {screenError}
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    Please click <strong>Share Screen</strong> and choose your full screen or application window.
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expanded.screen && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Screen sharing:</strong> Uses <code>navigator.mediaDevices.getDisplayMedia()</code> so you can choose which window or screen to share. The session monitors when screen sharing is paused or ended.
                </p>
                <p style={{ margin: '0 0 6px' }}>
                  <strong>Page events:</strong> Detects fullscreen mode changes via the browser Fullscreen API. Exiting fullscreen during the interview generates up to two warnings before auto-submitting.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Transcription:</strong> Utilizes the browser Web Speech API to convert your spoken responses into editable text on screen.
                </p>
              </div>
            )}
          </div>

          {/* Card D: Age Confirmation */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px 22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                <input
                  type="checkbox"
                  id="consent-age"
                  checked={ageConsent}
                  onChange={(e) => setAgeConsent(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '3px',
                    accentColor: '#2563eb',
                    cursor: 'pointer',
                  }}
                />

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#fef3c7',
                    color: '#d97706',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Age Confirmation
                  </h2>
                  <label
                    htmlFor="consent-age"
                    style={{
                      display: 'block',
                      margin: '4px 0 0',
                      fontSize: '13px',
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    I confirm that I am 18 or older, or have guardian consent.
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '12px',
                    background: ageConsent ? '#dcfce7' : '#f1f5f9',
                    color: ageConsent ? '#15803d' : '#64748b',
                  }}
                >
                  {ageConsent ? 'Confirmed' : 'Required'}
                </span>

                <button
                  type="button"
                  onClick={() => toggleDetails('age')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    padding: '6px',
                  }}
                >
                  Details
                  {expanded.age ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expanded.age && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.6,
                }}
              >
                In compliance with online child safety standards and privacy regulations (including COPPA &amp; GDPR), candidates using our AI interview proctoring must be at least 18 years of age or possess authorized parental/guardian consent.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: CAMERA VIDEO PREVIEW & AUDIO METER */}
        {/* ========================================================= */}
        <section
          className="panel"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#6366f1',
                textTransform: 'uppercase',
              }}
            >
              DEVICE CALIBRATION
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px', color: '#1e293b' }}>
              Check your camera and microphone
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Confirm that your face is clearly visible, well-lit, and your microphone registers audio when you speak.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, 1fr)',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            {/* Live Camera View Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/10',
                background: '#0f172a',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {cameraStatus === 'granted' ? (
                <video
                  ref={(el) => {
                    videoRef.current = el
                    if (el) {
                      const stream = proctoringService.getCameraStream()
                      if (stream && el.srcObject !== stream) {
                        el.srcObject = stream
                        el.muted = true
                        el.play().catch(() => {})
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Mirror effect
                  }}
                />
              ) : cameraLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <Activity size={32} className="spin" style={{ margin: '0 auto 10px', color: '#6366f1' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>Connecting to camera...</p>
                </div>
              ) : cameraStatus === 'denied' ? (
                <div style={{ textAlign: 'center', color: '#f87171', padding: '20px' }}>
                  <Camera size={32} style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                  <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600 }}>Camera access denied</p>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={requestCameraAndMicAccess}
                  >
                    Retry Camera Access
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  <Camera size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    Grant camera permission above to preview your video.
                  </p>
                </div>
              )}

              {/* Live Overlay Badge */}
              {cameraStatus === 'granted' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 8px #22c55e',
                    }}
                  />
                  Camera Live
                </div>
              )}
            </div>

            {/* Diagnostic Indicators & Audio Meter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Camera Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Video size={17} color={cameraStatus === 'granted' ? '#16a34a' : '#64748b'} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Camera connected</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: cameraStatus === 'granted' ? '#16a34a' : '#94a3b8',
                  }}
                >
                  {cameraStatus === 'granted' ? 'Connected' : 'Not active'}
                </span>
              </div>

              {/* Mic Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mic size={17} color={micStatus === 'granted' ? '#16a34a' : '#64748b'} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Microphone connected</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: micStatus === 'granted' ? '#16a34a' : '#94a3b8',
                  }}
                >
                  {micStatus === 'granted' ? 'Connected' : 'Not active'}
                </span>
              </div>

              {/* Screen Share Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Monitor size={17} color={screenStatus === 'granted' ? '#16a34a' : '#64748b'} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Screen share ready</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: screenStatus === 'granted' ? '#16a34a' : '#94a3b8',
                  }}
                >
                  {screenStatus === 'granted' ? 'Active' : 'Not active'}
                </span>
              </div>

              {/* Microphone Input Level Meter */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    Microphone Input Level
                  </span>
                  <span style={{ fontSize: '11px', color: audioLevel > 15 ? '#16a34a' : '#94a3b8' }}>
                    {audioLevel > 15 ? 'Receiving voice audio' : 'Speak to test'}
                  </span>
                </div>

                {/* Level Meter Bar */}
                <div
                  style={{
                    height: '10px',
                    width: '100%',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
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
                      transition: 'width 0.08s ease-out',
                      borderRadius: '6px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fullscreen error message if user rejected fullscreen */}
        {fullscreenError && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13px',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{fullscreenError}</span>
            </div>
            <button
              type="button"
              className="button button-primary"
              style={{ padding: '6px 14px', fontSize: '12px', flexShrink: 0 }}
              onClick={handleStartMockInterview}
            >
              Retry Fullscreen
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: START MOCK INTERVIEW IN FULLSCREEN */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            className="button button-primary"
            onClick={handleStartMockInterview}
            disabled={!isReadyToStart}
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '15px 28px',
              fontSize: '15px',
              fontWeight: 800,
              borderRadius: '12px',
              background: isReadyToStart
                ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)'
                : '#cbd5e1',
              boxShadow: isReadyToStart
                ? '0 6px 20px rgba(79, 70, 229, 0.35)'
                : 'none',
              cursor: isReadyToStart ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <Maximize2 size={19} />
            Start Mock Interview (Fullscreen)
          </button>

          {!isReadyToStart && (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Please complete all checklist items above before entering the fullscreen interview.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/**
 * Reusable Status Badge Component
 */
function StatusBadge({ status }: { status: PermissionStatus }) {
  if (status === 'granted') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: '#dcfce7',
          color: '#15803d',
        }}
      >
        <Check size={12} strokeWidth={3} />
        Granted
      </span>
    )
  }

  if (status === 'denied') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: '#fee2e2',
          color: '#b91c1c',
        }}
      >
        <AlertCircle size={12} />
        Denied
      </span>
    )
  }

  if (status === 'requesting') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: '#e0e7ff',
          color: '#4338ca',
        }}
      >
        <Activity size={12} className="spin" />
        Requesting...
      </span>
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        background: '#f1f5f9',
        color: '#64748b',
      }}
    >
      Not requested
    </span>
  )
}

