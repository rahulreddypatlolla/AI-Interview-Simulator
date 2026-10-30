/**
 * CareerVerse AI Interview Simulator - Voice Interview & Dynamic Follow-up Server API
 *
 * Runs strictly server-side in Node.js (via Vite middleware or Express).
 * Reads server environment keys (GEMINI_API_KEY, OPENAI_API_KEY) securely.
 *
 * Responsibilities:
 * 1. Evaluates candidate answer across:
 *    - Relevance & Completeness
 *    - Technical Correctness
 *    - Communication & Answer Structure
 *    - Problem-Solving Ability & Trade-offs
 * 2. Generates dynamic context-aware follow-up questions based on candidate's actual responses.
 * 3. Provides natural conversational transitions for spoken avatar delivery.
 * 4. Implements structured fallback evaluation when AI providers are unavailable or offline.
 */

import type {
  AnswerEvaluation,
  EvaluationRequest,
  EvaluationResponse,
} from '../src/types'
import { validateAIResponse } from './evaluationApi'

declare const process: {
  env: Record<string, string | undefined>
}

export interface VoiceEvaluationRequest extends EvaluationRequest {
  previousQuestions?: string[]
  previousAnswers?: string[]
  gaps?: string[]
  type?: string
  isFollowUp?: boolean
  parentQuestionId?: string
}

export interface VoiceEvaluationResult {
  evaluation: AnswerEvaluation
  followUpQuestion?: string
  followUpReasoning?: string
  conversationalTransition?: string
  source: 'ai' | 'fallback'
}

/**
 * Builds the comprehensive prompt for AI to evaluate and generate dynamic follow-up questions.
 */
function buildVoiceEvaluationPrompt(req: VoiceEvaluationRequest): string {
  const previousContext =
    req.previousQuestions && req.previousQuestions.length > 0
      ? req.previousQuestions
          .map((q, idx) => `Q${idx + 1}: ${q}\nA${idx + 1}: ${req.previousAnswers?.[idx] || 'N/A'}`)
          .join('\n\n')
      : 'None (First question in session)'

  return `
You are CareerVerse AI, an expert technical interviewer conducting a mock interview for the role of ${req.role}.

INTERVIEW CONTEXT:
- Role: ${req.role}
- Interview Type: ${req.type || 'Technical'}
- Difficulty Level: ${req.difficulty}
- Focus Skills: ${req.gaps?.join(', ') || 'General Technical Skills'}
- Is this a Follow-up Question?: ${req.isFollowUp ? 'YES' : 'NO (Main Question)'}

PREVIOUS INTERVIEW CONVERSATION HISTORY:
${previousContext}

CURRENT QUESTION:
"${req.question}"

EXPECTED CORE CONCEPTS / CRITERIA:
${req.expectedConcepts && req.expectedConcepts.length > 0 ? req.expectedConcepts.map((c) => `• ${c}`).join('\n') : '• Core architectural and conceptual depth'}

CANDIDATE'S SPOKEN SUBMITTED ANSWER:
"${req.answer}"

YOUR OBJECTIVE:
1. Thoroughly evaluate the candidate's answer across:
   - Relevance & Completeness
   - Technical Correctness
   - Clarity & Communication Structure
   - Problem-Solving & Real-World Trade-offs
2. Generate a score from 0 to 100 reflecting standard industry technical interview bars.
3. Formulate a natural, dynamic FOLLOW-UP QUESTION based directly on what the candidate actually said:
   - If the candidate's answer is strong: Ask a deeper, advanced question exploring edge cases, performance trade-offs, or scalability.
   - If the candidate's answer is incomplete: Ask a targeted clarifying question about the missing aspect.
   - If the candidate's answer has misconceptions: Guide them with a conceptual clarification.
   - If the candidate's answer is off-topic: Politely redirect them to the core principle.
4. Provide a natural spoken "conversationalTransition" (e.g. "That's an interesting point you raised regarding...", "Building on your thought about...", "Good. Let's explore how...").

OUTPUT FORMAT:
Respond with ONLY valid JSON without markdown fences, conforming to this exact structure:
{
  "score": <0-100 integer>,
  "technicalCorrectness": {
    "score": <0-100 integer>,
    "feedback": "<Specific feedback detailing what was technically accurate and any inaccuracies>"
  },
  "communication": {
    "score": <0-100 integer>,
    "feedback": "<Specific feedback on clarity, structure, and conciseness>"
  },
  "problemSolving": {
    "score": <0-100 integer>,
    "feedback": "<Specific feedback on trade-offs, practical application, and reasoning>"
  },
  "strengths": [
    "<Highlight 1 specific strength from candidate's answer>",
    "<Highlight 2 specific strength>"
  ],
  "weaknesses": [
    "<Identify 1 specific area of weakness or missing detail>",
    "<Identify 2>"
  ],
  "improvements": [
    "<Actionable suggestion 1 to elevate answer>",
    "<Actionable suggestion 2>"
  ],
  "idealAnswerOutline": [
    "<Step 1 of ideal answer>",
    "<Step 2 of ideal answer>",
    "<Step 3 of ideal answer>"
  ],
  "followUpQuestion": "<Dynamic follow-up question related to candidate's answer>",
  "followUpReasoning": "<1 sentence explaining why this follow-up is relevant>",
  "conversationalTransition": "<Natural spoken lead-in phrase to introduce the follow-up question smoothly>"
}
`.trim()
}

