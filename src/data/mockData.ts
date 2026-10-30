import type { InterviewSession, Question } from '../types'
import { fullQuestionBank } from './questionBank'

// ==========================================
// INTERVIEW SESSION DATA
// ==========================================

export const sessions: InterviewSession[] = [
  {
    id: 'INT-1048',
    role: 'Frontend Developer',
    type: 'Technical',
    difficulty: 'Intermediate',
    date: 'Oct 24, 2026',
    score: 82,
    status: 'Completed',
  },
  {
    id: 'INT-1042',
    role: 'Software Engineer',
    type: 'Mixed',
    difficulty: 'Intermediate',
    date: 'Oct 21, 2026',
    score: 76,
    status: 'Completed',
  },
  {
    id: 'INT-1037',
    role: 'Graduate Engineer Trainee',
    type: 'Behavioral',
    difficulty: 'Beginner',
    date: 'Oct 18, 2026',
    score: 88,
    status: 'Completed',
  },
]

// ==========================================
// CANDIDATE SKILL PERFORMANCE
// ==========================================

export const skillData = [
  { skill: 'Communication', score: 78 },
  { skill: 'Problem solving', score: 84 },
  { skill: 'Technical depth', score: 71 },
  { skill: 'Structure', score: 82 },
  { skill: 'Confidence', score: 69 },
]

// ==========================================
// INTERVIEW SCORE HISTORY
// ==========================================

export const scoreTrend = [
  { session: 'Oct 02', score: 62 },
  { session: 'Oct 06', score: 68 },
  { session: 'Oct 12', score: 65 },
  { session: 'Oct 18', score: 78 },
  { session: 'Oct 21', score: 76 },
  { session: 'Oct 24', score: 82 },
]

// ==========================================
// INTERVIEW QUESTION BANK (Legacy re-export)
// ==========================================
// The full expanded bank lives in src/data/questionBank.ts.
// This re-export maintains backward compatibility for any
// code that imports `questionBank` from this file.
// ==========================================

export const questionBank: (Question & {
  type: 'Technical' | 'Behavioral' | 'HR' | 'Mixed'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  role: string[]
  expectedConcepts: string[]
  'expected concepts'?: string[]
})[] = fullQuestionBank

// ==========================================
// DASHBOARD CALCULATIONS
// ==========================================

export const getCompletedSessions = () => {
  return sessions.filter(
    (session) =>
      session.status.toLowerCase() === 'completed'
  )
}

export const getAverageScore = () => {
  const completed = getCompletedSessions()

  if (completed.length === 0) return 0

  const total = completed.reduce(
    (sum, session) => sum + session.score,
    0
  )

  return Math.round(total / completed.length)
}

export const getLatestScore = () => {
  if (scoreTrend.length === 0) return 0

  return scoreTrend[scoreTrend.length - 1].score
}

export const getScoreImprovement = () => {
  if (scoreTrend.length < 2) return 0

  const first = scoreTrend[0].score
  const latest = getLatestScore()

  if (first === 0) return 0

  return Number(
    (((latest - first) / first) * 100).toFixed(1)
  )
}

export const getTotalInterviews = () => {
  return getCompletedSessions().length
}

// ==========================================
// LOCAL ANSWER EVALUATION (FALLBACK ONLY)
// ==========================================
//
// NOTE: This local keyword/heuristic scoring function serves strictly
// as an offline fallback when the AI evaluation service is unavailable.
// It is explicitly marked with evaluatedBy: 'fallback' and should never
// be presented to the candidate as genuine AI evaluation.
// ==========================================

import { evaluateAnswerFallback } from '../engine/fallbackEvaluator'

export const scoreAnswerLocally = (
  answer: string,
  context?: {
    questionId?: string
    question?: string
    category?: string
    role?: string
    expectedConcepts?: string[]
  },
) => {
  const evaluation = evaluateAnswerFallback({
    questionId: context?.questionId || 'fallback-q',
    question: context?.question || 'Interview Question',
    category: context?.category || 'General',
    role: context?.role || 'Software Engineer',
    difficulty: 'Medium',
    expectedConcepts: context?.expectedConcepts || [],
    answer,
  })

  return {
    score: evaluation.score,
    words: evaluation.words,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    weaknesses: evaluation.weaknesses,
    technicalCorrectness: evaluation.technicalCorrectness,
    communication: evaluation.communication,
    problemSolving: evaluation.problemSolving,
    idealAnswerOutline: evaluation.idealAnswerOutline,
    evaluatedBy: 'fallback' as const,
    evaluatedAt: evaluation.evaluatedAt,
  }
}