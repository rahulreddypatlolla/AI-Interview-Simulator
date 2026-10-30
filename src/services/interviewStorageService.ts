import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  AnswerEvaluation,
  InterviewQuestion,
  InterviewConfig,
} from '../types'

// ==========================================
// SUPABASE INTERVIEW STORAGE SERVICE
// ==========================================
//
// Handles database operations for:
//   1. Profiles (public.profiles)
//   2. Sessions (public.interview_sessions)
//   3. Questions & Answers (public.session_questions)
//   4. Evaluation Results (public.interview_evaluations)
//   5. Skill Progress (public.user_progress)
//
// Complies with Row Level Security (RLS) so users
// only ever access their own authenticated records.
// ==========================================

export interface StoredSessionResult {
  id: string
  sessionId: string
  userId?: string
  role: string
  type: string
  difficulty: string
  voice: string
  source: string
  focusAreas: string[]
  totalQuestions: number
  answeredQuestions: number
  reviewedQuestions: number
  averageScore: number
  completed: boolean
  completedAt?: string
  createdAt: string
  evaluations?: AnswerEvaluation[]
  answers?: string[]
  fullscreenExitCount?: number
  screenSharingStatus?: string
  submissionReason?: string
  status?: string
}

export interface UserProgressRecord {
  category: string
  score: number
  sessionsCount: number
  lastPracticedAt: string
}

export interface UserProfileRecord {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  targetRole?: string
  experienceLevel?: string
}

/**
 * Creates or updates a user profile record in public.profiles.
 */