/**
 * Intelligent contextual fallback evaluation with dynamic follow-up generation.
 */
export function generateVoiceInterviewFallback(
  req: VoiceEvaluationRequest,
): VoiceEvaluationResult {
  const answer = req.answer.trim().toLowerCase()
  const expected = req.expectedConcepts || []

  // Check expected concepts matched
  const matchedConcepts = expected.filter((c) =>
    answer.includes(c.toLowerCase()),
  )
  const missedConcepts = expected.filter(
    (c) => !answer.includes(c.toLowerCase()),
  )

  const wordCount = req.answer.trim() ? req.answer.trim().split(/\s+/).length : 0

  let baseScore = 50
  if (expected.length > 0) {
    baseScore = Math.round((matchedConcepts.length / expected.length) * 45) + 35
  }
  if (wordCount >= 30) baseScore += 10
  if (wordCount >= 60) baseScore += 5
  if (wordCount < 15) baseScore = Math.min(baseScore, 42)

  const score = Math.max(25, Math.min(95, baseScore))
  const techScore = Math.max(20, Math.min(98, score + (matchedConcepts.length > 0 ? 5 : -5)))
  const commScore = Math.max(25, Math.min(95, wordCount >= 35 ? score + 4 : score - 6))
  const psScore = Math.max(25, Math.min(92, score - 2))

  // Determine follow-up question dynamically based on candidate's response
  let followUpQuestion = ''
  let followUpReasoning = ''
  let conversationalTransition = ''

  if (score >= 75) {
    // Strong answer -> probe deeper into trade-offs and scaling
    if (answer.includes('state') || answer.includes('component')) {
      followUpQuestion =
        'How would you manage state persistence and avoid redundant re-renders when scaling this across deeply nested components?'
      conversationalTransition =
        'Great breakdown of state principles. Let us take this a step further.'
    } else if (answer.includes('database') || answer.includes('sql') || answer.includes('query')) {
      followUpQuestion =
        'Under high concurrency, what indexing strategies or connection pooling mechanisms would you implement to prevent database bottlenecks?'
      conversationalTransition =
        'Solid database overview. Now, considering production scale...'
    } else if (answer.includes('api') || answer.includes('http') || answer.includes('rest')) {
      followUpQuestion =
        'How would you design idempotency and handle partial network failures between distributed services in this architecture?'
      conversationalTransition =
        'You explained the API fundamentals well. Let us examine resilience under failure.'
    } else {
      followUpQuestion =
        'What are the primary performance trade-offs of this approach, and how would you monitor its latency in production?'
      conversationalTransition =
        'Strong answer. I would like to explore the trade-offs in more detail.'
    }
    followUpReasoning =
      'Candidate demonstrated solid understanding; probing advanced architecture and failure handling.'
  } else if (missedConcepts.length > 0) {
    // Incomplete answer -> clarify missed concept
    const targetMissed = missedConcepts[0]
    followUpQuestion = `Could you explain how ${targetMissed} fits into your overall solution and why it is important?`
    conversationalTransition =
      'Good initial response. Let us dive into one specific aspect you touched upon.'
    followUpReasoning = `Prompting candidate to elaborate on key concept: ${targetMissed}.`
  } else if (wordCount < 20) {
    // Short answer -> ask for practical example
    followUpQuestion =
      'Could you walk through a concrete example or code scenario where you applied this approach?'
    conversationalTransition =
      'Thank you for that summary. Let us ground this in a practical scenario.'
    followUpReasoning = 'Encouraging candidate to provide concrete practical details.'
  } else {
    // General technical follow-up
    followUpQuestion =
      'How would your design change if the system needed to handle a 10x surge in concurrent traffic?'
    conversationalTransition =
      'Understood. Now let us look at how this adapts under changing requirements.'
    followUpReasoning = 'Testing scalability considerations and design adaptability.'
  }

  const strengths: string[] = []
  if (matchedConcepts.length > 0) {
    strengths.push(`Addressed core concepts including: ${matchedConcepts.slice(0, 3).join(', ')}.`)
  } else {
    strengths.push('Demonstrated structured conversational effort and direct engagement with the question.')
  }
  if (wordCount >= 25) {
    strengths.push('Communicated with appropriate technical vocabulary and logical sentence structure.')
  }

  const weaknesses: string[] = []
  if (missedConcepts.length > 0) {
    weaknesses.push(`Could expand on key considerations: ${missedConcepts.slice(0, 3).join(', ')}.`)
  }
  if (wordCount < 30) {
    weaknesses.push('Answer could be enhanced with concrete trade-offs, real-world examples, or performance considerations.')
  }

  const improvements: string[] = [
    'Structure responses with the STAR method (Situation, Task, Action, Result) or Architecture -> Implementation -> Trade-offs.',
    'Mention specific tooling, metrics, or edge-case handling to elevate the response to senior engineering standards.',
  ]

  const evaluation: AnswerEvaluation = {
    questionId: req.questionId,
    category: req.category,
    question: req.question,
    answer: req.answer,
    score,
    technicalCorrectness: {
      score: techScore,
      feedback:
        matchedConcepts.length > 0
          ? `Solid technical foundation covering ${matchedConcepts.join(', ')}.`
          : 'Answer was conceptually related but would benefit from referencing core domain principles directly.',
    },
    communication: {
      score: commScore,
      feedback:
        wordCount >= 30
          ? 'Clear verbal communication and straightforward phrasing.'
          : 'Concise, but expanding with structured examples would strengthen impact.',
    },
    problemSolving: {
      score: psScore,
      feedback:
        'Demonstrated foundational reasoning. Mentioning quantifiable trade-offs will demonstrate senior depth.',
    },
    strengths,
    weaknesses,
    improvements,
    idealAnswerOutline: [
      `Define the core definition and context for ${req.category}.`,
      'Explain the underlying mechanism and architectural significance.',
      'Contrast trade-offs (e.g. memory vs CPU, consistency vs availability).',
      'Conclude with real-world failure modes and observability metrics.',
    ],
    evaluatedBy: 'fallback',
    evaluatedAt: new Date().toISOString(),
    words: wordCount,
    followUpQuestion,
    followUpReasoning,
    conversationalTransition,
    isFollowUp: Boolean(req.isFollowUp),
    parentQuestionId: req.parentQuestionId,
  }

  return {
    evaluation,
    followUpQuestion,
    followUpReasoning,
    conversationalTransition,
    source: 'fallback',
  }
}

