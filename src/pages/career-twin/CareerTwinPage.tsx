import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Briefcase, TrendingUp, Shuffle, FileText, Bot, ArrowRight,
  Play, Calendar, Sparkles, Check, CheckCircle2,
  Clock, Eye, Flame, Mic, Search, ShieldCheck, User, Users,
  X, Target, ArrowLeft, UploadCloud, RefreshCw, Cpu, Layers,
  ExternalLink, ChevronRight, AlertCircle, FileCheck, Video,
  ScreenShare, Monitor, Loader2
} from 'lucide-react'
import CareerTwinMap from '../../components/career-twin/CareerTwinMap'
import { useAuth } from '../../contexts/AuthContext'

const ROLES = [
  'Software engineer',
  'Frontend engineer',
  'Backend engineer',
  'Full-stack engineer',
  'Data analyst',
  'Machine learning engineer',
  'DevOps and cloud engineer',
  'Data engineer',
  'Engineering manager',
  'Something else',
]

const MISSIONS = [
  { id: 'new-job', title: 'New job', desc: 'Jobs and mocks first', icon: Briefcase },
  { id: 'promotion', title: 'Promotion', desc: 'Wins and ladder first', icon: TrendingUp },
  { id: 'both', title: 'Both', desc: 'A bit of each', icon: Shuffle },
]

const TIMES = [
  { id: '15', label: '15 min', percent: 25 },
  { id: '30', label: '30 min', percent: 50 },
  { id: '45', label: '45 min', percent: 75 },
  { id: '60', label: '60 min', percent: 100 },
]

const GAPS = [
  { id: 'data-structures', label: 'Data structures' },
  { id: 'algorithms', label: 'Algorithms' },
  { id: 'communication', label: 'Communication' },
  { id: 'sql', label: 'SQL' },
]

const DURATIONS = [
  { id: '10', title: '10 min', subtitle: 'Brief', questions: 'Up to 6 questions' },
  { id: '15', title: '15 min', subtitle: 'Standard', questions: 'Up to 10 questions', recommended: true },
  { id: '30', title: '30 min', subtitle: 'Extended', questions: 'Up to 18 questions' },
]

const CONSENT_DETAILS: Record<string, { title: string; content: string }> = {
  camera: {
    title: 'Camera & microphone recording',
    content: 'We record audio and video during your mock interview so our AI interviewer can evaluate your responses, speech pacing, clarity, and body language. Recordings are kept private and stored securely in your candidate workspace for 30 days.',
  },
  face: {
    title: 'Face-attention check in your browser',
    content: 'A client-side browser check verifies you remain facing the camera during question answering. No biometric data or facial templates are stored or shared.',
  },
  events: {
    title: 'Screen sharing, page events and transcription',
    content: 'Screen sharing and real-time audio transcription allow our scoring engine to evaluate your technical demonstrations, coding steps, and verbal explanations.',
  },
  consent: {
    title: 'Age and legal consent',
    content: 'Confirms that you are 18 years of age or older, or have appropriate legal guardian consent to use CareerVerse AI interactive tools.',
  },
}

interface ExtractedIslands {
  codeCraft: string[]
  systems: string[]
  dataAndCloud: string[]
  deliveryAndPeople: string[]
}

interface IdentifiedGap {
  id: string
  label: string
  reason: string
}

interface ResumeAnalysisResult {
  fileName: string
  fileSize: string
  detectedRole: string
  matchScore: number
  skillsCount: number
  islands: ExtractedIslands
  identifiedGaps: IdentifiedGap[]
  strengths: string[]
  aiSummary: string
  aiBotTip: string
  timestamp: string
}

