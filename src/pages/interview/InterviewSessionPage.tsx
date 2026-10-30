
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Info,
  Lightbulb,
  Mic,
  MicOff,
  X,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Maximize2,
  Monitor,
  Video,
  VideoOff,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  HelpCircle,
} from 'lucide-react'

import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom'

import { scoreAnswerLocally } from '../../data/mockData'
import { selectQuestions } from '../../engine/questionEngine'
import { fullQuestionBank } from '../../data/questionBank'
import {
  evaluateAnswer,
  storeEvaluationInSupabase,
} from '../../services/evaluationService'
import { evaluateAnswerFallback } from '../../engine/fallbackEvaluator'
import { useAuth } from '../../contexts/AuthContext'
import { saveSessionToSupabase } from '../../services/interviewStorageService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { proctoringService } from '../../services/proctoringService'
import { ttsService } from '../../services/ttsService'
import { voiceRecordingService } from '../../services/voiceRecordingService'
import { evaluateVoiceAnswer } from '../../services/voiceEvaluationClient'
import AIInterviewerAvatar from '../../components/interview/AIInterviewerAvatar'
import InterviewAudioControls from '../../components/interview/InterviewAudioControls'
import type {
  InterviewQuestion,
  InterviewConfig,
  AnswerEvaluation,
  QuestionDifficulty,
  SubmissionReason,
  SessionProctoringStatus,
  AvatarAnimationState,
  FollowUpItem,
} from '../../types'