/**
 * Executes server-side voice evaluation using configured AI keys (Gemini / OpenAI) with fallback.
 */
export async function handleVoiceEvaluation(
  req: VoiceEvaluationRequest,
): Promise<VoiceEvaluationResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  if (geminiKey || openAiKey) {
    try {
      const prompt = buildVoiceEvaluationPrompt(req)
      let rawText = ''

      if (geminiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        })

        if (res.ok) {
          const data = (await res.json()) as any
          rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
      } else if (openAiKey) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        })

        if (res.ok) {
          const data = (await res.json()) as any
          rawText = data?.choices?.[0]?.message?.content || ''
        }
      }

      if (rawText) {
        const parsed = JSON.parse(rawText)
        const validation = validateAIResponse(parsed, req)

        if (validation.valid && validation.evaluation) {
          const evalResult = validation.evaluation
          evalResult.followUpQuestion = parsed.followUpQuestion || ''
          evalResult.followUpReasoning = parsed.followUpReasoning || ''
          evalResult.conversationalTransition = parsed.conversationalTransition || ''
          evalResult.isFollowUp = Boolean(req.isFollowUp)
          evalResult.parentQuestionId = req.parentQuestionId

          return {
            evaluation: evalResult,
            followUpQuestion: parsed.followUpQuestion,
            followUpReasoning: parsed.followUpReasoning,
            conversationalTransition: parsed.conversationalTransition,
            source: 'ai',
          }
        }
      }
    } catch (err) {
      console.warn('[AI Voice Evaluation Error]:', err, 'Falling back to contextual evaluator.')
    }
  }

  // Fallback evaluator
  return generateVoiceInterviewFallback(req)
}

/**
 * Middleware handler for Vite / Node HTTP servers.
 */
export function voiceInterviewMiddleware(req: any, res: any): void {
  if (req.method === 'POST') {
    let body = ''
    req.on('data', (chunk: any) => {
      body += chunk
    })

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body) as VoiceEvaluationRequest
        const result = await handleVoiceEvaluation(payload)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify({ success: true, ...result }))
      } catch (err) {
        console.error('[voiceInterviewMiddleware Error]:', err)
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 400
        res.end(
          JSON.stringify({
            success: false,
            error: 'Invalid request payload for voice interview.',
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
        endpoint: '/api/voice-interview/evaluate',
        active: true,
      }),
    )
  } else {
    res.statusCode = 405
    res.end('Method Not Allowed')
  }
}

