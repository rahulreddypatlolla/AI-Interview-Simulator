import type {
  InterviewQuestion,
  InterviewConfig,
  InterviewType,
  QuestionDifficulty,
} from '../types'
import { fullQuestionBank } from '../data/questionBank'

// ==========================================
// ADAPTIVE QUESTION SELECTION ENGINE
// ==========================================
//
// This module is entirely separate from React components.
// It receives an InterviewConfig and returns a filtered,
// prioritized, deduplicated list of InterviewQuestion objects.
// ==========================================

/** Default number of questions per interview session */
export const DEFAULT_SESSION_SIZE = 8

/** Standard roles officially supported by CareerVerse */
export const SUPPORTED_ROLES: string[] = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Java Developer',
  'Python Developer',
  'Software Engineer',
  'Data Analyst',
]

/** How many questions to pull from each type in a balanced Mixed interview */
export const MIXED_DISTRIBUTION = {
  Technical: 3,
  Behavioral: 3,
  HR: 2,
} as const

// ------------------------------------------
// Public interfaces
// ------------------------------------------

export interface QuestionSelectionResult {
  questions: InterviewQuestion[]
  totalAvailable: number
  filtersApplied: {
    type: InterviewType
    difficulty: QuestionDifficulty
    role: string
    focusAreas: string[]
  }
  categoriesIncluded: string[]
  emptyReason?: string
}

export interface SelectionOptions {
  sessionSize?: number
  excludeIds?: string[]
}

// ------------------------------------------
// Role and eligibility helpers
// ------------------------------------------

/**
 * Checks whether a given role is one of the recognized or configured roles.
 */
export function isSupportedRole(role: string): boolean {
  if (!role || !role.trim()) return false
  const normalized = role.trim().toLowerCase()
  return (
    SUPPORTED_ROLES.some((r) => r.toLowerCase() === normalized) ||
    fullQuestionBank.some((q) =>
      Array.isArray(q.role) && q.role.some((qr) => qr.toLowerCase() === normalized),
    )
  )
}

/**
 * Check whether a question is relevant to a given role.
 * - If question specifies target roles, checks for an exact case-insensitive match.
 * - If question specifies ALL_ROLES (`[]`), it applies to recognized tech roles.
 * - Completely disallows random questions for unrecognized or unrelated roles.
 */
export function isRelevantToRole(
  question: InterviewQuestion,
  role: string,
): boolean {
  if (!role || !role.trim()) return false
  const normalizedTarget = role.trim().toLowerCase()

  const questionRoles = Array.isArray(question.role)
    ? question.role
    : (question.role ? [question.role] : [])

  // If the question has explicit role targets, verify membership
  if (
    questionRoles.some(
      (r) => r.toLowerCase() === normalizedTarget || r.toLowerCase() === 'all',
    )
  ) {
    return true
  }

  // Universal questions (empty role array) only apply if the role is a recognized tech role
  if (questionRoles.length === 0) {
    return isSupportedRole(role)
  }

  return false
}

/**
 * Deterministic shuffle using a seed derived from a string (e.g. sessionId).
 * Allows reproducible sessions when the same sessionId is provided.
 */