export async function syncUserProfile(
  userId: string,
  email: string,
  fullName: string,
  targetRole = 'Full Stack Developer',
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        target_role: targetRole,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    if (error) {
      console.warn('[Supabase Profiles Sync Error]:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[Supabase Profiles Sync Exception]:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Saves a completed or in-progress interview session and its child records:
 *   - interview_sessions
 *   - session_questions
 *   - interview_evaluations
 *   - user_progress (aggregating skill scores)
 */
export async function saveSessionToSupabase(params: {
  sessionId: string
  userId: string
  config: Partial<InterviewConfig> & { voice?: string; source?: string }
  questions: InterviewQuestion[]
  answers: string[]
  evaluations: AnswerEvaluation[]
  reviewed: boolean[]
  completed: boolean
  averageScore: number
  fullscreenExitCount?: number
  screenSharingStatus?: string
  submissionReason?: string
  status?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  const {
    sessionId,
    userId,
    config,
    questions,
    answers,
    evaluations,
    reviewed,
    completed,
    averageScore,
    fullscreenExitCount = 0,
    screenSharingStatus = 'active',
    submissionReason = 'Normal submission',
    status = completed ? 'Completed' : 'In progress',
  } = params

  try {
    const completedAt = completed ? new Date().toISOString() : null
    const answeredCount = answers.filter((a) => a && a.trim().length > 0).length
    const reviewedCount = reviewed.filter(Boolean).length

    // 1. Insert or update session record with proctoring fields
    const sessionPayload: Record<string, unknown> = {
      id: sessionId,
      user_id: userId,
      role: config.role || 'Full Stack Developer',
      type: config.type || 'Technical',
      difficulty: config.difficulty || 'Medium',
      voice: config.voice || 'female',
      source: config.source || 'profile',
      focus_areas: config.gaps || [],
      total_questions: questions.length,
      answered_questions: answeredCount,
      reviewed_questions: reviewedCount,
      average_score: averageScore,
      completed,
      completed_at: completedAt,
      fullscreen_exits: fullscreenExitCount,
      screen_sharing_status: screenSharingStatus,
      submission_reason: submissionReason,
      interview_status: status,
    }

    let { error: sessionError } = await supabase
      .from('interview_sessions')
      .upsert(sessionPayload, { onConflict: 'id' })

    // Fallback if proctoring columns are not yet applied to the database schema
    if (sessionError && sessionError.message?.toLowerCase().includes('column')) {
      const {
        fullscreen_exits,
        screen_sharing_status,
        submission_reason,
        interview_status,
        ...basePayload
      } = sessionPayload

      const retryResult = await supabase
        .from('interview_sessions')
        .upsert(basePayload, { onConflict: 'id' })

      sessionError = retryResult.error
    }

    if (sessionError) {
      console.warn('[Supabase Session Error]:', sessionError.message)
      return { success: false, error: sessionError.message }
    }

    // 2. Insert session questions and candidate answers
    if (questions.length > 0) {
      const questionRows = questions.map((q, idx) => ({
        session_id: sessionId,
        user_id: userId,
        question_id: q.id,
        question_order: idx + 1,
        category: q.category,
        prompt: q.prompt,
        hint: q.hint || '',
        expected_concepts: q.expectedConcepts || [],
        user_answer: answers[idx] || '',
        reviewed: Boolean(reviewed[idx]),
      }))

      const { error: questionsError } = await supabase
        .from('session_questions')
        .insert(questionRows)

      if (questionsError) {
        console.warn('[Supabase Session Questions Error]:', questionsError.message)
      }
    }

    // 3. Insert evaluations
    if (evaluations.length > 0) {
      const evaluationRows = evaluations.map((ev) => ({
        session_id: sessionId,
        user_id: userId,
        question_id: ev.questionId,
        question_category: ev.category,
        question_prompt: ev.question,
        user_answer: ev.answer || '',
        score: ev.score,
        technical_score: ev.technicalCorrectness?.score ?? ev.score,
        technical_feedback: ev.technicalCorrectness?.feedback ?? '',
        communication_score: ev.communication?.score ?? ev.score,
        communication_feedback: ev.communication?.feedback ?? '',
        problem_solving_score: ev.problemSolving?.score ?? ev.score,
        problem_solving_feedback: ev.problemSolving?.feedback ?? '',
        strengths: ev.strengths || [],
        weaknesses: ev.weaknesses || [],
        improvements: ev.improvements || [],
        ideal_answer_outline: ev.idealAnswerOutline || [],
        evaluated_by: ev.evaluatedBy || 'fallback',
        created_at: ev.evaluatedAt || new Date().toISOString(),
      }))

      const { error: evalError } = await supabase
        .from('interview_evaluations')
        .insert(evaluationRows)

      if (evalError) {
        console.warn('[Supabase Evaluations Error]:', evalError.message)
      }
    }

    // 4. Update aggregated user progress for skills / categories practiced
    if (completed && evaluations.length > 0) {
      const categoryScores: Record<string, number[]> = {}
      for (const ev of evaluations) {
        if (!ev.answer || !ev.answer.trim()) continue
        const cat = ev.category || 'General'
        if (!categoryScores[cat]) categoryScores[cat] = []
        categoryScores[cat].push(ev.score)
      }

      for (const [category, scores] of Object.entries(categoryScores)) {
        const sessionCatAvg = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length,
        )

        // Fetch existing progress record if any
        const { data: existingProgress } = await supabase
          .from('user_progress')
          .select('score, sessions_count')
          .eq('user_id', userId)
          .eq('category', category)
          .maybeSingle()

        if (existingProgress) {
          const newCount = existingProgress.sessions_count + 1
          const updatedScore = Math.round(
            (existingProgress.score * existingProgress.sessions_count +
              sessionCatAvg) /
              newCount,
          )

          await supabase
            .from('user_progress')
            .update({
              score: updatedScore,
              sessions_count: newCount,
              last_practiced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('category', category)
        } else {
          await supabase.from('user_progress').insert({
            user_id: userId,
            category,
            score: sessionCatAvg,
            sessions_count: 1,
            last_practiced_at: new Date().toISOString(),
          })
        }
      }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[Supabase Session Save Exception]:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Fetches all completed sessions for an authenticated user.
 */
export async function fetchUserSessions(
  userId: string,
): Promise<{ sessions: StoredSessionResult[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { sessions: [], error: 'Supabase is not configured.' }
  }

  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error) {
      console.warn('[Supabase Fetch Sessions Error]:', error.message)
      return { sessions: [], error: error.message }
    }

    const formatted: StoredSessionResult[] = (data || []).map((row: any) => ({
      id: row.id,
      sessionId: row.id,
      userId: row.user_id,
      role: row.role,
      type: row.type,
      difficulty: row.difficulty,
      voice: row.voice,
      source: row.source,
      focusAreas: row.focus_areas || [],
      totalQuestions: row.total_questions,
      answeredQuestions: row.answered_questions,
      reviewedQuestions: row.reviewed_questions,
      averageScore: row.average_score,
      completed: row.completed,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    }))

    return { sessions: formatted }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[Supabase Fetch Sessions Exception]:', msg)
    return { sessions: [], error: msg }
  }
}

/**
 * Fetches full session details including evaluations for the report page.
 */
export async function fetchSessionDetail(
  sessionId: string,
  userId: string,
): Promise<{
  session: StoredSessionResult | null
  evaluations: AnswerEvaluation[]
  questions?: InterviewQuestion[]
  answers?: string[]
  error?: string
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, evaluations: [], error: 'Supabase is not configured.' }
  }

  try {
    // 1. Fetch session
    const { data: sessionData, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (sessionError || !sessionData) {
      return {
        session: null,
        evaluations: [],
        error: sessionError?.message || 'Session not found.',
      }
    }

    // 2. Fetch session questions and answers
    const { data: questionsData } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('question_order', { ascending: true })

    const reconstructedQuestions: InterviewQuestion[] = (questionsData || []).map((q: any) => ({
      id: q.question_id,
      prompt: q.prompt,
      category: q.category,
      type: (sessionData.type || 'Technical') as any,
      difficulty: (sessionData.difficulty || 'Medium') as any,
      role: sessionData.role,
      hint: q.hint || undefined,
      expectedConcepts: Array.isArray(q.expected_concepts) ? q.expected_concepts : [],
    }))

    const answers: string[] = (questionsData || []).map((q: any) => q.user_answer || '')

    // 3. Fetch evaluations
    const { data: evalData, error: evalError } = await supabase
      .from('interview_evaluations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    const evaluations: AnswerEvaluation[] = (evalData || []).map((row: any) => ({
      questionId: row.question_id,
      category: row.question_category,
      question: row.question_prompt,
      answer: row.user_answer,
      score: row.score,
      technicalCorrectness: {
        score: row.technical_score,
        feedback: row.technical_feedback,
      },
      communication: {
        score: row.communication_score,
        feedback: row.communication_feedback,
      },
      problemSolving: {
        score: row.problem_solving_score,
        feedback: row.problem_solving_feedback,
      },
      strengths: row.strengths || [],
      weaknesses: row.weaknesses || [],
      improvements: row.improvements || [],
      idealAnswerOutline: row.ideal_answer_outline || [],
      evaluatedBy: row.evaluated_by || 'fallback',
      evaluatedAt: row.created_at,
      words: row.user_answer ? row.user_answer.trim().split(/\s+/).length : 0,
    }))

    const session: StoredSessionResult = {
      id: sessionData.id,
      sessionId: sessionData.id,
      userId: sessionData.user_id,
      role: sessionData.role,
      type: sessionData.type,
      difficulty: sessionData.difficulty,
      voice: sessionData.voice,
      source: sessionData.source,
      focusAreas: sessionData.focus_areas || [],
      totalQuestions: sessionData.total_questions,
      answeredQuestions: sessionData.answered_questions,
      reviewedQuestions: sessionData.reviewed_questions,
      averageScore: sessionData.average_score,
      completed: sessionData.completed,
      completedAt: sessionData.completed_at,
      createdAt: sessionData.created_at,
      evaluations,
      answers,
    }

    return {
      session,
      evaluations,
      questions: reconstructedQuestions,
      answers,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { session: null, evaluations: [], error: msg }
  }
}

/**
 * Fetches user skill progress from public.user_progress.
 */
export async function fetchUserProgress(
  userId: string,
): Promise<{ progress: UserProgressRecord[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { progress: [], error: 'Supabase is not configured.' }
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('category, score, sessions_count, last_practiced_at')
      .eq('user_id', userId)
      .order('score', { ascending: false })

    if (error) {
      console.warn('[Supabase Fetch Progress Error]:', error.message)
      return { progress: [], error: error.message }
    }

    const progress: UserProgressRecord[] = (data || []).map((row: any) => ({
      category: row.category,
      score: row.score,
      sessionsCount: row.sessions_count,
      lastPracticedAt: row.last_practiced_at,
    }))

    return { progress }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { progress: [], error: msg }
  }
}

export interface EvaluationAspectMetrics {
  technicalAverage: number
  communicationAverage: number
  problemSolvingAverage: number
  totalEvaluations: number
}

/**
 * Fetches user evaluation aspect averages (technical, communication, problem-solving)
 * directly from public.interview_evaluations.
 */
export async function fetchUserEvaluationMetrics(
  userId: string,
): Promise<{
  metrics: EvaluationAspectMetrics
  error?: string
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      metrics: {
        technicalAverage: 0,
        communicationAverage: 0,
        problemSolvingAverage: 0,
        totalEvaluations: 0,
      },
      error: 'Supabase is not configured.',
    }
  }

  try {
    const { data, error } = await supabase
      .from('interview_evaluations')
      .select('technical_score, communication_score, problem_solving_score')
      .eq('user_id', userId)

    if (error) {
      return {
        metrics: {
          technicalAverage: 0,
          communicationAverage: 0,
          problemSolvingAverage: 0,
          totalEvaluations: 0,
        },
        error: error.message,
      }
    }

    if (!data || data.length === 0) {
      return {
        metrics: {
          technicalAverage: 0,
          communicationAverage: 0,
          problemSolvingAverage: 0,
          totalEvaluations: 0,
        },
      }
    }

    const totalEvaluations = data.length
    const techSum = data.reduce(
      (acc: number, row: any) => acc + (row.technical_score ?? 0),
      0,
    )
    const commSum = data.reduce(
      (acc: number, row: any) => acc + (row.communication_score ?? 0),
      0,
    )
    const probSum = data.reduce(
      (acc: number, row: any) => acc + (row.problem_solving_score ?? 0),
      0,
    )

    return {
      metrics: {
        technicalAverage: Math.round(techSum / totalEvaluations),
        communicationAverage: Math.round(commSum / totalEvaluations),
        problemSolvingAverage: Math.round(probSum / totalEvaluations),
        totalEvaluations,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      metrics: {
        technicalAverage: 0,
        communicationAverage: 0,
        problemSolvingAverage: 0,
        totalEvaluations: 0,
      },
      error: msg,
    }
  }
}

export interface MentorMessageRecord {
  id: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

/**
 * Fetches mentor conversation messages for an authenticated user.
 */
export async function fetchMentorMessages(
  userId: string,
): Promise<{ messages: MentorMessageRecord[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { messages: [], error: 'Supabase is not configured.' }
  }

  try {
    const { data, error } = await supabase
      .from('mentor_messages')
      .select('id, user_id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('[Supabase Fetch Mentor Messages Error]:', error.message)
      return { messages: [], error: error.message }
    }

    const messages: MentorMessageRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }))

    return { messages }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { messages: [], error: msg }
  }
}

/**
 * Saves a single mentor message to public.mentor_messages.
 */
export async function saveMentorMessage(params: {
  userId: string
  role: 'user' | 'assistant'
  content: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  try {
    const { data, error } = await supabase
      .from('mentor_messages')
      .insert({
        user_id: params.userId,
        role: params.role,
        content: params.content,
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[Supabase Save Mentor Message Error]:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

/**
 * Clears mentor conversation history for an authenticated user.
 */
export async function clearMentorMessages(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  try {
    const { error } = await supabase
      .from('mentor_messages')
      .delete()
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

