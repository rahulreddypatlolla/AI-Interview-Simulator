import type {
  AnswerEvaluation,
  EvaluationRequest,
  EvaluationAspect,
} from '../types'

// ==========================================
// FALLBACK ANSWER EVALUATOR
// ==========================================
//
// Used strictly as a fallback when the AI service fails or
// when offline. Clearly flagged as evaluatedBy: 'fallback'
// to never pretend local heuristics are AI evaluations.
// ==========================================

export function evaluateAnswerFallback(
  request: EvaluationRequest,
): AnswerEvaluation {
  const trimmed = (request.answer || '').trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const lowerAnswer = trimmed.toLowerCase()

  // 1. Concept Analysis against expected concepts
  const expected = request.expectedConcepts || []
  const matchedConcepts = expected.filter((concept) =>
    lowerAnswer.includes(concept.toLowerCase()),
  )
  const missedConcepts = expected.filter(
    (concept) => !lowerAnswer.includes(concept.toLowerCase()),
  )
  const conceptRatio =
    expected.length > 0 ? matchedConcepts.length / expected.length : 0.5

  // 2. Communication and Structure Analysis
  const hasSignposting =
    /\b(first|second|then|finally|in summary|for example|furthermore|specifically|on the other hand)\b/i.test(
      trimmed,
    )
  const hasParagraphs = trimmed.includes('\n') || words >= 60

  // 3. Problem Solving and Reasoning Analysis
  const hasTradeoffs =
    /\b(trade-off|tradeoff|because|alternative|latency|throughput|performance|bottleneck|complexity|edge case|versus|vs)\b/i.test(
      trimmed,
    )
  const hasEvidenceOrMetrics =
    /\b(\d+%?|\d+ ms|o\(|improved|reduced|scale|tested|measured|benchmark)\b/i.test(
      trimmed,
    )

  // Sub-scores calculation
  let techScore = Math.round(
    30 +
      conceptRatio * 45 +
      Math.min(words, 80) * 0.25 +
      (hasTradeoffs ? 10 : 0),
  )
  techScore = Math.max(20, Math.min(95, techScore))

  let commScore = Math.round(
    35 +
      (hasSignposting ? 25 : 0) +
      (hasParagraphs ? 15 : 0) +
      Math.min(words, 70) * 0.25,
  )
  commScore = Math.max(25, Math.min(95, commScore))

  let psScore = Math.round(
    30 +
      (hasTradeoffs ? 30 : 0) +
      (hasEvidenceOrMetrics ? 20 : 0) +
      Math.min(words, 60) * 0.25,
  )
  psScore = Math.max(20, Math.min(95, psScore))

  // If answer is virtually empty, cap scores
  if (words < 10) {
    techScore = Math.min(techScore, 20)
    commScore = Math.min(commScore, 20)
    psScore = Math.min(psScore, 20)
  }

  // Overall weighted score (40% Technical, 30% Communication, 30% Problem Solving)
  const overallScore = Math.round(
    techScore * 0.4 + commScore * 0.3 + psScore * 0.3,
  )

  // Technical Feedback
  let techFeedback = ''
  if (words < 15) {
    techFeedback =
      'The response is too brief to demonstrate technical mastery. Elaborate on core mechanisms and definitions.'
  } else if (matchedConcepts.length > 0) {
    techFeedback = `Addressed key concepts including ${matchedConcepts.slice(0, 3).join(', ')}. ${
      missedConcepts.length > 0
        ? `Consider elaborating on ${missedConcepts.slice(0, 2).join(', ')} to demonstrate deeper technical competence.`
        : 'Good technical coverage.'
    }`
  } else {
    techFeedback = `The explanation touches the topic but missed core concepts such as ${
      expected.slice(0, 3).join(', ') || 'essential terminology'
    }.`
  }

  // Communication Feedback
  let commFeedback = ''
  if (hasSignposting) {
    commFeedback =
      'Good use of structural transitions and signposting, making the response logical to follow.'
  } else if (words >= 45) {
    commFeedback =
      'Good length, but structuring with numbered points or a Situation → Action → Result format would enhance clarity.'
  } else {
    commFeedback =
      'State your main thesis upfront before diving into details. Use clear transitional phrases.'
  }

  // Problem Solving Feedback
  let psFeedback = ''
  if (hasTradeoffs && hasEvidenceOrMetrics) {
    psFeedback =
      'Demonstrated balanced thinking by highlighting engineering trade-offs and concrete performance implications.'
  } else if (hasTradeoffs) {
    psFeedback =
      'Discussed trade-offs, but grounding choices with specific metrics or examples would strengthen the justification.'
  } else {
    psFeedback =
      'Focus on why a particular approach was chosen over alternatives, and mention edge cases or failure modes.'
  }

  // Strengths
  const strengths: string[] = []
  if (words >= 45) {
    strengths.push('Provided a descriptive response with sufficient context.')
  }
  if (matchedConcepts.length > 0) {
    strengths.push(
      `Accurately integrated expected concepts (${matchedConcepts.slice(0, 2).join(', ')}).`,
    )
  }
  if (hasSignposting) {
    strengths.push(
      'Used clear structural markers to guide the interviewer through your explanation.',
    )
  }
  if (hasTradeoffs) {
    strengths.push('Acknowledged architectural trade-offs and design choices.')
  }
  if (strengths.length === 0) {
    strengths.push('Offered a foundational starting answer to build upon.')
  }

  // Weaknesses
  const weaknesses: string[] = []
  if (words < 35) {
    weaknesses.push(
      'Answer was too concise; lacks detailed rationale and depth.',
    )
  }
  if (missedConcepts.length > 0) {
    weaknesses.push(
      `Omitted key expected principles: ${missedConcepts.slice(0, 3).join(', ')}.`,
    )
  }
  if (!hasSignposting) {
    weaknesses.push(
      'Lacks structured signposting; points blend together without clear separation.',
    )
  }
  if (!hasTradeoffs) {
    weaknesses.push(
      'Did not discuss alternatives, edge cases, or trade-offs.',
    )
  }

  // Specific Improvement Suggestions
  const improvements: string[] = []
  if (missedConcepts.length > 0) {
    improvements.push(
      `Explicitly mention and define ${missedConcepts[0]} to validate subject matter depth.`,
    )
  }
  if (!hasTradeoffs) {
    improvements.push(
      'Compare this approach with at least one alternative to demonstrate holistic technical judgment.',
    )
  }
  if (!hasEvidenceOrMetrics) {
    improvements.push(
      'Include a concrete metric, benchmark, or real-world example to substantiate the claims.',
    )
  }
  if (words < 45) {
    improvements.push(
      'Expand upon what you personally decided, implemented, and learned in this scenario.',
    )
  }
  if (improvements.length === 0) {
    improvements.push(
      'Refine precision by connecting technical constraints directly to business and user impacts.',
    )
  }

  // Ideal Answer Outline
  const idealAnswerOutline: string[] = [
    `1. Direct Definition / Core Thesis: Directly address "${request.question.slice(0, 80)}..." with a crisp summary.`,
    `2. Technical Mechanisms: Explain key principles (${(request.expectedConcepts || []).slice(0, 4).join(', ') || 'underlying concepts'}).`,
    '3. Trade-offs & Alternatives: Compare pros and cons (time complexity, memory, maintenance, scaling).',
    '4. Concrete Example: Provide a specific implementation scenario or production outcome.',
    '5. Conclusion & Edge Cases: Address boundary conditions and graceful failure handling.',
  ]

  return {
    questionId: request.questionId,
    category: request.category,
    question: request.question,
    answer: request.answer,
    score: overallScore,
    technicalCorrectness: {
      score: techScore,
      feedback: techFeedback,
    },
    communication: {
      score: commScore,
      feedback: commFeedback,
    },
    problemSolving: {
      score: psScore,
      feedback: psFeedback,
    },
    strengths,
    weaknesses,
    improvements,
    idealAnswerOutline,
    evaluatedBy: 'fallback',
    evaluatedAt: new Date().toISOString(),
    words,
  }
}

