export type InterviewType = 'Technical' | 'Behavioral' | 'HR' | 'Mixed'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Easy' | 'Medium' | 'Hard'
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard'

export type SubmissionReason =
  | 'Normal submission'
  | 'Fullscreen violation'
  | 'Screen-sharing violation'
  | 'Candidate ended interview'

export type SessionProctoringStatus =
  | 'Completed'
  | 'Submitted - Proctoring'
  | 'Incomplete'
  | 'In progress'

export interface InterviewSession {
  id: string
  role: string
  type: InterviewType
  difficulty: Difficulty
  date: string
  score: number
  status: SessionProctoringStatus
  fullscreenExitCount?: number
  screenSharingStatus?: string
  submissionReason?: SubmissionReason
}

/** Legacy question shape — kept for backward compatibility */
export interface Question {
  id: string
  category: string
  prompt: string
  hint: string
}

/** Full question shape used by the adaptive question engine */
export interface InterviewQuestion {
  id: string
  type: InterviewType
  difficulty: QuestionDifficulty
  category: string
  /** Roles this question is relevant to. An empty array means it applies to all roles. */
  role: string[]
  prompt: string
  hint: string
  expectedConcepts: string[]
  /** Alias supporting hyphenated or spaced field name checks */
  'expected concepts'?: string[]
}

/** Configuration passed from InterviewSetupPage to the question engine */
export interface InterviewConfig {
  role: string
  type: InterviewType
  difficulty: QuestionDifficulty
  gaps: string[]
  excludeIds?: string[]
  sessionSize?: number
}

/** AI Avatar visual animation state */
export type AvatarAnimationState =
  | 'idle'
  | 'speaking'
  | 'listening'
  | 'thinking'
  | 'evaluating'
  | 'error'

/** Follow-up question generated dynamically based on candidate's answer */
export interface FollowUpItem {
  id: string
  parentQuestionId: string
  prompt: string
  reasoning?: string
  conversationalLeadIn?: string
  userAnswer: string
  audioTranscript?: string
  score?: number
  evaluation?: AnswerEvaluation
  createdAt: string
  evaluatedAt?: string
}

/** Detailed aspect of an evaluation (score + specific qualitative feedback) */
export interface EvaluationAspect {
  score: number // 0 - 100
  feedback: string
}

/** Full evaluation of a candidate's answer */
export interface AnswerEvaluation {
  questionId: string
  category: string
  question: string
  answer: string
  score: number // 0 - 100
  technicalCorrectness: EvaluationAspect
  communication: EvaluationAspect
  problemSolving: EvaluationAspect
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  idealAnswerOutline: string[]
  evaluatedBy: 'ai' | 'fallback'
  evaluatedAt: string
  words: number
  reviewed?: boolean
  followUpQuestion?: string
  followUpReasoning?: string
  conversationalTransition?: string
  isFollowUp?: boolean
  parentQuestionId?: string
}

/** Payload sent to the evaluation API */
export interface EvaluationRequest {
  questionId: string
  question: string
  category: string
  role: string
  difficulty: QuestionDifficulty
  expectedConcepts: string[]
  answer: string
  sessionId?: string
  previousQuestions?: string[]
  previousAnswers?: string[]
  gaps?: string[]
  type?: string
  isFollowUp?: boolean
  parentQuestionId?: string
}

/** Response from the evaluation API */
export interface EvaluationResponse {
  success: boolean
  evaluation: AnswerEvaluation
  source: 'ai' | 'fallback'
  warning?: string
  error?: string
}
