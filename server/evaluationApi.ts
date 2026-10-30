import type {
  AnswerEvaluation,
  EvaluationRequest,
  EvaluationResponse,
} from '../src/types'
import { evaluateAnswerFallback } from '../src/engine/fallbackEvaluator'

// Ambient declarations for Node.js runtime environments
declare const process: {
  env: Record<string, string | undefined>
}

export interface ServerRequest {
  method?: string
  on(event: 'data', listener: (chunk: any) => void): any
  on(event: 'end', listener: () => void): any
}

export interface ServerResponse {
  statusCode?: number
  setHeader(name: string, value: string): void
  end(chunk?: string): void
}

// ==========================================
// SECURE SERVER-SIDE AI EVALUATION API
// ==========================================
//
// This module runs strictly on the Node.js server.
// AI provider API keys (GEMINI_API_KEY, OPENAI_API_KEY)
// are read from server environment variables and are NEVER
// bundled into or exposed to client-side code.
// ==========================================

/**
 * Validates the raw JSON output from the AI provider to ensure
 * data integrity before saving or returning.
 */
export function validateAIResponse(
  raw: unknown,
  request: EvaluationRequest,
): { valid: boolean; evaluation?: AnswerEvaluation; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'AI response is not a valid JSON object.' }
  }

  const obj = raw as Record<string, any>

  // 1. Validate score
  const score = Number(obj.score)
  if (isNaN(score) || score < 0 || score > 100) {
    return {
      valid: false,
      error: `Invalid overall score: ${obj.score}. Expected a number between 0 and 100.`,
    }
  }

  // 2. Validate technicalCorrectness
  if (
    !obj.technicalCorrectness ||
    typeof obj.technicalCorrectness !== 'object' ||
    typeof obj.technicalCorrectness.feedback !== 'string' ||
    !obj.technicalCorrectness.feedback.trim()
  ) {
    return {
      valid: false,
      error: 'Missing or invalid technicalCorrectness feedback.',
    }
  }
  const techScore = Number(obj.technicalCorrectness.score)
  if (isNaN(techScore) || techScore < 0 || techScore > 100) {
    return {
      valid: false,
      error: 'Invalid technicalCorrectness score.',
    }
  }

  // 3. Validate communication
  if (
    !obj.communication ||
    typeof obj.communication !== 'object' ||
    typeof obj.communication.feedback !== 'string' ||
    !obj.communication.feedback.trim()
  ) {
    return {
      valid: false,
      error: 'Missing or invalid communication feedback.',
    }
  }
  const commScore = Number(obj.communication.score)
  if (isNaN(commScore) || commScore < 0 || commScore > 100) {
    return {
      valid: false,
      error: 'Invalid communication score.',
    }
  }

  // 4. Validate problemSolving
  if (
    !obj.problemSolving ||
    typeof obj.problemSolving !== 'object' ||
    typeof obj.problemSolving.feedback !== 'string' ||
    !obj.problemSolving.feedback.trim()
  ) {
    return {
      valid: false,
      error: 'Missing or invalid problemSolving feedback.',
    }
  }
  const psScore = Number(obj.problemSolving.score)
  if (isNaN(psScore) || psScore < 0 || psScore > 100) {
    return {
      valid: false,
      error: 'Invalid problemSolving score.',
    }
  }

  // 5. Validate strengths (must be non-empty array of strings)
  const strengths = Array.isArray(obj.strengths)
    ? obj.strengths.filter((s: unknown) => typeof s === 'string' && s.trim())
    : []
  if (strengths.length === 0) {
    return {
      valid: false,
      error: 'Strengths must be a non-empty array of strings.',
    }
  }

  // 6. Validate weaknesses (array of strings)
  const weaknesses = Array.isArray(obj.weaknesses)
    ? obj.weaknesses.filter((w: unknown) => typeof w === 'string' && w.trim())
    : []

  // 7. Validate improvements (must be non-empty array of strings)
  const improvements = Array.isArray(obj.improvements)
    ? obj.improvements.filter((i: unknown) => typeof i === 'string' && i.trim())
    : []
  if (improvements.length === 0) {
    return {
      valid: false,
      error: 'Improvements must be a non-empty array of strings.',
    }
  }

  // 8. Validate idealAnswerOutline
  let idealAnswerOutline: string[] = []
  if (Array.isArray(obj.idealAnswerOutline)) {
    idealAnswerOutline = obj.idealAnswerOutline.filter(
      (o: unknown) => typeof o === 'string' && o.trim(),
    )
  } else if (typeof obj.idealAnswerOutline === 'string' && obj.idealAnswerOutline.trim()) {
    idealAnswerOutline = obj.idealAnswerOutline
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }

  if (idealAnswerOutline.length === 0) {
    return {
      valid: false,
      error: 'idealAnswerOutline must be provided as a structured outline.',
    }
  }

  const words = request.answer.trim()
    ? request.answer.trim().split(/\s+/).length
    : 0

  const evaluation: AnswerEvaluation = {
    questionId: request.questionId,
    category: request.category,
    question: request.question,
    answer: request.answer,
    score: Math.round(score),
    technicalCorrectness: {
      score: Math.round(techScore),
      feedback: obj.technicalCorrectness.feedback.trim(),
    },
    communication: {
      score: Math.round(commScore),
      feedback: obj.communication.feedback.trim(),
    },
    problemSolving: {
      score: Math.round(psScore),
      feedback: obj.problemSolving.feedback.trim(),
    },
    strengths,
    weaknesses,
    improvements,
    idealAnswerOutline,
    evaluatedBy: 'ai',
    evaluatedAt: new Date().toISOString(),
    words,
  }

  return { valid: true, evaluation }
}

