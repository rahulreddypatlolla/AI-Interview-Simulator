import type { ServerRequest, ServerResponse } from './evaluationApi'
import { fullQuestionBank } from '../src/data/questionBank'

declare const process: {
  env: Record<string, string | undefined>
}

export interface MentorChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface MentorUserContext {
  candidateName?: string
  targetRole?: string
  completedSessions?: number
  averageScore?: number
  weakSkills?: Array<{ skill: string; score: number }>
  recentEvaluations?: Array<{
    category: string
    score: number
    weaknesses?: string[]
    improvements?: string[]
  }>
  recommendedQuestions?: Array<{
    prompt: string
    category: string
    difficulty: string
  }>
}

export interface MentorApiRequest {
  message: string
  conversationHistory?: MentorChatMessage[]
  userContext?: MentorUserContext
}

export interface MentorApiResponse {
  reply: string
  provider: 'gemini' | 'openai' | 'fallback'
  timestamp: string
}

/**
 * Intelligent context-aware fallback mentor engine.
 * Generates tailored coaching using the candidate's actual interview history.
 */
export function generateFallbackMentorResponse(
  message: string,
  context?: MentorUserContext,
): string {
  const q = message.toLowerCase().trim()
  const name = context?.candidateName || 'Candidate'
  const role = context?.targetRole || 'Full Stack Developer'
  const sessions = context?.completedSessions ?? 0
  const avg = context?.averageScore ?? 0
  const weakSkills = context?.weakSkills || []
  const weakestSkill = weakSkills.length > 0 ? weakSkills[0] : null

  // 1. Study Plan / Preparation Plan intent
  if (
    q.includes('plan') ||
    q.includes('schedule') ||
    q.includes('roadmap') ||
    q.includes('7-day') ||
    q.includes('14-day')
  ) {
    const focusArea1 = weakestSkill ? weakestSkill.skill : 'System Design & Architecture'
    const focusArea2 = weakSkills.length > 1 ? weakSkills[1].skill : 'Algorithms & Data Structures'

    return `### 📅 7-Day Personalized Interview Preparation Plan for **${role}**

Hi ${name}! Based on your ${sessions > 0 ? `${sessions} completed mock session(s) with an average of ${avg}%` : 'target role'}, here is your high-impact 7-day interview acceleration roadmap:

---

#### **Day 1–2: Foundation & Weak Spot Remediation (${focusArea1})**
- **Objective:** Bridge core knowledge gaps identified in previous evaluations.
- **Action items:**
  - Review fundamental architectural trade-offs (caching, database indexing, latency vs. throughput).
  - Practice explaining *why* you chose a specific data structure or design over alternatives.
  - Complete **1 mock interview session** focusing exclusively on **${focusArea1}**.

#### **Day 3–4: Problem-Solving & Technical Breadth (${focusArea2})**
- **Objective:** Sharpen analytical reasoning and edge-case handling.
- **Action items:**
  - Write clean pseudocode or structured steps before jumping straight into implementations.
  - Focus on time and space complexity ($O(n)$ analysis) upfront.
  - Practice 2 technical questions without looking at hints or solutions.

#### **Day 5: Behavioral Mastery with the STAR Framework**
- **Objective:** Ensure your communication matches your technical ability.
- **Action items:**
  - Prepare 3 anchor stories using:
    - **S**ituation: Context & scale in 2 sentences.
    - **T**ask: Your specific goal or challenge.
    - **A**ction: What **you personally decided and implemented**.
    - **R**esult: Quantified impact (latency dropped 30%, shipped 2 weeks early).
  - Complete a **Behavioral mock interview** on CareerVerse.

#### **Day 6: Mixed Simulation Under Time Pressure**
- **Objective:** Replicate real full-loop interview rounds.
- **Action items:**
  - Take a **Mixed format interview** (Technical + Problem Solving + Culture fit).
  - Speak your thoughts aloud continuously as you formulate your answers.

#### **Day 7: Final Review & Mental Readiness**
- **Objective:** Consolidate feedback and build confidence.
- **Action items:**
  - Review your lowest-scoring answers in your **Reports tab**.
  - Re-read ideal answer outlines for questions where you scored below 70%.
  - Rest well and enter the interview with structured confidence!`;
  }

  // 2. Weak skill analysis intent
  if (
    q.includes('weak') ||
    q.includes('gap') ||
    q.includes('improve') ||
    q.includes('focus') ||
    q.includes('where to start')
  ) {
    if (weakSkills.length > 0) {
      const weakList = weakSkills
        .slice(0, 3)
        .map((w) => `• **${w.skill}** (Current proficiency: ${w.score}%)`)
        .join('\n')

      const recentImprovements = context?.recentEvaluations
        ?.flatMap((e) => e.improvements || [])
        .slice(0, 3)
        .map((imp) => `• ${imp}`)
        .join('\n')

      return `### 🎯 Your Weak Spot Diagnostics & Improvement Areas

Hi ${name}, based on your ${sessions} interview session(s), here is an honest analysis of where your score is being held back:

#### **Key Areas Needing Attention:**
${weakList}

${
  recentImprovements
    ? `#### **Actionable Feedback from Recent Evaluations:**\n${recentImprovements}\n`
    : ''
}
#### **Why Interviewers Ding Answers in These Areas:**
1. **Skipping Requirements Clarification:** Candidates often dive into solutions without asking about constraints, edge cases, or expected traffic.
2. **Missing Trade-off Justifications:** Naming a technology (like Redis or Kafka) is good, but interviewers look for *why* you chose it over Postgres pub/sub or in-memory queues.
3. **Unstructured Communication:** Answers that meander without clear signposting lose points in communication.

**Recommended Next Action:** Take an interview focusing specifically on **${weakestSkill?.skill}** to raise your running average!`;
    }

    return `### 🎯 Targeted Focus Areas for ${role}

Hi ${name}! As you prepare for **${role}** interviews, here are the 3 highest-leverage areas to focus on:

1. **System Trade-offs:** Always discuss read vs. write ratios, SQL vs. NoSQL suitability, and single-points-of-failure.
2. **Concrete Examples:** Back up behavioral questions with real production scenarios rather than hypothetical answers.
3. **Structured Explanation:** State your top-level strategy before diving into technical details.

Complete a mock interview session today to receive personalized weakness analytics!`;
  }

  // 3. Recommended questions intent
  if (
    q.includes('question') ||
    q.includes('practice') ||
    q.includes('recommend') ||
    q.includes('problem')
  ) {
    // Pick tailored questions from the question bank
    const filtered = fullQuestionBank.filter((qItem) => {
      if (weakestSkill && qItem.category.toLowerCase().includes(weakestSkill.skill.toLowerCase())) {
        return true
      }
      return qItem.role.toLowerCase().includes(role.toLowerCase()) || qItem.type === 'Technical'
    })

    const picks = (filtered.length >= 3 ? filtered : fullQuestionBank).slice(0, 3)

    return `### 💡 Recommended Practice Questions for ${role}

Based on your target role and skill priorities, here are 3 questions from the Question Bank designed to strengthen your profile:

${picks
  .map(
    (p, i) => `#### **${i + 1}. ${p.prompt}**
- **Category:** ${p.category} | **Difficulty:** ${p.difficulty}
- **Key Concepts Expected:** ${p.expectedConcepts.slice(0, 4).join(', ')}
- **Interviewer Hint:** *${p.hint}*
`
  )
  .join('\n')}

**Pro Tip:** Click **Start an Interview** in the navigation bar and select these focus areas in your interview configuration!`;
  }

  // 4. Behavioral & Communication / STAR method intent
  if (
    q.includes('behavioral') ||
    q.includes('star') ||
    q.includes('communication') ||
    q.includes('soft skill') ||
    q.includes('tell me about')
  ) {
    return `### 🗣️ Mastering Behavioral Answers with the STAR Method

In senior and mid-level interviews for **${role}**, communication clarity accounts for up to 40% of the overall score.

Here is the exact formula top candidates use:

---

#### 1. **S — Situation (15% of your answer)**
- Set the stage succinctly. Provide the company context, team size, and the challenge.
- *Example:* *"At my previous company, our payment processing microservice experienced intermittent timeouts during flash sales."*

#### 2. **T — Task (10% of your answer)**
- Define your exact responsibility.
- *Example:* *"As the lead backend developer, my objective was to reduce 99th-percentile latency below 200ms without data loss."*

#### 3. **A — Action (60% of your answer — the most critical)**
- Explain **what you personally did**, how you analyzed the problem, and why you selected your approach.
- *Example:* *"I analyzed distributed traces and discovered database connection pool exhaustion. I introduced Redis read-through caching, implemented exponential backoff retries, and decoupled webhook notifications using an asynchronous message queue."*

#### 4. **R — Result (15% of your answer)**
- Share concrete, measurable impact.
- *Example:* *"This reduced API latency by 64%, dropped error rates to zero during our Black Friday sale, and became the blueprint for other microservices."*

---

**Would you like to practice a behavioral question together right now?**`;
  }

  // 5. Default General Coaching
  return `### 🚀 Executive Interview Coaching for **${role}**

Hello ${name}! I am your AI Interview Mentor. I continuously review your completed practice sessions, question answers, and evaluations to give you tailored guidance.

${
  sessions > 0
    ? `**Your Current Standing:**\n• Completed Sessions: **${sessions}**\n• Average Performance Score: **${avg}/100**\n• Lowest Scoring Area: **${weakestSkill ? `${weakestSkill.skill} (${weakestSkill.score}%)` : 'None identified'}**\n`
    : `**Getting Started:** You haven't recorded any mock interview sessions yet. Complete your first practice interview so I can analyze your exact answers and pinpoint your weak spots!\n`
}

#### **How I Can Help You Today:**
- 📅 **"Give me a 7-day interview study plan"**
- 🎯 **"Where should I focus next based on my scores?"**
- 💡 **"Recommend 3 questions to practice my weak skills"**
- 🗣️ **"How do I answer 'Tell me about a time you had a technical disagreement'?"**

Feel free to ask any specific interview question or request technical coaching!`;
}

/**
 * Calls Gemini API securely on the server.
 */
async function callGeminiMentor(
  apiKey: string,
  userPrompt: string,
  history: MentorChatMessage[],
  context?: MentorUserContext,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const systemInstruction = `You are the CareerVerse AI Interview Mentor, a world-class executive technical and behavioral interview coach.
You have direct access to the candidate's actual interview history, scores, and evaluation records:
- Candidate Name: ${context?.candidateName || 'Candidate'}
- Target Role: ${context?.targetRole || 'Software Engineer'}
- Completed Interviews: ${context?.completedSessions ?? 0}
- Average Score: ${context?.averageScore ?? 0}/100
- Identified Weak Skills: ${JSON.stringify(context?.weakSkills || [])}
- Recent Evaluation Insights: ${JSON.stringify(context?.recentEvaluations || [])}
- Recommended Bank Questions: ${JSON.stringify(context?.recommendedQuestions || [])}

COACHING RULES:
1. Always ground your advice in their target role and actual score context.
2. Be rigorous, empathetic, constructive, and actionable.
3. When asked for study plans or weak spots, cite their actual numbers and provide clear day-by-day steps.
4. When recommending questions, provide prompt, category, difficulty, and expected concepts.
5. Format your answers with clear markdown headers, bold keywords, and bullet points.`

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemInstruction }],
    },
    {
      role: 'model',
      parts: [{ text: 'Understood. I am your personalized CareerVerse AI Interview Mentor, ready with your actual interview context.' }],
    },
    ...history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ]

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as any
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('Empty response from Gemini API.')
  }
  return text
}

/**
 * Server middleware handling POST /api/mentor requests.
 */
export async function mentorMiddleware(
  req: ServerRequest,
  res: ServerResponse,
): Promise<void> {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }))
    return
  }

  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', async () => {
    try {
      const parsed: MentorApiRequest = JSON.parse(body || '{}')

      if (!parsed.message || !parsed.message.trim()) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Message cannot be empty.' }))
        return
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY

      // 1. Try Gemini API if key is present on server
      if (apiKey && apiKey.trim()) {
        try {
          const reply = await callGeminiMentor(
            apiKey.trim(),
            parsed.message,
            parsed.conversationHistory || [],
            parsed.userContext,
          )

          res.statusCode = 200
          res.end(
            JSON.stringify({
              reply,
              provider: 'gemini',
              timestamp: new Date().toISOString(),
            }),
          )
          return
        } catch (apiErr) {
          console.warn(
            '[Mentor API] Server AI provider failed, activating fallback mentor engine:',
            apiErr instanceof Error ? apiErr.message : String(apiErr),
          )
        }
      }

      // 2. Fallback Mentor Engine (context-aware, reliable, offline-safe)
      const fallbackReply = generateFallbackMentorResponse(
        parsed.message,
        parsed.userContext,
      )

      res.statusCode = 200
      res.end(
        JSON.stringify({
          reply: fallbackReply,
          provider: 'fallback',
          timestamp: new Date().toISOString(),
        }),
      )
    } catch (err) {
      console.error('[Mentor API Exception]:', err)
      res.statusCode = 500
      res.end(
        JSON.stringify({
          error: 'Internal server error processing mentor request.',
          reply:
            'I encountered a temporary connection issue. Please check your network and try again.',
          provider: 'fallback',
          timestamp: new Date().toISOString(),
        }),
      )
    }
  })
}