export function seededShuffle<T>(
  items: T[],
  seed: string,
): T[] {
  const arr = [...items]
  if (arr.length <= 1) return arr

  // Simple hash from seed string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }

  // Fisher-Yates with pseudo-random from hash
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) | 0
    const j = ((hash < 0 ? -hash : hash) % (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

/**
 * Score a question based on how well it matches the selected focus areas.
 * Direct category matches score highest (100), followed by expected concepts (40/20)
 * and prompt text mentions (10).
 */
export function calculateFocusScore(
  question: InterviewQuestion,
  focusAreas: string[],
): number {
  if (!focusAreas || focusAreas.length === 0) return 0

  let score = 0
  const normalizedFocus = focusAreas
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean)

  if (normalizedFocus.length === 0) return 0

  const cat = (question.category || '').toLowerCase()

  for (const focus of normalizedFocus) {
    // 1. Direct or substring category match
    if (cat === focus) {
      score += 100
    } else if (cat.includes(focus) || focus.includes(cat)) {
      score += 60
    }

    // 2. Expected concepts match
    const concepts = question.expectedConcepts || []
    for (const concept of concepts) {
      const cLower = concept.toLowerCase()
      if (cLower === focus) {
        score += 40
      } else if (cLower.includes(focus) || focus.includes(cLower)) {
        score += 20
      }
    }

    // 3. Prompt keyword match
    if (question.prompt.toLowerCase().includes(focus)) {
      score += 10
    }
  }

  return score
}

/**
 * Filter pool by difficulty with fallback to adjacent difficulty levels
 * only within the given role-safe pool.
 */
function getCandidatesWithDifficultyFallback(
  pool: InterviewQuestion[],
  desiredDifficulty: QuestionDifficulty,
  minCount: number,
): InterviewQuestion[] {
  // Step A: exact difficulty match
  const exactMatches = pool.filter((q) => q.difficulty === desiredDifficulty)
  if (exactMatches.length >= minCount) {
    return exactMatches
  }

  // Step B: fallback to adjacent difficulties
  const difficultyFallbackOrder: Record<QuestionDifficulty, QuestionDifficulty[]> = {
    Easy: ['Medium', 'Hard'],
    Medium: ['Easy', 'Hard'],
    Hard: ['Medium', 'Easy'],
  }

  const fallbacks = difficultyFallbackOrder[desiredDifficulty] || []
  const combined = [...exactMatches]

  for (const fb of fallbacks) {
    if (combined.length >= minCount) break
    const additional = pool.filter(
      (q) => q.difficulty === fb && !combined.some((c) => c.id === q.id),
    )
    combined.push(...additional)
  }

  return combined
}

/**
 * Select questions for a single interview type (Technical, Behavioral, HR, or Mixed).
 */
function selectByType(
  pool: InterviewQuestion[],
  type: InterviewType,
  config: InterviewConfig,
  count: number,
  seed: string,
  seenIds: Set<string>,
): InterviewQuestion[] {
  const typePool = pool.filter(
    (q) => q.type === type && !seenIds.has(q.id),
  )

  if (typePool.length === 0) return []

  const candidates = getCandidatesWithDifficultyFallback(
    typePool,
    config.difficulty,
    count,
  )

  // Score candidate questions against focus areas
  const scored = candidates.map((q) => ({
    question: q,
    score: calculateFocusScore(q, config.gaps),
  }))

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)

  // Partition into score tiers and shuffle within each tier
  const highTier = scored.filter((s) => s.score >= 60).map((s) => s.question)
  const midTier = scored.filter((s) => s.score > 0 && s.score < 60).map((s) => s.question)
  const baseTier = scored.filter((s) => s.score === 0).map((s) => s.question)

  const shuffledCandidates = [
    ...seededShuffle(highTier, seed + type + '-high'),
    ...seededShuffle(midTier, seed + type + '-mid'),
    ...seededShuffle(baseTier, seed + type + '-base'),
  ]

  const result: InterviewQuestion[] = []
  for (const q of shuffledCandidates) {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id)
      result.push(q)
      if (result.length >= count) break
    }
  }

  return result
}

/**
 * Select questions for a Mixed interview ensuring representation from MULTIPLE categories.
 * Enforces category diversity and balances technical, behavioral, and HR topics.
 */