/**
 * Calls Google Gemini API securely using the server-side GEMINI_API_KEY.
 */
async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as any
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('Gemini API returned empty candidate response.')
  }

  return JSON.parse(text)
}

/**
 * Calls OpenAI API securely using the server-side OPENAI_API_KEY.
 */
async function callOpenAI(
  prompt: string,
  apiKey: string,
): Promise<unknown> {
  const url = 'https://api.openai.com/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert technical interviewer and hiring manager. Evaluate candidate answers thoroughly and objectively in JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as any
  const text = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('OpenAI API returned empty completion content.')
  }

  return JSON.parse(text)
}

/**
 * Attempts to persist the evaluation into Supabase from the server side.
 */
async function storeEvaluationInSupabaseServer(
  evaluation: AnswerEvaluation,
  sessionId?: string,
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return

  try {
    const insertPayload = {
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

    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/interview_evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(insertPayload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn('[Server Supabase] Could not insert evaluation:', err)
    }
  } catch (err) {
    console.warn('[Server Supabase] Storage exception:', err)
  }
}

/**
 * Main evaluation handler used by the server-side API.
 */
export async function handleEvaluation(
  request: EvaluationRequest,
): Promise<EvaluationResponse> {
  // If answer is blank, return immediate zero evaluation via fallback
  if (!request.answer || !request.answer.trim()) {
    const fallback = evaluateAnswerFallback(request)
    return {
      success: true,
      evaluation: fallback,
      source: 'fallback',
      warning: 'No answer was provided.',
    }
  }

  // Read AI keys exclusively from server environment
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  // Construct structured evaluation prompt
  const prompt = `
You are an expert technical interviewer evaluating a candidate for the role of ${request.role} (${request.difficulty} difficulty).

QUESTION:
"${request.question}"

CATEGORY:
${request.category}

EXPECTED CONCEPTS CANDIDATE SHOULD ADDRESS:
${(request.expectedConcepts || []).join(', ') || 'Core domain principles'}

CANDIDATE'S ANSWER:
"${request.answer}"

Evaluate the candidate's answer thoroughly and provide actionable feedback in the following exact JSON format:
{
  "score": <integer from 0 to 100 representing overall quality>,
  "technicalCorrectness": {
    "score": <integer from 0 to 100>,
    "feedback": "<concise, specific critique of technical correctness, concept coverage, and accuracy>"
  },
  "communication": {
    "score": <integer from 0 to 100>,
    "feedback": "<critique of answer structure, clarity, signposting, and conciseness>"
  },
  "problemSolving": {
    "score": <integer from 0 to 100>,
    "feedback": "<critique of problem-solving approach, reasoning depth, trade-off analysis, and consideration of edge cases>"
  },
  "strengths": [
    "<specific positive aspect 1>",
    "<specific positive aspect 2>"
  ],
  "weaknesses": [
    "<specific area where the answer was weak or missed critical points>"
  ],
  "improvements": [
    "<actionable suggestion 1 to elevate this answer to staff/principal level>",
    "<actionable suggestion 2>"
  ],
  "idealAnswerOutline": [
    "<Key Point 1 of an ideal response>",
    "<Key Point 2 of an ideal response>",
    "<Key Point 3 of an ideal response>",
    "<Key Point 4 of an ideal response>"
  ]
}
`.trim()

  // Try AI providers in order of configuration
  if (geminiKey || openAiKey) {
    try {
      let rawAIResponse: unknown

      if (geminiKey) {
        rawAIResponse = await callGemini(prompt, geminiKey)
      } else if (openAiKey) {
        rawAIResponse = await callOpenAI(prompt, openAiKey)
      }

      // Validate AI response strictly before saving
      const validation = validateAIResponse(rawAIResponse, request)

      if (validation.valid && validation.evaluation) {
        // Attempt to store in Supabase
        await storeEvaluationInSupabaseServer(
          validation.evaluation,
          request.sessionId,
        )

        return {
          success: true,
          evaluation: validation.evaluation,
          source: 'ai',
        }
      } else {
        console.warn(
          '[AI Evaluation Validation Failed]:',
          validation.error,
          'Falling back to structured local evaluator.',
        )
      }
    } catch (aiError) {
      console.warn(
        '[AI Evaluation Service Error]:',
        aiError instanceof Error ? aiError.message : aiError,
        'Falling back to structured local evaluator.',
      )
    }
  }

  // Graceful fallback when AI service is unconfigured or fails
  const fallbackEvaluation = evaluateAnswerFallback(request)

  // Attempt to store fallback evaluation in Supabase
  await storeEvaluationInSupabaseServer(fallbackEvaluation, request.sessionId)

  return {
    success: true,
    evaluation: fallbackEvaluation,
    source: 'fallback',
    warning:
      'Evaluated using offline fallback evaluator. Connect an AI provider API key on the server for live AI evaluation.',
  }
}

/**
 * Middleware function for HTTP servers (Vite, Express, or Node http).
 */
export function evaluationMiddleware(
  req: any,
  res: any,
): void {
  // Only handle POST requests to /api/evaluate
  if (req.method === 'POST') {
    let body = ''
    req.on('data', (chunk: any) => {
      body += chunk
    })

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body) as EvaluationRequest
        const result = await handleEvaluation(payload)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify(result))
      } catch (err) {
        console.error('[API Evaluate Error]:', err)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 400
        res.end(
          JSON.stringify({
            success: false,
            error: 'Invalid request body or internal error.',
          }),
        )
      }
    })
  } else if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(
      JSON.stringify({
        status: 'ok',
        endpoint: '/api/evaluate',
        hasAiKey: Boolean(
          process.env.GEMINI_API_KEY ||
            process.env.AI_API_KEY ||
            process.env.OPENAI_API_KEY,
        ),
      }),
    )
  } else {
    res.statusCode = 405
    res.end('Method Not Allowed')
  }
}
