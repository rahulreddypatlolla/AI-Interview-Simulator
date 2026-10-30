/**
 * CareerVerse AI Interview Simulator - Client Voice Evaluation Service
 *
 * Communicates with the secure backend at /api/voice-interview/evaluate
 * to analyze answers and retrieve dynamic follow-up questions.
 */

import type {
  AnswerEvaluation,
  QuestionDifficulty,
} from '../types'
import { evaluateAnswerFallback } from '../engine/fallbackEvaluator'

export interface VoiceEvaluationClientRequest {
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

export interface VoiceEvaluationClientResponse {
  success: boolean
  evaluation: AnswerEvaluation
  followUpQuestion?: string
  followUpReasoning?: string
  conversationalTransition?: string
  source: 'ai' | 'fallback'
  error?: string
}

export async function evaluateVoiceAnswer(
  request: VoiceEvaluationClientRequest,
): Promise<VoiceEvaluationClientResponse> {
  try {
    const res = await fetch('/api/voice-interview/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (res.ok) {
      const data = await res.json()
      if (data && data.evaluation) {
        return {
          success: true,
          evaluation: data.evaluation,
          followUpQuestion: data.followUpQuestion || data.evaluation.followUpQuestion,
          followUpReasoning: data.followUpReasoning || data.evaluation.followUpReasoning,
          conversationalTransition:
            data.conversationalTransition || data.evaluation.conversationalTransition,
          source: data.source || 'ai',
        }
      }
    }
  } catch (err) {
    console.warn('[VoiceEvaluationClient Error]:', err, 'Using client-side fallback.')
  }

  // Fallback when server is offline or unreachable
  const fallback = evaluateAnswerFallback({
    questionId: request.questionId,
    question: request.question,
    category: request.category,
    role: request.role,
    difficulty: request.difficulty,
    expectedConcepts: request.expectedConcepts,
    answer: request.answer,
    sessionId: request.sessionId,
  })

  // Generate dynamic follow-up question in fallback
  let followUpQuestion = ''
  let conversationalTransition = 'Thank you for your answer. Let us examine this further.'

  const ansLower = request.answer.toLowerCase()
  if (ansLower.includes('state') || ansLower.includes('component')) {
    followUpQuestion =
      'How would you manage state persistence and optimize performance when state updates trigger deep child re-renders?'
    conversationalTransition =
      'Good explanation of state mechanics. Now let us explore optimization.'
  } else if (ansLower.includes('database') || ansLower.includes('sql') || ansLower.includes('query')) {
    followUpQuestion =
      'What indexing strategy or query optimization technique would you employ if this query experienced high latency in production?'
    conversationalTransition =
      'You covered the database operations well. Let us examine latency and indexing.'
  } else if (ansLower.includes('api') || ansLower.includes('http')) {
    followUpQuestion =
      'How would you guarantee idempotency and handle network timeouts between distributed services?'
    conversationalTransition =
      'Clear API summary. Let us consider resilience and error handling.'
  } else if (request.answer.trim().split(/\s+/).length < 25) {
    followUpQuestion =
      'Could you elaborate on a practical project or code scenario where you applied this approach?'
    conversationalTransition =
      'Thank you. Let us walk through a real-world scenario.'
  } else {
    followUpQuestion =
      'What are the primary operational trade-offs of this solution compared to alternatives?'
    conversationalTransition =
      'Solid analysis. Let us evaluate the trade-offs in depth.'
  }

  fallback.followUpQuestion = followUpQuestion
  fallback.conversationalTransition = conversationalTransition
  fallback.isFollowUp = Boolean(request.isFollowUp)
  fallback.parentQuestionId = request.parentQuestionId

  return {
    success: true,
    evaluation: fallback,
    followUpQuestion,
    conversationalTransition,
    source: 'fallback',
  }
}