function selectMixedInterview(
  rolePool: InterviewQuestion[],
  config: InterviewConfig,
  targetCount: number,
  seed: string,
  seenIds: Set<string>,
): InterviewQuestion[] {
  if (rolePool.length === 0) return []

  const availableCandidates = getCandidatesWithDifficultyFallback(
    rolePool.filter((q) => !seenIds.has(q.id)),
    config.difficulty,
    targetCount,
  )

  if (availableCandidates.length === 0) return []

  // Step 1: Pull from distinct types proportionally (Tech, Behavioral, HR, and Mixed)
  const techTarget = Math.max(1, Math.min(3, Math.floor(targetCount * 0.375)))
  const behTarget = Math.max(1, Math.min(3, Math.floor(targetCount * 0.375)))
  const hrTarget = Math.max(1, targetCount - techTarget - behTarget)

  const techQuestions = selectByType(
    availableCandidates,
    'Technical',
    config,
    techTarget,
    seed + '-tech',
    seenIds,
  )

  const behQuestions = selectByType(
    availableCandidates,
    'Behavioral',
    config,
    behTarget,
    seed + '-beh',
    seenIds,
  )

  const hrQuestions = selectByType(
    availableCandidates,
    'HR',
    config,
    hrTarget,
    seed + '-hr',
    seenIds,
  )

  const dedicatedMixedQuestions = selectByType(
    availableCandidates,
    'Mixed',
    config,
    2,
    seed + '-mixed',
    seenIds,
  )

  // Step 2: Interleave questions to maintain engagement across types and categories
  const primarySelected: InterviewQuestion[] = []
  const maxTier = Math.max(
    techQuestions.length,
    behQuestions.length,
    hrQuestions.length,
    dedicatedMixedQuestions.length,
  )

  for (let i = 0; i < maxTier; i++) {
    if (i < techQuestions.length) primarySelected.push(techQuestions[i])
    if (i < behQuestions.length) primarySelected.push(behQuestions[i])
    if (i < hrQuestions.length) primarySelected.push(hrQuestions[i])
    if (i < dedicatedMixedQuestions.length) primarySelected.push(dedicatedMixedQuestions[i])
  }

  // Step 3: Verify requirement 6 — "For Mixed interviews, include questions from multiple categories."
  const categoryCounts = new Map<string, number>()
  for (const q of primarySelected) {
    categoryCounts.set(q.category, (categoryCounts.get(q.category) || 0) + 1)
  }

  let finalSelection = [...primarySelected]

  // If only 1 category is represented and other categories exist in the rolePool,
  // actively bring in questions from other categories to guarantee category diversity
  if (categoryCounts.size <= 1 && rolePool.length > finalSelection.length) {
    const existingCategory = finalSelection[0]?.category || ''
    const alternateCandidates = rolePool.filter(
      (q) =>
        q.category !== existingCategory &&
        !seenIds.has(q.id) &&
        !finalSelection.some((s) => s.id === q.id),
    )

    if (alternateCandidates.length > 0) {
      const scoredAlternates = alternateCandidates.map((q) => ({
        question: q,
        score: calculateFocusScore(q, config.gaps),
      }))
      scoredAlternates.sort((a, b) => b.score - a.score)
      const toAdd = seededShuffle(
        scoredAlternates.slice(0, 4).map((s) => s.question),
        seed + '-alt',
      )

      for (const alt of toAdd) {
        if (!seenIds.has(alt.id)) {
          seenIds.add(alt.id)
          finalSelection.push(alt)
          break
        }
      }
    }
  }

  // Step 4: If we still haven't reached targetCount, fill from remaining rolePool candidates
  if (finalSelection.length < targetCount) {
    const remaining = rolePool.filter(
      (q) => !seenIds.has(q.id) && !finalSelection.some((s) => s.id === q.id),
    )

    const scoredRemaining = remaining.map((q) => ({
      question: q,
      score: calculateFocusScore(q, config.gaps),
    }))
    scoredRemaining.sort((a, b) => b.score - a.score)

    const shuffledRemaining = seededShuffle(
      scoredRemaining.map((s) => s.question),
      seed + '-fill',
    )

    for (const q of shuffledRemaining) {
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id)
        finalSelection.push(q)
        if (finalSelection.length >= targetCount) break
      }
    }
  }

  return finalSelection.slice(0, targetCount)
}

// ------------------------------------------
// Public API
// ------------------------------------------

/**
 * Build an adaptive question set for the given interview configuration.
 *
 * @param config    - The interview configuration from the setup page
 * @param sessionId - Used as a seed for deterministic shuffling
 * @param options   - Additional options like custom sessionSize or excluded IDs
 * @returns         - The selected questions and metadata
 */
