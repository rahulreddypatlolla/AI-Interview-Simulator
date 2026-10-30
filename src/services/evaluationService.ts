import type {
  AnswerEvaluation,
  EvaluationRequest,
  EvaluationResponse,
} from '../types'
import { evaluateAnswerFallback } from '../engine/fallbackEvaluator'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ==========================================
// CLIENT EVALUATION SERVICE
// ==========================================
//
// Communicates with the secure server-side API (/api/evaluate).
// AI keys are NEVER handled on the frontend.
// Automatically provides graceful fallback when offline or
// when the server API is unavailable.
// ==========================================

/**
 * Evaluates an interview answer using the secure server-side AI API,
 * falling back gracefully to the offline structured evaluator if the API
 * is unavailable or fails.
 */
export async function evaluateAnswer(
  request: EvaluationRequest,
): Promise<AnswerEvaluation> {
  // If the answer is completely blank, evaluate immediately via fallback
  if (!request.answer || !request.answer.trim()) {
    return evaluateAnswerFallback(request)
  }

  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (res.ok) {
      const data = (await res.json()) as EvaluationResponse
      if (data && data.success && data.evaluation) {
        return data.evaluation
      }
    }

    console.warn(
      '[EvaluationService] Server returned non-ok response, using fallback evaluator.',
    )
  } catch (err) {
    console.warn(
      '[EvaluationService] Server evaluation unreachable or offline, using fallback evaluator.',
      err,
    )
  }

  // Fallback evaluator when API is unreachable or returns error
  return evaluateAnswerFallback(request)
}

/**
 * Stores an evaluation record into Supabase.
 * Handles missing credentials or unmigrated tables gracefully.
 */
export async function storeEvaluationInSupabase(
  evaluation: AnswerEvaluation,
  sessionId?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: 'Supabase is not configured (demo mode active).',
    }
  }

  try {
    const payload = {
      session_id: sessionId || 'default-session',
      question_id: evaluation.questionId,
      question_category: evaluation.category,
      question_prompt: evaluation.question,
      user_answer: evaluation.answer,
      score: evaluation.score,
      technical_score: evaluation.technicalCorrectness.score,
      technical_feedback: evaluation.technicalCorrectness.feedback,
      communication_score: evaluation.communication.score,
      communication_feedback: evaluation.communication.feedback,
      problem_solving_score: evaluation.problemSolving.score,
      problem_solving_feedback: evaluation.problemSolving.feedback,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      improvements: evaluation.improvements,
      ideal_answer_outline: evaluation.idealAnswerOutline,
      evaluated_by: evaluation.evaluatedBy,
      created_at: evaluation.evaluatedAt || new Date().toISOString(),
    }

    const { error } = await supabase
      .from('interview_evaluations')
      .insert(payload)

    if (error) {
      console.warn('[Supabase Evaluation Insert]:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[Supabase Evaluation Exception]:', message)
    return { success: false, error: message }
  }
}