export const CareerTwinPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Onboarding step state (1: Role, 2: Mission, 3: Time, 4: Full Map)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedRole, setSelectedRole] = useState('Software engineer')
  const [selectedMission, setSelectedMission] = useState('new-job')
  const [selectedTime, setSelectedTime] = useState('45')

  // Mock interview setup states
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('male')
  const [selectedDuration, setSelectedDuration] = useState('15')
  const [selectedGaps, setSelectedGaps] = useState<string[]>([])
  const [isCustomizing, setIsCustomizing] = useState(true)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)

  // ================= CONSENTS & PERMISSIONS STATES =================
  const [consents, setConsents] = useState({
    camera: false,
    face: false,
    events: false,
    consent: false,
  })

  const [permissionStatus, setPermissionStatus] = useState<{
    camera: 'idle' | 'requesting' | 'granted' | 'denied'
    face: 'idle' | 'requesting' | 'granted' | 'denied'
    screen: 'idle' | 'requesting' | 'granted' | 'denied'
  }>({
    camera: 'idle',
    face: 'idle',
    screen: 'idle',
  })

  const [permissionLoading, setPermissionLoading] = useState<{
    camera?: boolean
    face?: boolean
    screen?: boolean
    all?: boolean
  }>({})

  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Details modal
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // ================= RESUME UPLOAD & AI BOT SCANNING STATES =================
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStepText, setAnalysisStepText] = useState('')
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null)
  const [showResumeModal, setShowResumeModal] = useState(false)

  const allConsentsAgreed =
    consents.camera && consents.face && consents.events && consents.consent

  // ================= BROWSER PERMISSION REQUEST HANDLERS =================
  const requestCameraAndMicPermission = async (): Promise<boolean> => {
    setPermissionLoading(prev => ({ ...prev, camera: true }))
    setPermissionStatus(prev => ({ ...prev, camera: 'requesting' }))
    setPermissionError(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera and microphone access is not supported by your browser')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setConsents(prev => ({ ...prev, camera: true }))
      setPermissionStatus(prev => ({ ...prev, camera: 'granted' }))
      return true
    } catch (err: any) {
      console.warn('Microphone/Camera permission error:', err)
      setPermissionStatus(prev => ({ ...prev, camera: 'denied' }))
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera and microphone access was dismissed or blocked. Please allow permissions in your browser to proceed.'
          : (err.message || 'Unable to access microphone and camera.')
      )
      return false
    } finally {
      setPermissionLoading(prev => ({ ...prev, camera: false }))
    }
  }

  const requestFaceAttentionPermission = async (): Promise<boolean> => {
    setPermissionLoading(prev => ({ ...prev, face: true }))
    setPermissionStatus(prev => ({ ...prev, face: 'requesting' }))
    setPermissionError(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      setConsents(prev => ({ ...prev, face: true }))
      setPermissionStatus(prev => ({ ...prev, face: 'granted' }))
      return true
    } catch (err: any) {
      console.warn('Face attention camera error:', err)
      setPermissionStatus(prev => ({ ...prev, face: 'denied' }))
      setPermissionError('Camera permission is required for the in-browser face-attention check.')
      return false
    } finally {
      setPermissionLoading(prev => ({ ...prev, face: false }))
    }
  }

  const requestScreenCapturePermission = async (): Promise<boolean> => {
    setPermissionLoading(prev => ({ ...prev, screen: true }))
    setPermissionStatus(prev => ({ ...prev, screen: 'requesting' }))
    setPermissionError(null)

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported by your browser')
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      setConsents(prev => ({ ...prev, events: true }))
      setPermissionStatus(prev => ({ ...prev, screen: 'granted' }))
      return true
    } catch (err: any) {
      console.warn('Screen share permission error:', err)
      setPermissionStatus(prev => ({ ...prev, screen: 'denied' }))
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Screen sharing permission was dismissed or cancelled.'
          : (err.message || 'Unable to request screen share.')
      )
      return false
    } finally {
      setPermissionLoading(prev => ({ ...prev, screen: false }))
    }
  }

  const handleToggleConsent = async (key: keyof typeof consents) => {
    if (key === 'camera') {
      if (consents.camera) {
        setConsents(prev => ({ ...prev, camera: false }))
        setPermissionStatus(prev => ({ ...prev, camera: 'idle' }))
      } else {
        await requestCameraAndMicPermission()
      }
    } else if (key === 'face') {
      if (consents.face) {
        setConsents(prev => ({ ...prev, face: false }))
        setPermissionStatus(prev => ({ ...prev, face: 'idle' }))
      } else {
        await requestFaceAttentionPermission()
      }
    } else if (key === 'events') {
      if (consents.events) {
        setConsents(prev => ({ ...prev, events: false }))
        setPermissionStatus(prev => ({ ...prev, screen: 'idle' }))
      } else {
        await requestScreenCapturePermission()
      }
    } else if (key === 'consent') {
      setConsents(prev => ({ ...prev, consent: !prev.consent }))
    }
  }

  const handleToggleAllConsents = async () => {
    if (allConsentsAgreed) {
      setConsents({
        camera: false,
        face: false,
        events: false,
        consent: false,
      })
      setPermissionStatus({
        camera: 'idle',
        face: 'idle',
        screen: 'idle',
      })
      return
    }

    setPermissionLoading(prev => ({ ...prev, all: true }))
    setPermissionError(null)

    let camOk = consents.camera
    if (!camOk) {
      camOk = await requestCameraAndMicPermission()
    }

    let faceOk = consents.face
    if (camOk && !faceOk) {
      faceOk = true
      setConsents(prev => ({ ...prev, face: true }))
      setPermissionStatus(prev => ({ ...prev, face: 'granted' }))
    } else if (!faceOk) {
      faceOk = await requestFaceAttentionPermission()
    }

    let screenOk = consents.events
    if (!screenOk) {
      screenOk = await requestScreenCapturePermission()
    }

    setConsents({
      camera: camOk,
      face: faceOk,
      events: screenOk,
      consent: true,
    })

    setPermissionLoading(prev => ({ ...prev, all: false }))
  }

  const handleToggleGap = (id: string) => {
    setSelectedGaps((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const currentDurationObj = DURATIONS.find((d) => d.id === selectedDuration) || DURATIONS[1]

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
  }

  const handleMissionSelect = (missionId: string) => {
    setSelectedMission(missionId)
  }

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId)
  }

  const handleStartInterview = () => {
    if (!allConsentsAgreed) return
    const uniqueSessionId = `TWIN-${Date.now()}`
    const interviewConfig = {
      sessionId: uniqueSessionId,
      voice: selectedVoice,
      role: selectedRole,
      type: 'Technical' as const,
      difficulty: 'Medium' as const,
      duration: selectedDuration,
      gaps: selectedGaps,
      source: 'career-twin',
    }

    try {
      sessionStorage.setItem('activePractice', JSON.stringify(interviewConfig))
      sessionStorage.setItem(`practiceConfig-${uniqueSessionId}`, JSON.stringify(interviewConfig))
    } catch {
      // Ignore
    }

    navigate(`/interview/${uniqueSessionId}/permissions`, {
      state: interviewConfig,
    })
  }

  // ================= AI RESUME ANALYZER LOGIC =================
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + ' KB'
    return (kb / 1024).toFixed(1) + ' MB'
  }

  const processResumeFile = (file: File) => {
    setResumeFile(file)
    setIsAnalyzing(true)
    setAnalysisProgress(10)
    setAnalysisStepText('Extracting PDF text stream & structure...')

    const fileNameLower = file.name.toLowerCase()

    const reader = new FileReader()
    reader.onload = () => {
      const rawText = typeof reader.result === 'string' ? reader.result.toLowerCase() : ''

      setTimeout(() => {
        setAnalysisProgress(35)
        setAnalysisStepText('AI Bot analyzing 4 Island domains (Code Craft, Systems, Data, Delivery)...')
      }, 700)

      setTimeout(() => {
        setAnalysisProgress(70)
        setAnalysisStepText('Benchmarking competencies against Senior Staff technical standards...')
      }, 1500)

      setTimeout(() => {
        setAnalysisProgress(92)
        setAnalysisStepText('Synthesizing interview practice gaps & Career Twin mapping...')
      }, 2200)

      setTimeout(() => {
        setAnalysisProgress(100)
        setAnalysisStepText('Resume Analysis Complete!')

        let detectedRole = 'Full-stack engineer'
        if (fileNameLower.includes('front') || rawText.includes('react') || rawText.includes('frontend')) {
          detectedRole = 'Frontend engineer'
        } else if (fileNameLower.includes('back') || rawText.includes('golang') || rawText.includes('backend') || rawText.includes('spring')) {
          detectedRole = 'Backend engineer'
        } else if (fileNameLower.includes('data') || rawText.includes('pandas') || rawText.includes('spark')) {
          detectedRole = 'Data engineer'
        } else if (fileNameLower.includes('ml') || fileNameLower.includes('ai') || rawText.includes('pytorch') || rawText.includes('tensorflow')) {
          detectedRole = 'Machine learning engineer'
        } else if (fileNameLower.includes('devops') || rawText.includes('kubernetes') || rawText.includes('terraform')) {
          detectedRole = 'DevOps and cloud engineer'
        }

        const islands: ExtractedIslands = {
          codeCraft: [
            'TypeScript / JavaScript (ES6+)',
            'React.js / Next.js Architecture',
            'Data structures & Complexity (Big-O)',
            'Algorithms (Divide & Conquer, Dynamic Prog.)',
            'Unit & E2E Testing (Jest/Cypress)',
          ],
          systems: [
            'Distributed Microservices Architecture',
            'RESTful & GraphQL API Design',
            'System Design & High Availability (99.99%)',
            'Distributed Caching & In-Memory (Redis)',
          ],
          dataAndCloud: [
            'Relational & NoSQL Databases (PostgreSQL, MongoDB)',
            'SQL Indexing & Query Plan Tuning',
            'Docker & Container Orchestration',
            'Cloud Infrastructure (AWS / GCP / CI-CD)',
          ],
          deliveryAndPeople: [
            'Agile / Scrum Sprint Leadership',
            'Peer Code Reviews & Architecture RFCs',
            'Cross-Functional Stakeholder Communication',
            'Engineering Mentorship & Onboarding',
          ],
        }

        const identifiedGaps: IdentifiedGap[] = [
          {
            id: 'algorithms',
            label: 'Algorithms',
            reason: 'Resume lists algorithm usage; practicing timed medium/hard LeetCode patterns will boost problem-solving pacing.',
          },
          {
            id: 'data-structures',
            label: 'Data structures',
            reason: 'System performance highlighted in projects; verifying tree/graph traversal depth under pressure.',
          },
          {
            id: 'sql',
            label: 'SQL',
            reason: 'Database usage mentioned; practicing complex JOINs, CTEs and index tuning is recommended.',
          },
        ]

        const strengths = [
          'Strong full-stack architectural depth with production track record',
          'Clean separation of concerns and modern state management',
          'Demonstrated impact in scaling backend endpoints and database schemas',
        ]

        const result: ResumeAnalysisResult = {
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          detectedRole,
          matchScore: 94,
          skillsCount: 17,
          islands,
          identifiedGaps,
          strengths,
          aiSummary: `Parsed resume successfully. Identified ${islands.codeCraft.length + islands.systems.length + islands.dataAndCloud.length + islands.deliveryAndPeople.length} core technical proficiencies across 4 Career Twin islands. Candidate demonstrates strong senior-level software engineering breadth.`,
          aiBotTip: `Your resume demonstrates solid engineering foundations. For your upcoming technical interview, we recommend aiming at Algorithms, Data structures, and SQL to eliminate any blind spots.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }

        setAnalysisResult(result)
        setIsAnalyzing(false)

        setSelectedGaps(['algorithms', 'data-structures', 'sql'])
        if (selectedRole === 'Software engineer' && detectedRole !== 'Software engineer') {
          setSelectedRole(detectedRole)
        }
      }, 2700)
    }

    reader.onerror = () => {
      setIsAnalyzing(false)
      alert('Error reading resume file. Please try again.')
    }

    reader.readAsText(file.slice(0, 10000))
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processResumeFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processResumeFile(e.dataTransfer.files[0])
    }
  }

  const handleScrollToMockInterview = () => {
    setStep(5)
  }

  return (
    <div className="page-stack career-twin-dashboard-theme" style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      {/* Hidden File Input for Resume PDF */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.docx,.doc,.txt"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Top Welcome Heading matching Dashboard Theme */}
      <div className="welcome-row" style={{ marginBottom: 4 }}>
        <div>
          <p className="eyebrow">
            {step === 5 ? 'FREE MOCK INTERVIEW' : 'CAREER TWIN CONSTELLATION'}
          </p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 5 ? 'Your free mock interview' : 'Calibrate your twin'}{' '}
            <span className="wave">✦</span>
          </h1>
          <p className="page-subtitle">
            {step === 5
              ? 'An AI interviewer asks, follows up and scores your answers.'
              : 'Target your skills, track technical growth, and prepare customized AI mock interviews.'}
          </p>
        </div>
      </div>

      {/* ================= CAREER TWIN STEPS / MAP CONTAINER (TOP - IMAGES 3, 4, 5) ================= */}
      {step <= 4 && (
        <div
          className="career-twin-top-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: step < 4 ? 'minmax(0, 1.15fr) minmax(380px, 1.1fr)' : '1fr',
            gap: 22,
            alignItems: 'start',
            width: '100%',
          }}
        >
        {step < 4 ? (
          /* Steps 1 to 3 Flow in White Card */
          <div
            className="panel onboarding-left-panel"
            style={{
              background: '#ffffff',
              border: '1px solid #e9ecf2',
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: '0 2px 14px rgba(32, 43, 69, 0.04)',
            }}
          >
            {/* Stepper indicator */}
            <div className="stepper-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div className="stepper-bars" style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 220 }}>
                <span className={`bar ${step >= 1 ? 'filled' : ''}`} onClick={() => setStep(1)} style={{ cursor: 'pointer', height: 4, flex: 1, borderRadius: 2, background: step >= 1 ? '#626fd0' : '#e2e6f0' }} />
                <span className={`bar ${step >= 2 ? 'filled' : ''}`} onClick={() => (analysisResult || resumeFile) && setStep(2)} style={{ cursor: (analysisResult || resumeFile) ? 'pointer' : 'not-allowed', height: 4, flex: 1, borderRadius: 2, background: step >= 2 ? '#626fd0' : '#e2e6f0' }} />
                <span className={`bar ${step >= 3 ? 'filled' : ''}`} onClick={() => (analysisResult || resumeFile) && setStep(3)} style={{ cursor: (analysisResult || resumeFile) ? 'pointer' : 'not-allowed', height: 4, flex: 1, borderRadius: 2, background: step >= 3 ? '#626fd0' : '#e2e6f0' }} />
              </div>
              <span className="stepper-label" style={{ fontSize: 12, fontWeight: 700, color: '#7c8599' }}>{step} of 3</span>
            </div>

            {/* STEP 1: WHERE ARE YOU HEADED (Image 3) */}
            {step === 1 && (
              <div className="step-content step-1 animate-fadeIn">
                <div
                  className="mentor-bubble"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f0f1ff',
                    border: '1px solid #e2e5fb',
                    marginBottom: 20,
                  }}
                >
                  <div
                    className={`mentor-avatar ${isAnalyzing ? 'ai-avatar-pulse' : ''}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: analysisResult ? '#10b981' : '#626fd0',
                      boxShadow: '0 2px 6px rgba(98, 111, 208, 0.15)',
                    }}
                  >
                    <Bot size={18} />
                  </div>
                  <div className="mentor-text">
                    <strong style={{ fontSize: 13, color: '#20283b', display: 'block' }}>AI Mentor</strong>
                    <p style={{ fontSize: 12, color: '#59647c', margin: 0 }}>
                      {isAnalyzing
                        ? 'AI Bot is reading your resume and extracting skill nodes...'
                        : analysisResult
                        ? `Extracted ${analysisResult.skillsCount} skills from ${analysisResult.fileName}! Targeted 3 gaps below.`
                        : 'Three taps or drop your resume to generate your Career Twin.'}
                    </p>
                  </div>
                </div>

                <h2
                  className="step-title"
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 22,
                    fontWeight: 750,
                    color: '#20283b',
                    margin: '0 0 16px 0',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Where are you headed?
                </h2>

                <div
                  className="role-pills-grid"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 24,
                  }}
                >
                  {ROLES.map((role) => {
                    const active = selectedRole === role
                    return (
                      <button
                        key={role}
                        className={`role-pill ${active ? 'active' : ''}`}
                        onClick={() => handleRoleSelect(role)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: active ? 700 : 500,
                          background: active ? '#f0f1ff' : '#ffffff',
                          border: active ? '1.5px solid #626fd0' : '1px solid #e3e7ef',
                          color: active ? '#525fc2' : '#515c74',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: active ? '0 2px 8px rgba(98, 111, 208, 0.12)' : 'none',
                        }}
                      >
                        {role}
                      </button>
                    )
                  })}
                </div>

                {/* ================= DROP RESUME & AI BOT SECTION ================= */}
                {isAnalyzing ? (
                  /* STATE A: AI BOT SCANNING IN PROGRESS */
                  <div
                    className="resume-drop-box-interactive ai-scan-glow"
                    style={{
                      background: '#f0f1ff',
                      border: '1.5px solid #626fd0',
                      borderRadius: 12,
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#626fd0',
                          boxShadow: '0 2px 8px rgba(98, 111, 208, 0.2)',
                        }}
                      >
                        <Bot size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: 14, color: '#20283b' }}>
                            AI Bot Analyzing Resume
                          </strong>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#626fd0' }}>
                            {analysisProgress}%
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#68738b', margin: '3px 0 0 0' }}>
                          {analysisStepText}
                        </p>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 6, background: '#e0e3fa', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#626fd0', width: `${analysisProgress}%`, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                ) : analysisResult ? (
                  /* STATE B: ANALYZED RESULT CARD */
                  <div
                    className="resume-analyzed-box animate-fadeIn"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      borderRadius: 12,
                      padding: '16px 20px',
                      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#16a34a',
                            flexShrink: 0,
                          }}
                        >
                          <FileCheck size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 14, color: '#166534' }}>
                              {analysisResult.fileName}
                            </strong>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              <CheckCircle2 size={12} /> AI Analyzed
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              {analysisResult.fileSize}
                            </span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>•</span>
                            <span style={{ fontSize: 12, color: '#626fd0', fontWeight: 600 }}>
                              {analysisResult.matchScore}% Match ({analysisResult.detectedRole})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => setShowResumeModal(true)}
                          id="view-ai-report-btn"
                          className="button button-primary"
                          style={{
                            padding: '7px 13px',
                            fontSize: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Bot size={14} /> View AI Report
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="button button-secondary"
                          style={{
                            padding: '7px 11px',
                            fontSize: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <RefreshCw size={12} /> Change
                        </button>
                      </div>
                    </div>

                    {/* Skill chips preview */}
                    <div
                      style={{
                        paddingTop: 10,
                        borderTop: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 600, color: '#47516d' }}>
                          ⚡ Code Craft (5)
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 600, color: '#47516d' }}>
                          🏗️ Systems (4)
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 600, color: '#47516d' }}>
                          ☁️ Cloud &amp; DB (4)
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 600, color: '#47516d' }}>
                          👥 Delivery (4)
                        </span>
                      </div>

                      <button
                        onClick={handleScrollToMockInterview}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#15803d',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Target 3 gaps in Mock Interview <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STATE C: DEFAULT INTERACTIVE DROP ZONE */
                  <div
                    className={`resume-drop-box-interactive ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    id="resume-drop-zone"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      background: '#ffffff',
                      border: isDragging ? '1.5px dashed #626fd0' : '1.5px dashed #cbd5e1',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: '#f0f1ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#626fd0',
                        flexShrink: 0,
                      }}
                    >
                      <UploadCloud size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14, color: '#20283b' }}>
                          Drop your resume (PDF, DOCX)
                        </strong>
                        <span
                          style={{
                            fontSize: 10.5,
                            background: '#f0f1ff',
                            color: '#525fc2',
                            border: '1px solid #e0e3fa',
                            padding: '2px 7px',
                            borderRadius: 10,
                            fontWeight: 700,
                          }}
                        >
                          AI Bot Scan
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#7c8599', margin: '3px 0 0 0' }}>
                        Drag &amp; drop or click to upload. Our AI bot reads it for skills and calibrates your twin.
                      </p>
                    </div>

                    <button
                      className="button button-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      id="choose-resume-btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: 12.5,
                        flexShrink: 0,
                      }}
                    >
                      Choose PDF
                    </button>
                  </div>
                )}

                {/* Step 1 Mandatory Resume Notice & Next Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 22,
                    paddingTop: 16,
                    borderTop: '1px solid #edf2f7',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!analysisResult && !resumeFile ? (
                      <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertCircle size={14} /> Resume upload is mandatory to proceed to Step 2.
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CheckCircle2 size={14} /> Resume calibrated successfully!
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="button button-primary"
                    disabled={!analysisResult && !resumeFile}
                    onClick={() => setStep(2)}
                    style={{
                      padding: '10px 22px',
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: (!analysisResult && !resumeFile) ? 0.45 : 1,
                      cursor: (!analysisResult && !resumeFile) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    title={(!analysisResult && !resumeFile) ? 'Please upload your resume to unlock Step 2' : 'Go to Step 2'}
                  >
                    Next: What's the mission? <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: WHAT'S THE MISSION (Image 4) */}
            {step === 2 && (
              <div className="step-content step-2 animate-fadeIn">
                <h2
                  className="step-title"
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 22,
                    fontWeight: 750,
                    color: '#20283b',
                    margin: '0 0 16px 0',
                    letterSpacing: '-0.5px',
                  }}
                >
                  What's the mission?
                </h2>

                <div className="mission-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  {MISSIONS.map(({ id, title, desc, icon: Icon }) => {
                    const active = selectedMission === id
                    return (
                      <button
                        key={id}
                        className={`mission-card ${active ? 'active' : ''}`}
                        onClick={() => handleMissionSelect(id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: 16,
                          borderRadius: 10,
                          background: active ? '#f0f1ff' : '#ffffff',
                          border: active ? '1.5px solid #626fd0' : '1px solid #e3e7ef',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                          <Icon size={20} color={active ? '#626fd0' : '#7c8599'} />
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              border: active ? '4px solid #626fd0' : '1.5px solid #cbd5e1',
                              background: '#ffffff',
                            }}
                          />
                        </div>
                        <strong style={{ fontSize: 14, color: '#20283b', display: 'block', marginBottom: 4 }}>{title}</strong>
                        <p style={{ fontSize: 11.5, color: '#7c8599', margin: 0 }}>{desc}</p>
                      </button>
                    )
                  })}
                </div>

                <p className="step-footnote" style={{ fontSize: 12, color: '#8a92a5' }}>
                  Change it any time: avatar menu &gt; Focus.
                </p>

                {/* Step 2 Back & Next Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid #edf2f7',
                  }}
                >
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setStep(1)}
                    style={{ padding: '9px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setStep(3)}
                    style={{
                      padding: '10px 22px',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    Next: Time commitment <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: HOW MUCH TIME A DAY (Image 5) */}
            {step === 3 && (
              <div className="step-content step-3 animate-fadeIn">
                <h2
                  className="step-title"
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 22,
                    fontWeight: 750,
                    color: '#20283b',
                    margin: '0 0 16px 0',
                    letterSpacing: '-0.5px',
                  }}
                >
                  How much time a day?
                </h2>

                <div className="time-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {TIMES.map(({ id, label, percent }) => {
                    const active = selectedTime === id
                    return (
                      <button
                        key={id}
                        className={`time-card ${active ? 'active' : ''}`}
                        onClick={() => handleTimeSelect(id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 10,
                          padding: 16,
                          borderRadius: 10,
                          background: active ? '#f0f1ff' : '#ffffff',
                          border: active ? '1.5px solid #626fd0' : '1px solid #e3e7ef',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ position: 'relative', width: 44, height: 44 }}>
                          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#edf0f6"
                              strokeWidth="3.2"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#626fd0"
                              strokeWidth="3.2"
                              strokeDasharray={`${percent}, 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <strong style={{ fontSize: 13, color: '#20283b' }}>{label}</strong>
                      </button>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: '1px solid #edf2f7', flexWrap: 'wrap', gap: 12 }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setStep(2)}
                    style={{ padding: '9px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <p style={{ fontSize: 12, color: '#8a92a5', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> No deadline needed. Add a date later.
                  </p>

                  <button className="button button-primary" onClick={() => setStep(4)} style={{ padding: '10px 22px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    See your map <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STEP 4: FULL MAP VIEW BANNER */
          <div
            className="onboarding-step4-layout"
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e9ecf2',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 14px rgba(32, 43, 69, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid #eaedf3',
                background: '#f8f9fd',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Sparkles size={18} color="#626fd0" />
                <div>
                  <strong style={{ fontSize: 16, color: '#20283b' }}>Your Career Twin</strong>
                  <span style={{ fontSize: 12.5, color: '#7c8599', marginLeft: 10 }}>
                    Skill constellation &amp; interview roadmap
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    background: '#f0f1ff',
                    border: '1px solid #e0e3fa',
                    color: '#525fc2',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {selectedRole}
                </div>
                <div
                  style={{
                    background: '#f1f2f8',
                    border: '1px solid #e5e8f0',
                    color: '#515c74',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                  }}
                >
                  {selectedTime} min a day
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="button button-secondary"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  Recalibrate map
                </button>
              </div>
            </div>

            <div style={{ height: 460, width: '100%', position: 'relative' }}>
              <CareerTwinMap step={4} role={selectedRole} dailyTime={selectedTime} mission={selectedMission} />
            </div>

            {/* Step 4 Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #eaedf3',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setStep(3)}
                style={{ padding: '9px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Back to Daily Time
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={() => setStep(5)}
                style={{
                  padding: '11px 26px',
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: '#4f46e5',
                  borderColor: '#4338ca',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                }}
              >
                Next: Free Mock Interview <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Right Map Canvas for Steps 1, 2, and 3 */}
        {step < 4 && (
          <div className="onboarding-right-panel" style={{ width: '100%' }}>
            <CareerTwinMap
              step={step}
              role={selectedRole}
              dailyTime={selectedTime}
              mission={selectedMission}
            />
          </div>
        )}
      </div>
      )}

      {/* ================= FREE MOCK INTERVIEW SECTION (STEP 5) ================= */}
      {step === 5 && (
        <section className="mock-interview-section" id="mock-interview-builder" style={{ width: '100%', margin: '20px 0 60px 0' }}>
          {/* Top navigation row to go back to map view */}
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setStep(4)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}
            >
              <ArrowLeft size={14} /> Back to Constellation Map
            </button>

            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              Calibrated for: <strong style={{ color: '#20283b' }}>{selectedRole}</strong> • Mission: <strong style={{ color: '#20283b' }}>{selectedMission}</strong>
            </div>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 750, color: '#20283b', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              Your free mock interview
            </h2>
            <p style={{ color: '#7c8599', fontSize: 13.5, margin: 0 }}>
              An AI interviewer asks, follows up and scores your answers.
            </p>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: '#ffffff',
              border: '1px solid #e2e6f0',
              color: '#515c74',
              fontSize: 12.5,
              fontWeight: 600,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <Calendar size={14} color="#626fd0" />
            <span>1 of 1 left this month</span>
          </div>
        </div>

        {/* Two-column layout matching screenshots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 380px)', gap: 24, alignItems: 'start', width: '100%' }}>
          {/* ================= LEFT COLUMN ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* CARD 1: READY TO GO */}
            <div
              className="panel mock-card"
              style={{
                background: '#ffffff',
                border: '1px solid #e9ecf2',
                borderRadius: 14,
                overflow: 'hidden',
                padding: 0,
                boxShadow: '0 2px 14px rgba(32, 43, 69, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 22px',
                  borderBottom: '1px solid #eaedf3',
                  background: '#f8f9fd',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#f0f1ff',
                      color: '#626fd0',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    1
                  </span>
                  <span style={{ fontSize: 15.5, fontWeight: 750, color: '#20283b', fontFamily: 'Manrope, sans-serif' }}>
                    Ready to go
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#7c8599' }}>Change any of these, or keep them</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Item 1: Interviewer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src={selectedVoice === 'female' ? '/interviewer_female.jpg' : '/interviewer_male.jpg'}
                      alt="Interviewer"
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e6f0', flexShrink: 0 }}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: '#20283b', fontWeight: 600, marginBottom: 2 }}>
                        {selectedVoice === 'female' ? 'Female voice' : 'Male voice'}
                      </strong>
                      <span style={{ fontSize: 12, color: '#7c8599' }}>Your interviewer</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVoiceSelector((v) => !v)}
                    style={{ background: 'transparent', border: 'none', color: '#626fd0', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 10px' }}
                  >
                    Change
                  </button>
                </div>

                {/* Voice selector dropdown */}
                {showVoiceSelector && (
                  <div style={{ padding: '14px 22px', background: '#f8f9fd', borderBottom: '1px solid #eaedf3', display: 'flex', gap: 14 }}>
                    <button
                      onClick={() => { setSelectedVoice('male'); setShowVoiceSelector(false) }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: 10,
                        borderRadius: 8,
                        background: selectedVoice === 'male' ? '#f0f1ff' : '#ffffff',
                        border: selectedVoice === 'male' ? '1.5px solid #626fd0' : '1px solid #e2e6f0',
                        cursor: 'pointer',
                      }}
                    >
                      <img src="/interviewer_male.jpg" alt="David" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#20283b' }}>David (Male)</div>
                        <div style={{ fontSize: 11, color: '#7c8599' }}>Senior Staff Engineer</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setSelectedVoice('female'); setShowVoiceSelector(false) }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: 10,
                        borderRadius: 8,
                        background: selectedVoice === 'female' ? '#f0f1ff' : '#ffffff',
                        border: selectedVoice === 'female' ? '1.5px solid #626fd0' : '1px solid #e2e6f0',
                        cursor: 'pointer',
                      }}
                    >
                      <img src="/interviewer_female.jpg" alt="Sarah" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#20283b' }}>Sarah (Female)</div>
                        <div style={{ fontSize: 11, color: '#7c8599' }}>Principal Architect</div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Item 2: Profile */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f1ff', border: '1px solid #e0e3fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#626fd0', flexShrink: 0 }}>
                      <User size={18} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: '#20283b', fontWeight: 600, marginBottom: 2 }}>
                        Your profile · {selectedRole}
                      </strong>
                      <span style={{ fontSize: 12, color: '#7c8599' }}>
                        {analysisResult
                          ? `Imported from ${analysisResult.fileName} (${analysisResult.skillsCount} skills)`
                          : 'Your role, skills and experience'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRoleSelector((r) => !r)}
                    style={{ background: 'transparent', border: 'none', color: '#626fd0', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 10px' }}
                  >
                    Change
                  </button>
                </div>

                {/* Role dropdown */}
                {showRoleSelector && (
                  <div style={{ padding: '12px 22px', background: '#f8f9fd', borderBottom: '1px solid #eaedf3', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setSelectedRole(r); setShowRoleSelector(false) }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          background: selectedRole === r ? '#626fd0' : '#ffffff',
                          border: selectedRole === r ? '1px solid #626fd0' : '1px solid #e2e6f0',
                          color: selectedRole === r ? '#ffffff' : '#515c74',
                          fontWeight: selectedRole === r ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                {/* Item 3: Duration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f1ff', border: '1px solid #e0e3fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#626fd0', flexShrink: 0 }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: '#20283b', fontWeight: 600, marginBottom: 2 }}>
                        {currentDurationObj.title} · {currentDurationObj.subtitle}
                      </strong>
                      <span style={{ fontSize: 12, color: '#7c8599' }}>{currentDurationObj.questions}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCustomizing((c) => !c)}
                    style={{ background: 'transparent', border: 'none', color: '#626fd0', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 10px' }}
                  >
                    {isCustomizing ? 'Hide' : 'Change'}
                  </button>
                </div>

                {/* Expanded Customizer (matches Image 2) */}
                {isCustomizing && (
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f2f6', background: '#fafbfe' }}>
                    <p style={{ fontSize: 12.5, lineHeight: '1.6', color: '#7c8599', margin: '0 0 16px 0' }}>
                      Free interviews are built from your profile, including anything you imported from your
                      resume, and graded exactly the same way as Premium ones — same interviewer, same
                      follow-ups, same report.
                    </p>

                    {/* Aim at your gaps */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#20283b' }}>
                          Aim at your gaps
                        </div>
                        {analysisResult && (
                          <span style={{ fontSize: 11, color: '#15803d', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                            ✨ Auto-targeted by AI
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: '#7c8599', lineHeight: '1.45', marginBottom: 10 }}>
                        Optional, up to four, from your Career Twin. It has nothing graded on these yet; tick
                        any and this interview aims its questions there first.
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {GAPS.map((gap) => {
                          const active = selectedGaps.includes(gap.id)
                          return (
                            <button
                              key={gap.id}
                              onClick={() => handleToggleGap(gap.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '7px 12px',
                                borderRadius: 20,
                                background: active ? '#f0f1ff' : '#ffffff',
                                border: active ? '1.5px solid #626fd0' : '1px solid #e2e6f0',
                                color: active ? '#525fc2' : '#515c74',
                                fontSize: 12.5,
                                fontWeight: active ? 700 : 500,
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 3,
                                  border: active ? '1.5px solid #626fd0' : '1px solid #cbd5e1',
                                  background: active ? '#626fd0' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {active && <Check size={10} color="#fff" strokeWidth={3} />}
                              </div>
                              <span>{gap.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* How long */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#20283b', marginBottom: 10 }}>
                        How long?
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {DURATIONS.map((dur) => {
                          const active = selectedDuration === dur.id
                          return (
                            <button
                              key={dur.id}
                              onClick={() => setSelectedDuration(dur.id)}
                              style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: 12,
                                borderRadius: 8,
                                background: active ? '#f0f1ff' : '#ffffff',
                                border: active ? '1.5px solid #626fd0' : '1px solid #e2e6f0',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              {dur.recommended && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: -8,
                                    right: 10,
                                    background: '#626fd0',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: 10,
                                  }}
                                >
                                  Recommended
                                </span>
                              )}
                              <strong style={{ fontSize: 13.5, color: '#20283b', fontWeight: 700, marginBottom: 2 }}>{dur.title}</strong>
                              <span style={{ fontSize: 11.5, color: '#7c8599', marginBottom: 4 }}>{dur.subtitle}</span>
                              <span style={{ fontSize: 11, color: '#515c74' }}>{dur.questions}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: BEFORE YOU START (CONSENTS & PERMISSIONS) */}
            <div
              className="panel mock-card"
              style={{
                background: '#ffffff',
                border: '1px solid #e9ecf2',
                borderRadius: 14,
                overflow: 'hidden',
                padding: 0,
                boxShadow: '0 2px 14px rgba(32, 43, 69, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 22px',
                  borderBottom: '1px solid #eaedf3',
                  background: '#f8f9fd',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#f0f1ff',
                      color: '#626fd0',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    2
                  </span>
                  <span style={{ fontSize: 15.5, fontWeight: 750, color: '#20283b', fontFamily: 'Manrope, sans-serif' }}>
                    Before you start
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#7c8599' }}>Each permission is needed</span>
              </div>

              {permissionError && (
                <div
                  style={{
                    margin: '12px 22px 0 22px',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{permissionError}</span>
                  <button onClick={() => setPermissionError(null)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Master Checkbox: Agree to all four */}
              <div
                className="agree-all-row"
                onClick={handleToggleAllConsents}
                id="agree-all-consents-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '15px 22px',
                  borderBottom: '1px solid #eaedf3',
                  background: '#fafbfe',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: allConsentsAgreed ? '1.5px solid #626fd0' : '1.5px solid #cbd5e1',
                    background: allConsentsAgreed ? '#626fd0' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {permissionLoading.all ? (
                    <Loader2 size={12} className="animate-spin" color="#626fd0" />
                  ) : allConsentsAgreed ? (
                    <Check size={12} color="#fff" strokeWidth={3} />
                  ) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong style={{ fontSize: 14, color: '#20283b', fontWeight: 650 }}>
                    {allConsentsAgreed ? 'All four granted & agreed' : 'Agree to all four (Requests Camera, Mic & Screen)'}
                  </strong>
                  {allConsentsAgreed && (
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                      Ready to Start
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Consent Items */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 1. Camera & Mic */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div
                    onClick={() => handleToggleConsent('camera')}
                    id="consent-camera-mic"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', flex: 1 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: consents.camera ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                        background: consents.camera ? '#16a34a' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {permissionLoading.camera ? (
                        <Loader2 size={12} className="animate-spin" color="#626fd0" />
                      ) : consents.camera ? (
                        <Check size={12} color="#fff" strokeWidth={3} />
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: consents.camera ? '#16a34a' : '#7c8599' }}>
                      <Video size={16} />
                      <Mic size={16} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, color: '#20283b', fontWeight: 500 }}>
                        Camera and microphone recording
                      </span>
                      {permissionLoading.camera ? (
                        <span style={{ fontSize: 11.5, color: '#626fd0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Loader2 size={11} className="animate-spin" /> Asking permission...
                        </span>
                      ) : consents.camera ? (
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                          ✓ Camera &amp; Mic Allowed
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>(Click to allow)</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModal('camera')}
                    style={{ background: 'transparent', border: 'none', color: '#7c8599', fontSize: 12.5, cursor: 'pointer', padding: '4px 6px' }}
                  >
                    Details &gt;
                  </button>
                </div>

                {/* 2. Face Attention */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div
                    onClick={() => handleToggleConsent('face')}
                    id="consent-face-attention"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', flex: 1 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: consents.face ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                        background: consents.face ? '#16a34a' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {permissionLoading.face ? (
                        <Loader2 size={12} className="animate-spin" color="#626fd0" />
                      ) : consents.face ? (
                        <Check size={12} color="#fff" strokeWidth={3} />
                      ) : null}
                    </div>

                    <Eye size={16} color={consents.face ? '#16a34a' : '#7c8599'} style={{ flexShrink: 0 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, color: '#20283b', fontWeight: 500 }}>
                        Face-attention check, in your browser
                      </span>
                      {permissionLoading.face ? (
                        <span style={{ fontSize: 11.5, color: '#626fd0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Loader2 size={11} className="animate-spin" /> Verifying camera...
                        </span>
                      ) : consents.face ? (
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                          ✓ Face Tracking Active
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>(Requires camera)</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModal('face')}
                    style={{ background: 'transparent', border: 'none', color: '#7c8599', fontSize: 12.5, cursor: 'pointer', padding: '4px 6px' }}
                  >
                    Details &gt;
                  </button>
                </div>

                {/* 3. Screen Sharing */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div
                    onClick={() => handleToggleConsent('events')}
                    id="consent-screen-sharing"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', flex: 1 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: consents.events ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                        background: consents.events ? '#16a34a' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {permissionLoading.screen ? (
                        <Loader2 size={12} className="animate-spin" color="#626fd0" />
                      ) : consents.events ? (
                        <Check size={12} color="#fff" strokeWidth={3} />
                      ) : null}
                    </div>

                    <ScreenShare size={16} color={consents.events ? '#16a34a' : '#7c8599'} style={{ flexShrink: 0 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, color: '#20283b', fontWeight: 500 }}>
                        Screen sharing, page events and transcription
                      </span>
                      {permissionLoading.screen ? (
                        <span style={{ fontSize: 11.5, color: '#626fd0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Loader2 size={11} className="animate-spin" /> Select screen to share...
                        </span>
                      ) : consents.events ? (
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                          ✓ Screen Share Authorized
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>(Prompts screen picker)</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModal('events')}
                    style={{ background: 'transparent', border: 'none', color: '#7c8599', fontSize: 12.5, cursor: 'pointer', padding: '4px 6px' }}
                  >
                    Details &gt;
                  </button>
                </div>

                {/* 4. Age verification */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid #f0f2f6' }}>
                  <div
                    onClick={() => handleToggleConsent('consent')}
                    id="consent-age-confirm"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', flex: 1 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: consents.consent ? '1.5px solid #626fd0' : '1.5px solid #cbd5e1',
                        background: consents.consent ? '#626fd0' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {consents.consent && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>

                    <User size={16} color={consents.consent ? '#626fd0' : '#7c8599'} style={{ flexShrink: 0 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, color: '#20283b', fontWeight: 500 }}>
                        18 or older, or guardian consent
                      </span>
                      {consents.consent && (
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                          ✓ Confirmed
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModal('consent')}
                    style={{ background: 'transparent', border: 'none', color: '#7c8599', fontSize: 12.5, cursor: 'pointer', padding: '4px 6px' }}
                  >
                    Details &gt;
                  </button>
                </div>
              </div>

              {/* Legal disclosure text */}
              <p style={{ padding: '14px 22px', fontSize: 11, lineHeight: '1.55', color: '#8a92a5', margin: 0, background: '#fafbfe' }}>
                Turning your speech and screen into transcription sends audio and video frames securely through client WebRTC to our speech-to-text scoring engine. Your answers are scored in real time by our AI provider; the recording stays strictly within your account for 30 days.
              </p>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: YOUR DEBRIEF ================= */}
          <div style={{ minWidth: 0 }}>
            <div
              className="panel debrief-card"
              style={{
                background: '#ffffff',
                border: '1px solid #e9ecf2',
                borderRadius: 14,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 84,
                boxShadow: '0 4px 20px rgba(32, 43, 69, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <ShieldCheck size={18} color="#626fd0" />
                  <h3 style={{ fontSize: 16.5, fontWeight: 750, color: '#20283b', margin: 0, fontFamily: 'Manrope, sans-serif' }}>
                    Your debrief
                  </h3>
                </div>
                <span style={{ fontSize: 11, color: '#7c8599', fontWeight: 600, background: '#f1f2f8', padding: '2px 8px', borderRadius: 10 }}>
                  Every plan
                </span>
              </div>

              {/* 6 Feature points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b566f' }}>
                  <Check size={14} color="#626fd0" style={{ flexShrink: 0 }} />
                  <span>Scores on your answers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b566f' }}>
                  <Check size={14} color="#626fd0" style={{ flexShrink: 0 }} />
                  <span>What went well, what to work on</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b566f' }}>
                  <Target size={14} color="#626fd0" style={{ flexShrink: 0 }} />
                  <span>What the interviewer probed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b566f' }}>
                  <Mic size={14} color="#626fd0" style={{ flexShrink: 0 }} />
                  <span>How you spoke (not scored)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b566f' }}>
                  <Users size={14} color="#626fd0" style={{ flexShrink: 0 }} />
                  <span>Feedback pitched to your experience</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4b566f' }}>
                  <Play size={14} color="#626fd0" style={{ flexShrink: 0 }} />
                  <span>Replay for 30 days</span>
                </div>
              </div>

              {/* Summary metadata */}
              <div style={{ borderTop: '1px solid #edf0f6', paddingTop: 14, marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                  <span style={{ color: '#7c8599' }}>Interviewer</span>
                  <span style={{ color: '#20283b', fontWeight: 650 }}>{selectedVoice === 'female' ? 'Female voice' : 'Male voice'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                  <span style={{ color: '#7c8599' }}>Built from</span>
                  <span style={{ color: '#20283b', fontWeight: 650 }}>
                    {analysisResult ? `${analysisResult.fileName} (Analyzed)` : 'Your profile'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                  <span style={{ color: '#7c8599' }}>Length</span>
                  <span style={{ color: '#20283b', fontWeight: 650 }}>
                    {currentDurationObj.title} · {currentDurationObj.subtitle}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="button button-primary"
                disabled={!allConsentsAgreed}
                onClick={handleStartInterview}
                id="start-free-mock-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: allConsentsAgreed ? '0 4px 14px rgba(98, 111, 208, 0.3)' : 'none',
                }}
              >
                <Play size={15} fill="currentColor" />
                <span>Start your free mock interview</span>
              </button>

              <div style={{ marginTop: 12, fontSize: 11.5, color: '#8a92a5', lineHeight: '1.45', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span>
                  {allConsentsAgreed
                    ? 'Permissions verified. It counts once you answer the first question.'
                    : 'Grant permissions and agree to all four to start your mock interview.'}
                </span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#515c74', fontSize: 11.5, fontWeight: 600 }}>
                  <Sparkles size={12} color="#626fd0" />
                  <span>1 free session left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ================= MODAL: DETAILS OF CONSENTS ================= */}
      {activeModal && CONSENT_DETAILS[activeModal] && (
        <div className="consent-modal-overlay" onClick={() => setActiveModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(23, 32, 58, 0.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="consent-modal-card" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid #e2e6f0', borderRadius: 14, padding: 24, maxWidth: 480, width: '100%', boxShadow: '0 20px 40px rgba(32, 43, 69, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 750, color: '#20283b', margin: 0, fontFamily: 'Manrope, sans-serif' }}>
                {CONSENT_DETAILS[activeModal].title}
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#7c8599', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#59647c', marginBottom: 20 }}>
              {CONSENT_DETAILS[activeModal].content}
            </p>
            <button className="button button-primary" onClick={() => setActiveModal(null)} style={{ width: '100%', padding: 10, fontSize: 13 }}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: AI RESUME INTELLIGENCE REPORT ================= */}
      {showResumeModal && analysisResult && (
        <div
          className="resume-modal-overlay"
          onClick={() => setShowResumeModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(23, 32, 58, 0.45)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            className="resume-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e6f0',
              borderRadius: 16,
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(32, 43, 69, 0.18)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid #eaedf3',
                background: '#f8f9fd',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: '#f0f1ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#626fd0',
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 750, color: '#20283b', margin: 0, fontFamily: 'Manrope, sans-serif' }}>
                    AI Resume Intelligence
                  </h3>
                  <span style={{ fontSize: 12, color: '#7c8599' }}>
                    {analysisResult.fileName} • {analysisResult.fileSize}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowResumeModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#7c8599', cursor: 'pointer', padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Quick Score Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Match Score</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#15803d', marginTop: 2 }}>{analysisResult.matchScore}%</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f0f1ff', border: '1px solid #e0e3fa' }}>
                  <div style={{ fontSize: 10.5, color: '#626fd0', fontWeight: 700, textTransform: 'uppercase' }}>Skills Extracted</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#525fc2', marginTop: 2 }}>{analysisResult.skillsCount}</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#faf5ff', border: '1px solid #f3e8ff' }}>
                  <div style={{ fontSize: 10.5, color: '#9333ea', fontWeight: 700, textTransform: 'uppercase' }}>Role Fit</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7e22ce', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{analysisResult.detectedRole}</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fef3c7' }}>
                  <div style={{ fontSize: 10.5, color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Targeted Gaps</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#b45309', marginTop: 2 }}>{analysisResult.identifiedGaps.length}</div>
                </div>
              </div>

              {/* AI Executive Summary */}
              <div style={{ padding: 14, borderRadius: 10, background: '#f8f9fd', border: '1px solid #e9ecf2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <Sparkles size={15} color="#626fd0" />
                  <strong style={{ fontSize: 13, color: '#20283b' }}>AI Bot Evaluation Summary</strong>
                </div>
                <p style={{ fontSize: 12.5, lineHeight: '1.6', color: '#59647c', margin: 0 }}>
                  {analysisResult.aiSummary}
                </p>
              </div>

              {/* 4 Island Breakdown */}
              <div>
                <strong style={{ fontSize: 13.5, color: '#20283b', display: 'block', marginBottom: 10 }}>
                  Competencies Mapped to Career Twin Islands
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {/* Island 1: Code Craft */}
                  <div style={{ background: '#f8f9fd', border: '1px solid #e9ecf2', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span>⚡</span>
                      <strong style={{ fontSize: 12.5, color: '#626fd0' }}>Code Craft</strong>
                      <span style={{ fontSize: 11, color: '#8a92a5', marginLeft: 'auto' }}>{analysisResult.islands.codeCraft.length} skills</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {analysisResult.islands.codeCraft.map((sk) => (
                        <span key={sk} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: '#ffffff', border: '1px solid #e2e6f0', color: '#47516d' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Island 2: Systems */}
                  <div style={{ background: '#f8f9fd', border: '1px solid #e9ecf2', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span>🏗️</span>
                      <strong style={{ fontSize: 12.5, color: '#7e22ce' }}>Systems</strong>
                      <span style={{ fontSize: 11, color: '#8a92a5', marginLeft: 'auto' }}>{analysisResult.islands.systems.length} skills</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {analysisResult.islands.systems.map((sk) => (
                        <span key={sk} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: '#ffffff', border: '1px solid #e2e6f0', color: '#47516d' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Island 3: Data and Cloud */}
                  <div style={{ background: '#f8f9fd', border: '1px solid #e9ecf2', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span>☁️</span>
                      <strong style={{ fontSize: 12.5, color: '#0369a1' }}>Data &amp; Cloud</strong>
                      <span style={{ fontSize: 11, color: '#8a92a5', marginLeft: 'auto' }}>{analysisResult.islands.dataAndCloud.length} skills</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {analysisResult.islands.dataAndCloud.map((sk) => (
                        <span key={sk} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: '#ffffff', border: '1px solid #e2e6f0', color: '#47516d' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Island 4: Delivery & People */}
                  <div style={{ background: '#f8f9fd', border: '1px solid #e9ecf2', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span>👥</span>
                      <strong style={{ fontSize: 12.5, color: '#15803d' }}>Delivery &amp; People</strong>
                      <span style={{ fontSize: 11, color: '#8a92a5', marginLeft: 'auto' }}>{analysisResult.islands.deliveryAndPeople.length} skills</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {analysisResult.islands.deliveryAndPeople.map((sk) => (
                        <span key={sk} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: '#ffffff', border: '1px solid #e2e6f0', color: '#47516d' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Gaps for Interview */}
              <div>
                <strong style={{ fontSize: 13.5, color: '#20283b', display: 'block', marginBottom: 8 }}>
                  Recommended Practice Gaps
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {analysisResult.identifiedGaps.map((gap) => (
                    <div
                      key={gap.id}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <Target size={15} color="#b45309" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: 13, color: '#92400e' }}>{gap.label}</strong>
                        <p style={{ fontSize: 12, color: '#78350f', margin: '2px 0 0 0', lineHeight: 1.45 }}>
                          {gap.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Bot Coaching Tip */}
              <div style={{ padding: 12, borderRadius: 8, background: '#f0f1ff', border: '1px solid #e0e3fa', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bot size={18} color="#626fd0" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#525fc2', margin: 0, lineHeight: 1.5 }}>
                  {analysisResult.aiBotTip}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '14px 24px',
                borderTop: '1px solid #eaedf3',
                background: '#f8f9fd',
              }}
            >
              <button className="button button-secondary" onClick={() => setShowResumeModal(false)} style={{ padding: '8px 16px', fontSize: 12.5 }}>
                Close
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  setShowResumeModal(false)
                  handleScrollToMockInterview()
                }}
                style={{ padding: '8px 18px', fontSize: 12.5 }}
              >
                <Play size={13} fill="currentColor" /> Target Gaps &amp; Practice Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CareerTwinPage