export function selectQuestions(
  config: InterviewConfig,
  sessionId: string = '',
  options?: SelectionOptions,
): QuestionSelectionResult {
  const targetCount =
    options?.sessionSize || config.sessionSize || DEFAULT_SESSION_SIZE

  // Track seen IDs to guarantee no duplicates within a session
  const seenIds = new Set<string>(options?.excludeIds || config.excludeIds || [])

  const filtersApplied = {
    type: config.type,
    difficulty: config.difficulty,
    role: config.role,
    focusAreas: config.gaps || [],
  }

  // Step 1: Filter the full bank strictly to role-relevant questions.
  // Rule: Do not use random questions unrelated to the selected role.
  const rolePool = fullQuestionBank.filter((q) =>
    isRelevantToRole(q, config.role),
  )

  // Empty state handling for role
  if (rolePool.length === 0) {
    return {
      questions: [],
      totalAvailable: 0,
      filtersApplied,
      categoriesIncluded: [],
      emptyReason: `No interview questions found for role "${config.role}". Please select a valid role.`,
    }
  }

  let selected: InterviewQuestion[] = []

  if (config.type === 'Mixed') {
    // Step 2a: Mixed interview — includes questions across multiple categories
    selected = selectMixedInterview(
      rolePool,
      config,
      targetCount,
      sessionId,
      seenIds,
    )
  } else {
    // Step 2b: Specific interview type (Technical, Behavioral, HR)
    selected = selectByType(
      rolePool,
      config.type,
      config,
      targetCount,
      sessionId,
      seenIds,
    )
  }

  // Step 3: Absolute final deduplication safety net
  const deduped: InterviewQuestion[] = []
  const finalIdSet = new Set<string>()

  for (const q of selected) {
    if (!finalIdSet.has(q.id)) {
      finalIdSet.add(q.id)
      deduped.push(q)
    }
  }

  // Extract categories included in the selected questions
  const categoriesIncluded = Array.from(
    new Set(deduped.map((q) => q.category)),
  )

  // Empty state reason if no questions matched
  let emptyReason: string | undefined
  if (deduped.length === 0) {
    emptyReason = `No ${config.type} questions found at ${config.difficulty} difficulty for "${config.role}". Try selecting a different difficulty or interview type.`
  }

  return {
    questions: deduped,
    totalAvailable: rolePool.length,
    filtersApplied,
    categoriesIncluded,
    emptyReason,
  }
}

/**
 * Get the count of available questions for given filters.
 * Used by setup page and UI badges for availability.
 */
export function getAvailableCount(
  config: Partial<InterviewConfig>,
): number {
  let pool = [...fullQuestionBank]

  if (config.role) {
    pool = pool.filter((q) => isRelevantToRole(q, config.role!))
  }

  if (config.type && config.type !== 'Mixed') {
    pool = pool.filter((q) => q.type === config.type)
  }

  if (config.difficulty) {
    pool = pool.filter((q) => q.difficulty === config.difficulty)
  }

  return pool.length
}

/**
 * Get count breakdown by interview type for a given role.
 */
export function getRoleCoverage(role: string): Record<InterviewType, number> {
  const rolePool = fullQuestionBank.filter((q) => isRelevantToRole(q, role))
  return {
    Technical: rolePool.filter((q) => q.type === 'Technical').length,
    Behavioral: rolePool.filter((q) => q.type === 'Behavioral').length,
    HR: rolePool.filter((q) => q.type === 'HR').length,
    Mixed: rolePool.filter((q) => q.type === 'Mixed').length,
  }
}

/**
 * Get all unique categories across the entire question bank.
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(fullQuestionBank.map((q) => q.category))).sort()
}

/**
 * Get all unique categories available for a specific role.
 */
export function getCategoriesForRole(role: string): string[] {
  return Array.from(
    new Set(
      fullQuestionBank
        .filter((q) => isRelevantToRole(q, role))
        .map((q) => q.category),
    ),
  ).sort()
}