// Browser speech recognition types
interface SpeechRecognitionResultItem {
  isFinal: boolean
  0: {
    transcript: string
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultItem>
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

interface PracticePreferences {
  role?: string
  type?: 'Technical' | 'Behavioral' | 'HR' | 'Mixed'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  voice?: 'male' | 'female'
  source?: 'profile' | 'job_post'
  gaps?: string[]
}

export default function InterviewRoom() {
  const { sessionId: rawSessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Ensure every session (including legacy session-free or direct visits) has a unique, persistent session ID
  const sessionId = useMemo(() => {
    if (rawSessionId && rawSessionId !== 'session-free') {
      return rawSessionId
    }
    const stateId = (location.state as PracticePreferences & { sessionId?: string })?.sessionId
    if (stateId && stateId !== 'session-free') {
      return stateId
    }
    try {
      const stored = sessionStorage.getItem('activePractice')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.sessionId && parsed.sessionId !== 'session-free') {
          return parsed.sessionId
        }
      }
    } catch {
      // ignore
    }
    const freshId = `TWIN-${Date.now()}`
    try {
      sessionStorage.setItem('activePractice', JSON.stringify({ sessionId: freshId }))
    } catch {
      // ignore
    }
    return freshId
  }, [rawSessionId, location.state])

  // ---------------------------------
  // Interview configuration with full persistence
  // ---------------------------------

  const preferences = useMemo(() => {
    const state = (location.state || {}) as PracticePreferences

    let sessionStored: PracticePreferences = {}
    let activeStored: PracticePreferences = {}

    if (sessionId) {
      try {
        sessionStored = JSON.parse(
          sessionStorage.getItem(`practiceConfig-${sessionId}`) || '{}'
        )
      } catch {
        sessionStored = {}
      }
    }

    try {
      activeStored = JSON.parse(
        sessionStorage.getItem('activePractice') || '{}'
      )
    } catch {
      activeStored = {}
    }

    const merged: PracticePreferences = {
      role: 'Full Stack Developer',
      type: 'Technical' as const,
      difficulty: 'Medium' as const,
      voice: 'male' as const,
      source: 'profile' as const,
      gaps: [] as string[],
      ...activeStored,
      ...sessionStored,
      ...state,
    }

    if (!Array.isArray(merged.gaps)) {
      merged.gaps = []
    }

    return merged
  }, [sessionId, location.state])

  // Ensure settings are persisted to sessionStorage so they survive any page refresh
  useEffect(() => {
    if (!sessionId) return
    try {
      sessionStorage.setItem('activePractice', JSON.stringify(preferences))
      sessionStorage.setItem(
        `practiceConfig-${sessionId}`,
        JSON.stringify(preferences)
      )
    } catch {
      // Ignore quota errors
    }
  }, [sessionId, preferences])

  const interviewerVoice = preferences.voice || 'male'

  const interviewerImg =
    interviewerVoice === 'female'
      ? '/interviewer_female.jpg'
      : '/interviewer_male.jpg'

  // ---------------------------------
  // Adaptive question selection
  // ---------------------------------

  const sessionQuestions = useMemo(() => {
    if (!sessionId) return []

    // Check if we already have a persisted question set for this exact session
    try {
      const savedIds = sessionStorage.getItem(`practiceQuestionIds-${sessionId}`)
      if (savedIds) {
        const ids: string[] = JSON.parse(savedIds)
        if (Array.isArray(ids) && ids.length > 0) {
          // Rebuild the question objects from the full bank using saved IDs
          const idMap = new Map(fullQuestionBank.map((q) => [q.id, q]))
          const restored = ids
            .map((id) => idMap.get(id))
            .filter((q): q is InterviewQuestion => q !== undefined)
          if (restored.length > 0) return restored
        }
      }
    } catch {
      // Fall through to fresh selection
    }

    // Build an InterviewConfig from the resolved preferences
    const engineConfig: InterviewConfig = {
      role: preferences.role || 'Full Stack Developer',
      type: (preferences.type || 'Technical') as InterviewConfig['type'],
      difficulty: (preferences.difficulty || 'Medium') as InterviewConfig['difficulty'],
      gaps: preferences.gaps || [],
    }

    const result = selectQuestions(engineConfig, sessionId)
    return result.questions
  }, [sessionId, preferences])

  // Persist selected question IDs so refreshes produce the same set
  useEffect(() => {
    if (!sessionId || sessionQuestions.length === 0) return
    try {
      sessionStorage.setItem(
        `practiceQuestionIds-${sessionId}`,
        JSON.stringify(sessionQuestions.map((q) => q.id)),
      )
    } catch {
      // Ignore quota errors
    }
  }, [sessionId, sessionQuestions])

  // ---------------------------------
  // Question and answer state (with refresh resilience)
  // ---------------------------------

  const storedProgress = useMemo(() => {
    if (!sessionId) return null
    try {
      const raw = sessionStorage.getItem(`practiceSessionState-${sessionId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [sessionId])

  const [index, setIndex] = useState(() => {
    if (storedProgress && typeof storedProgress.index === 'number') {
      return Math.min(Math.max(0, storedProgress.index), sessionQuestions.length - 1)
    }
    return 0
  })

  const [answers, setAnswers] = useState<string[]>(() => {
    if (
      storedProgress &&
      Array.isArray(storedProgress.answers) &&
      storedProgress.answers.length === sessionQuestions.length
    ) {
      return storedProgress.answers
    }
    return sessionQuestions.map(() => '')
  })

  const [reviewed, setReviewed] = useState<boolean[]>(() => {
    if (
      storedProgress &&
      Array.isArray(storedProgress.reviewed) &&
      storedProgress.reviewed.length === sessionQuestions.length
    ) {
      return storedProgress.reviewed
    }
    return sessionQuestions.map(() => false)
  })

  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluation>>(() => {
    if (
      storedProgress &&
      storedProgress.evaluations &&
      typeof storedProgress.evaluations === 'object'
    ) {
      return storedProgress.evaluations
    }
    return {}
  })

  // ---------------------------------
  // Follow-up Questions State
  // ---------------------------------
  const [sessionFollowUps, setSessionFollowUps] = useState<Record<number, FollowUpItem[]>>(() => {
    if (storedProgress && storedProgress.followUps && typeof storedProgress.followUps === 'object') {
      return storedProgress.followUps
    }
    return {}
  })

  const [activeFollowUpIndex, setActiveFollowUpIndex] = useState<number | null>(() => {
    if (storedProgress && typeof storedProgress.activeFollowUpIndex === 'number') {
      return storedProgress.activeFollowUpIndex
    }
    return null
  })

  // ---------------------------------
  // Animated Avatar & Audio State
  // ---------------------------------
  const [avatarState, setAvatarState] = useState<AvatarAnimationState>('idle')
  const [isTTSMuted, setIsTTSMuted] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false)
  const [spokenLeadIn, setSpokenLeadIn] = useState<string>('')

  // Candidate Recording & Countdown Timer
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false)
  const [isPausedRecording, setIsPausedRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const answerTimeLimit = useMemo(() => {
    const diff = preferences.difficulty || 'Medium'
    if (diff === 'Easy') return 60
    if (diff === 'Hard') return 120
    return 90
  }, [preferences.difficulty])

  const [isEvaluating, setIsEvaluating] = useState(false)

  // Synchronize state changes to sessionStorage so a refresh never loses progress
  useEffect(() => {
    if (!sessionId) return
    try {
      sessionStorage.setItem(
        `practiceSessionState-${sessionId}`,
        JSON.stringify({
          index,
          answers,
          reviewed,
          evaluations,
          followUps: sessionFollowUps,
          activeFollowUpIndex,
        })
      )
    } catch {
      // Ignore
    }
  }, [sessionId, index, answers, reviewed, evaluations, sessionFollowUps, activeFollowUpIndex])

  const [showHint, setShowHint] = useState(false)
  const [submitted, setSubmitted] = useState(() => Boolean(evaluations[index]))
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [showEndModal, setShowEndModal] = useState(false)

  // ---------------------------------
  // Fullscreen & Proctoring State
  // ---------------------------------
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null)
  const isSubmittingRef = useRef<boolean>(false)
  const isLeavingSessionRef = useRef<boolean>(false)

  const [isFullscreen, setIsFullscreen] = useState(() => proctoringService.isFullscreen())

  const [exitCount, setExitCount] = useState<number>(() => {
    if (!sessionId) return 0
    try {
      const stored = sessionStorage.getItem(`practiceExitCount-${sessionId}`)
      return stored ? parseInt(stored, 10) || 0 : 0
    } catch {
      return 0
    }
  })

  // Warning modals: 1 (warning 1), 2 (warning 2), 3 (terminated)
  const [fullscreenWarningModal, setFullscreenWarningModal] = useState<1 | 2 | 3 | null>(null)

  // Screen sharing monitoring
  const [screenSharingStatus, setScreenSharingStatus] = useState<'active' | 'ended'>('active')
  const [showScreenShareModal, setShowScreenShareModal] = useState<boolean>(false)

  // Audio meter & camera preview state
  const [candidateAudioLevel, setCandidateAudioLevel] = useState<number>(0)
  const [cameraActive, setCameraActive] = useState<boolean>(() => {
    const s = proctoringService.getCameraStream()
    return Boolean(s && s.active)
  })
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isReconnectingMedia, setIsReconnectingMedia] = useState<boolean>(false)

  // Connect live camera stream to PIP video element & auto-recover if missing
  const setupMediaStreams = useCallback(async (autoRequest = true) => {
    let stream = proctoringService.getCameraStream()

    if (!stream || !stream.active) {
      if (autoRequest) {
        setIsReconnectingMedia(true)
        const res = await proctoringService.requestCameraAndMicrophone()
        setIsReconnectingMedia(false)
        if (res.success && res.stream) {
          stream = res.stream
          setCameraError(null)
        } else {
          setCameraError(res.error || 'Camera and microphone not connected.')
          setCameraActive(false)
          return null
        }
      } else {
        setCameraActive(false)
        return null
      }
    }

    if (stream && stream.active) {
      setCameraActive(true)
      setCameraError(null)
      if (candidateVideoRef.current) {
        candidateVideoRef.current.srcObject = stream
        candidateVideoRef.current.muted = true
        candidateVideoRef.current.play().catch(() => {})
      }
    } else {
      setCameraActive(false)
    }

    return stream
  }, [])

  // Auto-setup camera on mount
  useEffect(() => {
    setupMediaStreams(true)
  }, [setupMediaStreams])

  // Live microphone level visualizer
  useEffect(() => {
    const stream = proctoringService.getCameraStream()
    if (!stream || !stream.active) return

    const meter = proctoringService.createAudioMeter(stream)
    if (!meter) return

    let active = true
    let animId: number

    const loop = () => {
      if (!active) return
      setCandidateAudioLevel(meter.getVolume())
      animId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      active = false
      cancelAnimationFrame(animId)
      meter.cleanup()
    }
  }, [cameraActive])

  // Fullscreen exit detection
  useEffect(() => {
    let mounted = true
    setIsFullscreen(proctoringService.isFullscreen())

    const handleFullscreenChange = () => {
      if (!mounted || isSubmittingRef.current) return

      const currentlyFs = proctoringService.isFullscreen()
      setIsFullscreen(currentlyFs)

      if (!currentlyFs) {
        // Candidate exited fullscreen during active test
        setExitCount((prev) => {
          const nextCount = prev + 1
          try {
            sessionStorage.setItem(`practiceExitCount-${sessionId}`, String(nextCount))
          } catch {
            // Ignore
          }

          if (nextCount === 1) {
            setFullscreenWarningModal(1)
          } else if (nextCount === 2) {
            setFullscreenWarningModal(2)
          } else if (nextCount >= 3) {
            setFullscreenWarningModal(3)
            triggerAutoSubmission('Fullscreen violation')
          }

          return nextCount
        })
      } else {
        // Re-entered fullscreen: dismiss warning 1 or 2
        setFullscreenWarningModal((cur) => (cur === 3 ? cur : null))
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      mounted = false
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [sessionId])

  // Screen sharing monitoring
  useEffect(() => {
    const screenStream = proctoringService.getScreenStream()
    if (!screenStream) {
      setScreenSharingStatus('ended')
      return
    }

    setScreenSharingStatus('active')
    const track = screenStream.getVideoTracks()[0]
    if (track) {
      const handleEnded = () => {
        if (isSubmittingRef.current) return
        setScreenSharingStatus('ended')
        setShowScreenShareModal(true)
      }
      track.addEventListener('ended', handleEnded)
      return () => {
        track.removeEventListener('ended', handleEnded)
      }
    }
  }, [])

  // Cleanup media tracks only when intentionally leaving the interview session
  useEffect(() => {
    const handleBeforeUnload = () => {
      proctoringService.stopAllMediaStreams()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (isLeavingSessionRef.current) {
        proctoringService.stopAllMediaStreams()
      }
    }
  }, [])

  const handleReturnToFullscreen = async () => {
    const res = await proctoringService.requestFullscreen()
    if (res.success) {
      setFullscreenWarningModal(null)
      setIsFullscreen(true)
    }
  }

  const handleResumeScreenShare = async () => {
    const res = await proctoringService.requestScreenShare(() => {
      if (isSubmittingRef.current) return
      setScreenSharingStatus('ended')
      setShowScreenShareModal(true)
    })

    if (res.success) {
      setScreenSharingStatus('active')
      setShowScreenShareModal(false)
    }
  }

  const triggerAutoSubmission = (reason: SubmissionReason) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    saveInterview(false, reason, 'Submitted - Proctoring')
  }

  // Active follow-up question references
  const activeFollowUps = sessionFollowUps[index] || []
  const isAnsweringFollowUp =
    activeFollowUpIndex !== null && Boolean(activeFollowUps[activeFollowUpIndex])
  const activeFollowUp = isAnsweringFollowUp
    ? activeFollowUps[activeFollowUpIndex!]
    : null
  const currentPromptText = isAnsweringFollowUp
    ? activeFollowUp!.prompt
    : sessionQuestions[index]?.prompt || ''

  const speakCurrentQuestion = useCallback(
    (customText?: string, leadIn?: string) => {
      const activeFUs = sessionFollowUps[index] || []
      const isFU = activeFollowUpIndex !== null && Boolean(activeFUs[activeFollowUpIndex])
      const textToSpeak =
        customText ||
        (isFU ? activeFUs[activeFollowUpIndex!].prompt : sessionQuestions[index]?.prompt || '')

      if (!textToSpeak) return

      const prefix =
        leadIn !== undefined
          ? leadIn
          : isFU
          ? 'Here is a follow-up question for you:'
          : index === 0
          ? `Welcome to your ${preferences.role || 'technical'} mock interview. Let us begin with your first question:`
          : ''

      const fullText = prefix ? `${prefix} ${textToSpeak}` : textToSpeak

      setSpokenLeadIn(prefix)
      setAvatarState('speaking')
      setIsSpeakingQuestion(true)

      ttsService.speak(fullText, {
        voice: interviewerVoice,
        rate: speechRate,
        volume: 1.0,
        onStart: () => {
          setAvatarState('speaking')
          setIsSpeakingQuestion(true)
        },
        onEnd: () => {
          setIsSpeakingQuestion(false)
          setAvatarState('listening')
        },
        onError: () => {
          setIsSpeakingQuestion(false)
          setAvatarState('idle')
        },
      })
    },
    [sessionQuestions, index, activeFollowUpIndex, sessionFollowUps, interviewerVoice, speechRate, preferences.role]
  )

  // Auto-speak question when question changes or when follow-up starts
  useEffect(() => {
    if (sessionQuestions[index] && !submitted) {
      speakCurrentQuestion()
    }
    return () => {
      ttsService.stop()
    }
  }, [index, activeFollowUpIndex])

  const handleToggleTTSMute = () => {
    const nextMuted = !isTTSMuted
    setIsTTSMuted(nextMuted)
    ttsService.setMuted(nextMuted)
    if (nextMuted) {
      setIsSpeakingQuestion(false)
      setAvatarState('listening')
    }
  }

  // ---------------------------------
  // Candidate Recording & MediaRecorder
  // ---------------------------------

  const handleStartRecording = async () => {
    // 1. Immediately halt question TTS if active
    ttsService.stop()
    setIsSpeakingQuestion(false)

    // 2. Activate recording state & countdown timer immediately
    setIsRecordingAnswer(true)
    setIsPausedRecording(false)
    setRecordingSeconds(0)
    setAvatarState('listening')
    setSpeechError('')

    // 3. Ensure live audio stream is ready
    let cameraStream = proctoringService.getCameraStream()
    if (!cameraStream || !cameraStream.active) {
      try {
        const recovered = await setupMediaStreams(true)
        if (recovered && recovered.active) {
          cameraStream = recovered
        }
      } catch (err) {
        console.warn('Audio stream auto-recovery error:', err)
      }
    }

    if (cameraStream) {
      voiceRecordingService.start(cameraStream)
    }

    // 4. Start speech recognition concurrently
    if (!isListening) {
      toggleListening()
    }
  }

  const handlePauseRecording = () => {
    voiceRecordingService.pause()
    setIsPausedRecording(true)
    stopListening()
  }

  const handleResumeRecording = () => {
    voiceRecordingService.resume()
    setIsPausedRecording(false)
    toggleListening()
  }

  const handleStopRecording = async () => {
    stopListening()
    setIsRecordingAnswer(false)
    setIsPausedRecording(false)
    await voiceRecordingService.stop()
    setAvatarState('idle')
  }

  const handleReRecord = () => {
    stopListening()
    voiceRecordingService.stopAndReset()
    setIsRecordingAnswer(false)
    setIsPausedRecording(false)
    setRecordingSeconds(0)
    updateAnswer('')
    setAvatarState('idle')
  }

  // Recording countdown timer
  useEffect(() => {
    let timer: any = null
    if (isRecordingAnswer && !isPausedRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1
          if (next >= answerTimeLimit) {
            handleStopRecording()
            return answerTimeLimit
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRecordingAnswer, isPausedRecording, answerTimeLimit])

  // ---------------------------------
  // Voice Evaluation & Dynamic Follow-up Handler
  // ---------------------------------

  const handleSubmitAnswerWithEvaluation = async () => {
    if (!answer.trim() || !currentQuestion || isEvaluating) return

    if (isRecordingAnswer) {
      await handleStopRecording()
    }

    setIsEvaluating(true)
    setAvatarState('evaluating')

    try {
      const activeFUs = sessionFollowUps[index] || []
      const isFU = activeFollowUpIndex !== null

      const response = await evaluateVoiceAnswer({
        questionId: isFU
          ? `${currentQuestion.id}-fu-${activeFollowUpIndex + 1}`
          : currentQuestion.id,
        question: isFU ? activeFUs[activeFollowUpIndex!].prompt : currentQuestion.prompt,
        category: currentQuestion.category,
        role: preferences.role || 'Full Stack Developer',
        difficulty: (preferences.difficulty || 'Medium') as QuestionDifficulty,
        expectedConcepts: currentQuestion.expectedConcepts || [],
        answer,
        sessionId,
        previousQuestions: sessionQuestions.slice(0, index).map((q) => q.prompt),
        previousAnswers: answers.slice(0, index),
        gaps: preferences.gaps,
        type: preferences.type,
        isFollowUp: isFU,
        parentQuestionId: isFU ? currentQuestion.id : undefined,
      })

      const evalResult = response.evaluation

      if (!isFU) {
        // Main question evaluated
        setEvaluations((prev) => ({
          ...prev,
          [index]: evalResult,
        }))
        storeEvaluationInSupabase(evalResult, sessionId).catch(() => {})

        // Check if dynamic follow-up generated and limit (< 2) not reached
        if (response.followUpQuestion && activeFUs.length < 2) {
          const newFollowUp: FollowUpItem = {
            id: `${currentQuestion.id}-fu-${Date.now()}`,
            parentQuestionId: currentQuestion.id,
            prompt: response.followUpQuestion,
            reasoning: response.followUpReasoning,
            conversationalLeadIn: response.conversationalTransition,
            userAnswer: '',
            createdAt: new Date().toISOString(),
          }

          const updated = [...activeFUs, newFollowUp]
          setSessionFollowUps((prev) => ({
            ...prev,
            [index]: updated,
          }))

          setActiveFollowUpIndex(updated.length - 1)
          updateAnswer('')
          setSubmitted(false)

          speakCurrentQuestion(newFollowUp.prompt, newFollowUp.conversationalLeadIn)
        } else {
          setSubmitted(true)
          setReviewed((prev) => prev.map((item, i) => (i === index ? true : item)))
          setAvatarState('idle')
        }
      } else {
        // Follow-up question evaluated
        const updated = [...activeFUs]
        updated[activeFollowUpIndex!] = {
          ...updated[activeFollowUpIndex!],
          userAnswer: answer,
          score: evalResult.score,
          evaluation: evalResult,
          evaluatedAt: new Date().toISOString(),
        }

        setSessionFollowUps((prev) => ({
          ...prev,
          [index]: updated,
        }))

        // Allow 2nd follow-up if applicable
        if (response.followUpQuestion && updated.length < 2) {
          const secondFU: FollowUpItem = {
            id: `${currentQuestion.id}-fu2-${Date.now()}`,
            parentQuestionId: currentQuestion.id,
            prompt: response.followUpQuestion,
            reasoning: response.followUpReasoning,
            conversationalLeadIn: response.conversationalTransition,
            userAnswer: '',
            createdAt: new Date().toISOString(),
          }

          const withSecond = [...updated, secondFU]
          setSessionFollowUps((prev) => ({
            ...prev,
            [index]: withSecond,
          }))

          setActiveFollowUpIndex(withSecond.length - 1)
          updateAnswer('')
          setSubmitted(false)

          speakCurrentQuestion(secondFU.prompt, secondFU.conversationalLeadIn)
        } else {
          setActiveFollowUpIndex(null)
          setSubmitted(true)
          setReviewed((prev) => prev.map((item, i) => (i === index ? true : item)))
          setAvatarState('idle')
        }
      }
    } catch (err) {
      console.warn('Voice evaluation error:', err)
      setAvatarState('error')
    } finally {
      setIsEvaluating(false)
    }
  }

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null)

  const currentQuestion = sessionQuestions[index]
  const answer = answers[index] || ''

  const currentEvaluation: AnswerEvaluation = evaluations[index] || (
    scoreAnswerLocally(answer, {
      questionId: currentQuestion?.id,
      question: currentQuestion?.prompt,
      category: currentQuestion?.category,
      role: preferences.role,
      expectedConcepts: currentQuestion?.expectedConcepts,
    }) as unknown as AnswerEvaluation
  )

  const currentResult = currentEvaluation

  const completedQuestions = reviewed.filter(Boolean).length

  const questionCount = sessionQuestions.length || 1

  const progress = Math.round(
    (completedQuestions / questionCount) * 100
  )

  // ---------------------------------
  // Update answer
  // ---------------------------------

  const updateAnswer = (value: string) => {
    setAnswers((previous) =>
      previous.map((item, i) =>
        i === index ? value : item
      )
    )

    setSubmitted(false)

    setReviewed((previous) =>
      previous.map((item, i) =>
        i === index ? false : item
      )
    )
  }

  // ---------------------------------
  // Speech recognition cleanup
  // ---------------------------------

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setIsListening(false)
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  // ---------------------------------
  // Speech recognition
  // ---------------------------------

  const toggleListening = () => {
    if (isListening) {
      stopListening()
      return
    }

    const browserWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }

    const SpeechRecognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechError(
        'Speech recognition is not supported. Please type your answer.'
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setSpeechError('')
      }

      recognition.onresult = (event) => {
        let finalChunk = ''

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const result = event.results[i]

          if (result.isFinal) {
            finalChunk += result[0].transcript
          }
        }

        if (finalChunk.trim()) {
          setAnswers((previous) =>
            previous.map((item, i) => {
              if (i !== index) return item

              const separator = item.trim() ? ' ' : ''

              return item + separator + finalChunk.trim()
            })
          )

          setSubmitted(false)

          setReviewed((previous) =>
            previous.map((item, i) =>
              i === index ? false : item
            )
          )
        }
      }

      recognition.onerror = (e: any) => {
        // Ignore expected silence pauses from the browser SpeechRecognition engine
        if (e && (e.error === 'no-speech' || e.error === 'network')) {
          return
        }
        setSpeechError(
          'Microphone recognition paused. You can speak or continue typing directly.'
        )
        setIsListening(false)
        recognitionRef.current = null
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
      }

      recognitionRef.current = recognition
      recognition.start()

    } catch {
      setIsListening(false)
      setSpeechError('Unable to start microphone recognition.')
    }
  }

  // ---------------------------------
  // Review answer (AI-powered with graceful fallback)
  // ---------------------------------

  const reviewAnswer = async () => {
    if (!answer.trim() || !currentQuestion || isEvaluating) return

    setIsEvaluating(true)
    try {
      const evaluation = await evaluateAnswer({
        questionId: currentQuestion.id,
        question: currentQuestion.prompt,
        category: currentQuestion.category,
        role: preferences.role || 'Full Stack Developer',
        difficulty: (preferences.difficulty || 'Medium') as QuestionDifficulty,
        expectedConcepts: currentQuestion.expectedConcepts || [],
        answer,
        sessionId,
      })

      setEvaluations((previous) => ({
        ...previous,
        [index]: evaluation,
      }))

      // Persist to Supabase in the background
      storeEvaluationInSupabase(evaluation, sessionId).catch((err) => {
        console.warn('Background Supabase storage error:', err)
      })
    } catch (err) {
      console.warn('Evaluation failed, falling back to local evaluator:', err)
      const fallback = evaluateAnswerFallback({
        questionId: currentQuestion.id,
        question: currentQuestion.prompt,
        category: currentQuestion.category,
        role: preferences.role || 'Full Stack Developer',
        difficulty: (preferences.difficulty || 'Medium') as QuestionDifficulty,
        expectedConcepts: currentQuestion.expectedConcepts || [],
        answer,
        sessionId,
      })

      setEvaluations((previous) => ({
        ...previous,
        [index]: fallback,
      }))
    } finally {
      setIsEvaluating(false)
      setSubmitted(true)
      setReviewed((previous) =>
        previous.map((item, i) => (i === index ? true : item))
      )
    }
  }

  // ---------------------------------
  // Save interview result
  // ---------------------------------

  const saveInterview = async (
    completed: boolean,
    submissionReason: SubmissionReason = 'Normal submission',
    status: SessionProctoringStatus = completed ? 'Completed' : 'Incomplete'
  ) => {
    if (!sessionId) return
    isSubmittingRef.current = true

    // Ensure every question has a formal evaluation record
    const finalEvaluations: AnswerEvaluation[] = []

    for (let i = 0; i < sessionQuestions.length; i++) {
      const question = sessionQuestions[i]
      const ans = answers[i] || ''

      if (evaluations[i]) {
        finalEvaluations.push(evaluations[i])
      } else if (ans.trim()) {
        try {
          const evalResult = await evaluateAnswer({
            questionId: question.id,
            question: question.prompt,
            category: question.category,
            role: preferences.role || 'Full Stack Developer',
            difficulty: (preferences.difficulty || 'Medium') as QuestionDifficulty,
            expectedConcepts: question.expectedConcepts || [],
            answer: ans,
            sessionId,
          })
          finalEvaluations.push(evalResult)
          storeEvaluationInSupabase(evalResult, sessionId).catch(() => {})
        } catch {
          const fallback = evaluateAnswerFallback({
            questionId: question.id,
            question: question.prompt,
            category: question.category,
            role: preferences.role || 'Full Stack Developer',
            difficulty: (preferences.difficulty || 'Medium') as QuestionDifficulty,
            expectedConcepts: question.expectedConcepts || [],
            answer: ans,
            sessionId,
          })
          finalEvaluations.push(fallback)
        }
      } else {
        const emptyEval = evaluateAnswerFallback({
          questionId: question.id,
          question: question.prompt,
          category: question.category,
          role: preferences.role || 'Full Stack Developer',
          difficulty: (preferences.difficulty || 'Medium') as QuestionDifficulty,
          expectedConcepts: question.expectedConcepts || [],
          answer: '',
          sessionId,
        })
        finalEvaluations.push(emptyEval)
      }
    }

    // Collect all evaluations: main questions + follow-ups
    const allEvaluations: AnswerEvaluation[] = [...finalEvaluations]

    Object.values(sessionFollowUps).forEach((fuList) => {
      fuList.forEach((fu) => {
        if (fu.evaluation) {
          allEvaluations.push(fu.evaluation)
        }
      })
    })

    const answeredResults = allEvaluations.filter(
      (item) => item.answer && item.answer.trim().length > 0
    )

    const averageScore =
      answeredResults.length > 0
        ? Math.round(
          answeredResults.reduce(
            (total, item) => total + item.score,
            0
          ) / answeredResults.length
        )
        : 0

    const isCompletedAttempt =
      completed ||
      status === 'Completed' ||
      answeredResults.length > 0 ||
      reviewed.some(Boolean)

    const result = {
      id: sessionId,
      sessionId,
      config: {
        role: preferences.role,
        type: preferences.type,
        difficulty: preferences.difficulty,
        voice: preferences.voice,
        source: preferences.source,
        gaps: preferences.gaps,
      },
      answers,
      evaluations: allEvaluations,
      mainEvaluations: finalEvaluations,
      followUps: sessionFollowUps,
      totalQuestions: sessionQuestions.length,
      answeredQuestions: answeredResults.length,
      reviewedQuestions: reviewed.filter(Boolean).length,
      averageScore,
      completed: isCompletedAttempt,
      completedAt: new Date().toISOString(),
      fullscreenExitCount: exitCount,
      screenSharingStatus,
      submissionReason,
      status: isCompletedAttempt ? 'Completed' : status,
    }

    // Save individual interview report
    sessionStorage.setItem(
      `practiceResult-${sessionId}`,
      JSON.stringify(result)
    )

    // Ensure session-specific and active config are saved
    sessionStorage.setItem(
      `practiceConfig-${sessionId}`,
      JSON.stringify(result.config)
    )
    sessionStorage.setItem(
      'activePractice',
      JSON.stringify(result.config)
    )

    // Clear temporary in-progress draft state since session is finalized
    sessionStorage.removeItem(`practiceSessionState-${sessionId}`)
    sessionStorage.removeItem(`practiceQuestionIds-${sessionId}`)

    // Save local development history safely
    let previousHistory: Array<{ sessionId?: string }> = []

    try {
      const parsed: unknown = JSON.parse(
        localStorage.getItem('practiceHistory') || '[]'
      )

      if (Array.isArray(parsed)) {
        previousHistory = parsed
      }
    } catch {
      previousHistory = []
    }

    const updatedHistory = [
      ...previousHistory.filter(
        (item) => item.sessionId !== sessionId
      ),
      result,
    ]

    localStorage.setItem(
      'practiceHistory',
      JSON.stringify(updatedHistory)
    )

    // Save to Supabase for authenticated users with Row Level Security
    if (user && isSupabaseConfigured && user.id && user.id !== 'demo-user-1') {
      try {
        await saveSessionToSupabase({
          sessionId,
          userId: user.id,
          config: result.config,
          questions: sessionQuestions,
          answers,
          reviewed,
          evaluations: finalEvaluations,
          completed: isCompletedAttempt,
          averageScore,
          fullscreenExitCount: exitCount,
          screenSharingStatus,
          submissionReason,
          status: isCompletedAttempt ? 'Completed' : status,
        })
      } catch (err) {
        console.warn('Failed to persist session to Supabase:', err)
      }
    }

    // Stop all media tracks upon interview completion
    isLeavingSessionRef.current = true
    proctoringService.stopAllMediaStreams()

    // Navigate to the saved report passing result & config in state
    navigate(`/reports/${sessionId}`, {
      state: { result, config: result.config },
    })
  }

  // ---------------------------------
  // Next question
  // ---------------------------------

  const next = () => {
    if (!answer.trim() && !submitted) {
      alert('Please provide an answer before continuing.')
      return
    }

    if (!submitted) {
      alert('Please review and submit your answer before continuing.')
      return
    }

    stopListening()
    ttsService.stop()
    voiceRecordingService.stopAndReset()
    setIsRecordingAnswer(false)
    setIsPausedRecording(false)

    if (index < sessionQuestions.length - 1) {
      const nextIdx = index + 1
      setIndex(nextIdx)
      setActiveFollowUpIndex(null)
      setShowHint(false)
      setSubmitted(Boolean(evaluations[nextIdx]))
      setSpeechError('')
      setAvatarState('idle')
    } else {
      saveInterview(true, 'Normal submission', 'Completed')
    }
  }

  // ---------------------------------
  // End interview
  // ---------------------------------

  const end = () => {
    setShowEndModal(true)
  }

  const confirmEnd = () => {
    setShowEndModal(false)
    stopListening()
    ttsService.stop()
    voiceRecordingService.stopAndReset()
    saveInterview(false, 'Candidate ended interview', 'Completed')
  }

  // ---------------------------------
  // Navigate between questions
  // ---------------------------------

  const goToQuestion = (questionIndex: number) => {
    stopListening()
    ttsService.stop()
    voiceRecordingService.stopAndReset()
    setIsRecordingAnswer(false)
    setIsPausedRecording(false)

    setIndex(questionIndex)
    setActiveFollowUpIndex(null)
    setShowHint(false)
    setSubmitted(Boolean(evaluations[questionIndex]))
    setSpeechError('')
    setAvatarState('idle')
  }

  if (!currentQuestion || sessionQuestions.length === 0) {
    return (
      <div className="page-stack">
        <div className="panel empty-state-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 16px' }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#20283b' }}>
            No matching questions found
          </h2>
          <p style={{ margin: '0 0 20px', color: '#64748b', lineHeight: 1.6, maxWidth: 520 }}>
            We could not find any {preferences.type} questions at {preferences.difficulty} difficulty for{' '}
            <strong>{preferences.role || 'the selected role'}</strong>.
            <br />
            Try adjusting the interview type, difficulty level, or target role in settings.
          </p>
          {preferences.gaps && preferences.gaps.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
              {preferences.gaps.map((gap) => (
                <span key={gap} className="type-chip">
                  {gap}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/interview/setup" className="button button-primary">
              <ArrowLeft size={16} />
              Back to setup
            </Link>
            <Link to="/dashboard" className="button button-secondary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------
  // Main interface
  // ---------------------------------

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="page-stack interview-room-page"
        style={{
          minHeight: '100vh',
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '24px 34px 48px',
          boxSizing: 'border-box',
        }}
      >

      {/* Top Header */}

      <div className="room-topline">

        <Link
          to="/interview/setup"
          className="back-link"
          onClick={() => {
            isLeavingSessionRef.current = true
            proctoringService.stopAllMediaStreams()
          }}
        >
          <ArrowLeft size={15} />
          Exit practice
        </Link>

        <div className="room-title">
          <span className="live-dot" />
          Practice session
          <span className="room-id">{sessionId}</span>
          <span className="room-id">{preferences.role}</span>
          <span className="room-id">{preferences.difficulty}</span>
        </div>

        {/* Proctoring Badges in Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleReturnToFullscreen}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '12px',
              background: isFullscreen ? '#dcfce7' : '#fee2e2',
              color: isFullscreen ? '#15803d' : '#b91c1c',
              border: 'none',
              cursor: isFullscreen ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={isFullscreen ? 'Fullscreen mode is active' : 'Click to enter fullscreen mode'}
          >
            <Maximize2 size={12} />
            {isFullscreen ? 'Fullscreen' : 'Enter Fullscreen (Warning)'}
          </button>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '12px',
              background: exitCount === 0 ? '#f1f5f9' : exitCount === 1 ? '#fef3c7' : '#fee2e2',
              color: exitCount === 0 ? '#64748b' : exitCount === 1 ? '#b45309' : '#b91c1c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={12} />
            Warnings: {exitCount} / 2
          </span>

          <button
            type="button"
            onClick={screenSharingStatus !== 'active' ? handleResumeScreenShare : undefined}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '12px',
              background: screenSharingStatus === 'active' ? '#ecfdf5' : '#fee2e2',
              color: screenSharingStatus === 'active' ? '#047857' : '#b91c1c',
              border: 'none',
              cursor: screenSharingStatus === 'active' ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={screenSharingStatus === 'active' ? 'Screen sharing active' : 'Click to share screen'}
          >
            <Monitor size={12} />
            {screenSharingStatus === 'active' ? 'Screen Sharing' : 'Start Screen Share'}
          </button>
        </div>

        <button
          className="button button-quiet"
          onClick={end}
        >
          <X size={15} />
          End session
        </button>

      </div>

      {/* Proctoring Incomplete Banner */}
      {(!isFullscreen || screenSharingStatus !== 'active') && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', display: 'block' }}>
                Proctoring Requirements Notice
              </span>
              <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                {!isFullscreen && screenSharingStatus !== 'active'
                  ? 'Your mock interview requires Fullscreen mode and Screen Sharing to record a verified result.'
                  : !isFullscreen
                  ? 'Please click "Enter Fullscreen" to begin your proctored session in full screen.'
                  : 'Screen sharing is stopped. Click "Share Screen" to share your screen.'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isFullscreen && (
              <button
                type="button"
                onClick={handleReturnToFullscreen}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 15px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Maximize2 size={13} />
                Enter Fullscreen
              </button>
            )}
            {screenSharingStatus !== 'active' && (
              <button
                type="button"
                onClick={handleResumeScreenShare}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 15px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Monitor size={13} />
                Share Screen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}

      <div className="room-progress">

        <div className="room-progress-label">

          <span>
            QUESTION {index + 1}
            <span className="muted-inline">
              {' '}OF {sessionQuestions.length}
            </span>
          </span>

          <span>
            <Clock3 size={14} />
            {completedQuestions} of {sessionQuestions.length} reviewed
          </span>

        </div>

        <div className="room-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>

      </div>

      {/* Main Interview Layout */}

      <div className="room-layout">

        <section className="panel question-panel">

          {/* Animated AI Interviewer Avatar */}
          <AIInterviewerAvatar
            voice={interviewerVoice}
            state={avatarState}
            currentPrompt={currentPromptText}
            conversationalLeadIn={spokenLeadIn}
            isMuted={isTTSMuted}
            onToggleMute={handleToggleTTSMute}
            onReplayQuestion={() => speakCurrentQuestion()}
            onRetry={() => speakCurrentQuestion()}
            isFollowUp={isAnsweringFollowUp}
          />

          {/* Current Question Focus Card */}
          <div
            className="panel"
            style={{
              background: isAnsweringFollowUp ? '#fefce8' : '#f8fafc',
              border: isAnsweringFollowUp ? '1.5px solid #fef08a' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px 22px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="type-chip">{currentQuestion.category}</span>
                {isAnsweringFollowUp ? (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#fef3c7',
                      color: '#b45309',
                    }}
                  >
                    Dynamic Follow-up {activeFollowUpIndex! + 1} of 2
                  </span>
                ) : (
                  <span className="question-number">
                    Question {String(index + 1).padStart(2, '0')} of {sessionQuestions.length}
                  </span>
                )}
              </div>

              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                Difficulty: {preferences.difficulty || 'Medium'}
              </span>
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#1e293b',
                margin: '0 0 8px',
                lineHeight: 1.4,
              }}
            >
              {currentPromptText}
            </h2>

            {isAnsweringFollowUp && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  padding: '8px 12px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <strong>Original Topic:</strong> &ldquo;{currentQuestion.prompt}&rdquo;
              </div>
            )}
          </div>

          {/* Audio Controls & Answer Timer */}
          <div style={{ marginTop: '14px' }}>
            <InterviewAudioControls
              isMuted={isTTSMuted}
              speechRate={speechRate}
              isSpeaking={isSpeakingQuestion}
              onToggleMute={handleToggleTTSMute}
              onChangeSpeechRate={(rate) => setSpeechRate(rate)}
              onReplayQuestion={() => speakCurrentQuestion()}
              isRecording={isRecordingAnswer}
              isPaused={isPausedRecording}
              elapsedSeconds={recordingSeconds}
              totalSeconds={answerTimeLimit}
              audioLevel={candidateAudioLevel}
              onStartRecording={handleStartRecording}
              onPauseRecording={handlePauseRecording}
              onResumeRecording={handleResumeRecording}
              onStopRecording={handleStopRecording}
              onReRecord={handleReRecord}
              onSubmitAnswer={handleSubmitAnswerWithEvaluation}
              canSubmit={Boolean(answer.trim().length > 0)}
              isEvaluating={isEvaluating}
              recordingDisabled={isSpeakingQuestion}
            />
          </div>

          {/* Answer Transcript Field */}
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="field-label answer-label" htmlFor="answer-text" style={{ margin: 0 }}>
                {isAnsweringFollowUp ? 'Follow-up Answer Transcript' : 'Spoken Answer Transcript'}
              </label>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                {answer.trim() ? answer.trim().split(/\s+/).length : 0} words · Editable transcript
              </span>
            </div>

            <textarea
              id="answer-text"
              className="answer-textarea"
              value={answer}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={
                isRecordingAnswer
                  ? 'Listening to you... Speak now and your words will appear here in real time.'
                  : 'Click "Start Recording" to speak, or type your answer directly here...'
              }
              style={{ minHeight: '160px' }}
            />
          </div>

          {speechError && (
            <p role="alert" className="small-disclaimer">
              {speechError}
            </p>
          )}

          {/* Hint */}

          {showHint && (
            <div className="hint-box">

              <Lightbulb size={17} />

              <div>
                <strong>Consider this approach</strong>
                <p>{currentQuestion.hint}</p>
              </div>

            </div>
          )}

          {/* Answer Feedback */}

          {submitted && currentEvaluation && (
            <div className="demo-feedback">

              <div className="demo-feedback-head">

                <CheckCircle2 size={18} />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong>Evaluation reflection</strong>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        background: currentEvaluation.evaluatedBy === 'ai' ? '#ecfdf5' : '#fffbeb',
                        color: currentEvaluation.evaluatedBy === 'ai' ? '#047857' : '#b45309',
                        border: `1px solid ${currentEvaluation.evaluatedBy === 'ai' ? '#a7f3d0' : '#fde68a'}`,
                      }}
                    >
                      {currentEvaluation.evaluatedBy === 'ai' ? '✨ AI Evaluated' : '⚠️ Offline Fallback'}
                    </span>
                  </div>
                  <span>Technical correctness, communication, &amp; problem-solving rubric</span>
                </div>

                <strong className="demo-score">
                  {currentEvaluation.score}/100
                </strong>

              </div>

              {/* Subscores Grid */}
              {currentEvaluation.technicalCorrectness && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    margin: '14px 0',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      <span>Technical Correctness</span>
                      <span>{currentEvaluation.technicalCorrectness.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                      {currentEvaluation.technicalCorrectness.feedback}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      <span>Communication &amp; Structure</span>
                      <span>{currentEvaluation.communication.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                      {currentEvaluation.communication.feedback}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      <span>Problem Solving</span>
                      <span>{currentEvaluation.problemSolving.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                      {currentEvaluation.problemSolving.feedback}
                    </p>
                  </div>
                </div>
              )}

              <div className="feedback-columns">

                <div>
                  <b>What went well</b>
                  {currentEvaluation.strengths.map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>

                <div>
                  <b>Specific improvements</b>
                  {currentEvaluation.improvements.map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>

              </div>

              {/* Ideal Answer Outline */}
              {currentEvaluation.idealAnswerOutline && currentEvaluation.idealAnswerOutline.length > 0 && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <b style={{ display: 'block', marginBottom: '6px', color: '#166534', fontSize: '12px' }}>
                    💡 Ideal Answer Outline:
                  </b>
                  {currentEvaluation.idealAnswerOutline.map((point, pIdx) => (
                    <p key={pIdx} style={{ margin: '3px 0', fontSize: '11px', color: '#14532d', lineHeight: 1.5 }}>
                      {point.startsWith('•') || /^\d+\./.test(point) ? point : `• ${point}`}
                    </p>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Question Actions */}

          <div className="question-actions">

            <button
              className="button button-quiet"
              onClick={() => setShowHint((previous) => !previous)}
            >
              <Lightbulb size={16} />
              {showHint ? 'Hide hint' : 'Show a hint'}
            </button>

            <div className="action-right">

              <button
                className="button button-secondary"
                onClick={reviewAnswer}
                disabled={!answer.trim() || isEvaluating}
              >
                {isEvaluating ? (
                  <>
                    <Sparkles size={16} />
                    Evaluating...
                  </>
                ) : (
                  'Review answer'
                )}
              </button>

              <button
                className="button button-primary"
                onClick={next}
                disabled={!answer.trim() || !submitted}
              >
                {index === sessionQuestions.length - 1
                  ? 'Finish interview'
                  : 'Next question'}

                <ArrowRight size={16} />
              </button>

            </div>

          </div>

        </section>

        {/* Sidebar */}

        <aside className="room-side">

          {/* Candidate Live Proctoring Video Box */}
          <div className="panel room-side-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Video size={15} color="#4f46e5" />
                Candidate Feed
              </h3>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                Proctored
              </span>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/10',
                background: '#0f172a',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              <video
                ref={(el) => {
                  candidateVideoRef.current = el
                  if (el) {
                    const stream = proctoringService.getCameraStream()
                    if (stream && stream.active && el.srcObject !== stream) {
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
                  transform: 'scaleX(-1)',
                  display: cameraActive ? 'block' : 'none',
                }}
              />

              {!cameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#ffffff',
                    zIndex: 2,
                  }}
                >
                  <VideoOff size={22} color="#f87171" style={{ marginBottom: '6px' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', marginBottom: '2px' }}>
                    Camera Disconnected
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', marginBottom: '8px', lineHeight: 1.3 }}>
                    {cameraError || 'Camera or mic stream was disconnected'}
                  </span>
                  <button
                    type="button"
                    disabled={isReconnectingMedia}
                    onClick={() => setupMediaStreams(true)}
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '4px 10px',
                      cursor: isReconnectingMedia ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={11} />
                    {isReconnectingMedia ? 'Connecting...' : 'Reconnect Camera & Mic'}
                  </button>
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  right: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  zIndex: 3,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mic size={11} color={candidateAudioLevel > 15 ? '#22c55e' : '#94a3b8'} />
                  <span style={{ fontSize: '10px', color: '#ffffff' }}>Mic Level</span>
                </div>
                <div style={{ width: '50px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${candidateAudioLevel}%`,
                      height: '100%',
                      background: candidateAudioLevel > 15 ? '#22c55e' : '#64748b',
                      transition: 'width 0.08s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
              <div
                onClick={() => {
                  if (!cameraActive) setupMediaStreams(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: cameraActive ? 'default' : 'pointer',
                }}
                title={cameraActive ? 'Camera is active' : 'Click to reconnect camera'}
              >
                <ShieldCheck size={13} color={cameraActive ? '#16a34a' : '#ef4444'} />
                <span style={{ color: cameraActive ? '#16a34a' : '#ef4444' }}>
                  {cameraActive ? 'Camera Active' : 'Camera Stopped'}
                </span>
              </div>
              <div
                onClick={screenSharingStatus === 'ended' ? handleResumeScreenShare : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: screenSharingStatus === 'ended' ? 'pointer' : 'default',
                }}
                title={screenSharingStatus === 'ended' ? 'Click to re-share screen' : 'Screen sharing active'}
              >
                <Monitor size={13} color={screenSharingStatus === 'active' ? '#16a34a' : '#ef4444'} />
                <span style={{ color: screenSharingStatus === 'active' ? '#16a34a' : '#ef4444' }}>
                  {screenSharingStatus === 'active' ? 'Screen Shared' : 'Re-share Screen'}
                </span>
              </div>
            </div>
          </div>

          <div className="panel room-side-card">

            <div className="side-card-icon">
              <Info size={17} />
            </div>

            <h3>What we're looking for</h3>

            <p>
              Good interview answers are clear, relevant,
              and supported by evidence.
            </p>

            <ul>
              <li>Answer the prompt directly</li>
              <li>Explain your reasoning</li>
              <li>Include numbers or trade-offs</li>
              <li>Share the outcome or next steps</li>
            </ul>

          </div>

          {/* Session Outline */}

          <div className="room-question-list panel">

            <h3>Session outline</h3>

            {sessionQuestions.map((question, i) => (

              <button
                key={question.id}
                className={`outline-item ${i === index ? 'current' : ''} ${reviewed[i] ? 'done' : ''}`}
                onClick={() => goToQuestion(i)}
              >

                <span className="outline-number">
                  {reviewed[i]
                    ? <CheckCircle2 size={15} />
                    : String(i + 1).padStart(2, '0')}
                </span>

                <span>{question.category}</span>

                <ArrowRight size={14} />

              </button>

            ))}

          </div>

          {/* Selected Skill Gaps */}

          {preferences.gaps && preferences.gaps.length > 0 && (
            <div className="panel room-side-card">

              <h3>Your focus areas</h3>

              <p>
                This session is configured to focus on:
              </p>

              <ul>
                {preferences.gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>

            </div>
          )}

          <div className="privacy-note">

            <Info size={14} />

            <span>
              When you speak in the demo, your browser
              turns it into text. Audio files are not
              uploaded by this implementation.
            </span>

          </div>

        </aside>

      </div>

      {showEndModal && (
        <div
          className="consent-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '18px',
                fontWeight: 800,
                color: '#20283b',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              End practice session?
            </h3>
            <p
              style={{
                margin: '0 0 24px',
                fontSize: '13.5px',
                color: '#64748b',
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to end this interview? Your submitted answers,
              role, and all selected settings will be saved to your final report.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowEndModal(false)}
              >
                Continue practice
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={confirmEnd}
              >
                End &amp; view report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Warning 1 Modal */}
      {fullscreenWarningModal === 1 && (
        <div
          className="consent-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.35)',
              border: '2px solid #fef08a',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fef9c3',
                color: '#ca8a04',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '19px',
                fontWeight: 800,
                color: '#1e293b',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Warning 1 of 2: You have exited fullscreen
            </h3>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14px',
                color: '#64748b',
                lineHeight: 1.6,
              }}
            >
              Please return to fullscreen to continue your interview. Proctoring policies require fullscreen mode to ensure authentic candidate engagement.
            </p>

            <button
              type="button"
              className="button button-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onClick={handleReturnToFullscreen}
            >
              <Maximize2 size={16} />
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Warning 2 Modal (Final Warning) */}
      {fullscreenWarningModal === 2 && (
        <div
          className="consent-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(7px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.4)',
              border: '2px solid #fed7aa',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#ffedd5',
                color: '#ea580c',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '19px',
                fontWeight: 800,
                color: '#9a3412',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Warning 2 of 2: This is your final warning
            </h3>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14px',
                color: '#64748b',
                lineHeight: 1.6,
              }}
            >
              Exiting fullscreen again will automatically submit your interview and terminate your session under proctoring policy.
            </p>

            <button
              type="button"
              className="button button-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '14px',
                background: '#ea580c',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onClick={handleReturnToFullscreen}
            >
              <Maximize2 size={16} />
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Warning 3 Modal (Automatic Submission / Termination) */}
      {fullscreenWarningModal === 3 && (
        <div
          className="consent-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '30px',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.5)',
              border: '2px solid #fecaca',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <X size={30} strokeWidth={2.5} />
            </div>

            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '20px',
                fontWeight: 800,
                color: '#991b1b',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Interview Automatically Submitted
            </h3>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              Your interview has been automatically submitted because you exited fullscreen three times. All answers and completed evaluations have been safely stored.
            </p>

            <button
              type="button"
              className="button button-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '14px',
                background: '#dc2626',
              }}
              onClick={() => {
                navigate(`/reports/${sessionId}`)
              }}
            >
              View Interview Report
            </button>
          </div>
        </div>
      )}

      {/* Screen Sharing Interrupted Modal */}
      {showScreenShareModal && (
        <div
          className="consent-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(7px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.45)',
              border: '2px solid #fed7aa',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#ffedd5',
                color: '#c2410c',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Monitor size={28} />
            </div>

            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '19px',
                fontWeight: 800,
                color: '#1e293b',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Screen Sharing Interrupted
            </h3>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14px',
                color: '#64748b',
                lineHeight: 1.6,
              }}
            >
              Screen sharing has stopped. Active screen sharing is required to maintain proctoring integrity. Please restart screen sharing to resume your practice.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1, padding: '11px 16px', fontSize: '13px' }}
                onClick={() => {
                  setShowScreenShareModal(false)
                  saveInterview(false, 'Screen-sharing violation', 'Submitted - Proctoring')
                }}
              >
                Save &amp; End
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1.2, padding: '11px 16px', fontSize: '13px' }}
                onClick={handleResumeScreenShare}
              >
                Resume Screen Sharing
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
