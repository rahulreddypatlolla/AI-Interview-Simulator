import { fullQuestionBank } from 'file:///d:/AI%20Interview/AI-Interview-Simulator/src/data/questionBank.ts';
import { selectQuestions, getAvailableCount, isRelevantToRole, calculateFocusScore, } from 'file:///d:/AI%20Interview/AI-Interview-Simulator/src/engine/questionEngine.ts';
console.log('========================================================');
console.log('VERIFYING ADAPTIVE INTERVIEW QUESTION ENGINE REQUIREMENTS');
console.log('========================================================\n');
let passed = 0;
let failed = 0;
function assert(condition, testName, details) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    }
    else {
        console.error(`❌ FAIL: ${testName}`);
        if (details)
            console.error(`   Details: ${details}`);
        failed++;
    }
}
// -----------------------------------------------------------------
// Requirement 1 & 3: Interview types and Question bank expansion (>= 15 per type)
// -----------------------------------------------------------------
console.log('--- Testing Requirement 1 & 3: Interview Types & Bank Size ---');
const requiredTypes = ['Technical', 'Behavioral', 'HR', 'Mixed'];
for (const type of requiredTypes) {
    const count = fullQuestionBank.filter((q) => q.type === type).length;
    assert(count >= 15, `Question bank has at least 15 questions for type "${type}"`, `Found ${count} questions (minimum required is 15)`);
}
console.log(`Total questions in bank: ${fullQuestionBank.length}`);
// -----------------------------------------------------------------
// Requirement 2: Three difficulty levels (Easy, Medium, Hard)
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 2: Difficulty Levels ---');
const difficulties = ['Easy', 'Medium', 'Hard'];
for (const diff of difficulties) {
    const count = fullQuestionBank.filter((q) => q.difficulty === diff).length;
    assert(count >= 15, `Question bank has ample questions for difficulty "${diff}"`, `Found ${count} questions`);
}
// -----------------------------------------------------------------
// Requirement 4: Required fields for each question
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 4: Required Question Fields ---');
let allFieldsValid = true;
const missingFieldExamples = [];
for (const q of fullQuestionBank) {
    const hasId = typeof q.id === 'string' && q.id.length > 0;
    const hasType = requiredTypes.includes(q.type);
    const hasDifficulty = difficulties.includes(q.difficulty);
    const hasCategory = typeof q.category === 'string' && q.category.length > 0;
    const hasRole = Array.isArray(q.role);
    const hasPrompt = typeof q.prompt === 'string' && q.prompt.length > 0;
    const hasHint = typeof q.hint === 'string' && q.hint.length > 0;
    const hasExpectedConcepts = Array.isArray(q.expectedConcepts) && q.expectedConcepts.length > 0;
    const hasSpacedAlias = Array.isArray(q['expected concepts']) && q['expected concepts'].length > 0;
    if (!hasId ||
        !hasType ||
        !hasDifficulty ||
        !hasCategory ||
        !hasRole ||
        !hasPrompt ||
        !hasHint ||
        !hasExpectedConcepts ||
        !hasSpacedAlias) {
        allFieldsValid = false;
        missingFieldExamples.push(q.id);
    }
}
assert(allFieldsValid, 'All questions include id, type, difficulty, category, role, prompt, hint, expected concepts', `Failed on IDs: ${missingFieldExamples.slice(0, 5).join(', ')}`);
// -----------------------------------------------------------------
// Requirement 5: Select questions according to interview configuration
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 5: Configuration Matching ---');
const configTech = {
    role: 'Full Stack Developer',
    type: 'Technical',
    difficulty: 'Easy',
    gaps: ['React'],
};
const resultTech = selectQuestions(configTech, 'session-101');
assert(resultTech.questions.length > 0, 'selectQuestions returns questions for Technical Easy configuration', `Returned ${resultTech.questions.length} questions`);
assert(resultTech.questions.every((q) => q.type === 'Technical'), 'All questions returned match configured type "Technical"');
assert(resultTech.questions.every((q) => isRelevantToRole(q, configTech.role)), 'All questions returned are relevant to configured role "Full Stack Developer"');
// -----------------------------------------------------------------
// Requirement 6: For Mixed interviews, include questions from multiple categories
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 6: Mixed Interviews Multiple Categories ---');
const configMixed = {
    role: 'Full Stack Developer',
    type: 'Mixed',
    difficulty: 'Medium',
    gaps: ['SQL', 'Communication'],
};
const resultMixed = selectQuestions(configMixed, 'session-mixed-1');
const categoriesInMixed = new Set(resultMixed.questions.map((q) => q.category));
assert(categoriesInMixed.size >= 2, 'Mixed interview includes questions from multiple categories', `Found categories: ${Array.from(categoriesInMixed).join(', ')} (count: ${categoriesInMixed.size})`);
assert(resultMixed.categoriesIncluded.length >= 2, 'Result metadata categoriesIncluded reflects multiple categories', `Metadata categories: ${resultMixed.categoriesIncluded.join(', ')}`);
// Test Mixed interview with NO focus areas also has multiple categories
const configMixedNoGaps = {
    role: 'Software Engineer',
    type: 'Mixed',
    difficulty: 'Easy',
    gaps: [],
};
const resultMixedNoGaps = selectQuestions(configMixedNoGaps, 'session-mixed-2');
const categoriesInMixedNoGaps = new Set(resultMixedNoGaps.questions.map((q) => q.category));
assert(categoriesInMixedNoGaps.size >= 2, 'Mixed interview with no focus areas also includes multiple categories', `Found categories: ${Array.from(categoriesInMixedNoGaps).join(', ')}`);
// -----------------------------------------------------------------
// Requirement 7: Avoid duplicate questions within a session
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 7: Avoid Duplicates Within Session ---');
const testConfigs = [
    { role: 'Full Stack Developer', type: 'Technical', difficulty: 'Medium', gaps: ['SQL', 'React'] },
    { role: 'Backend Developer', type: 'Mixed', difficulty: 'Hard', gaps: ['System design'] },
    { role: 'Data Analyst', type: 'Technical', difficulty: 'Easy', gaps: ['SQL'] },
    { role: 'Software Engineer', type: 'Behavioral', difficulty: 'Medium', gaps: ['Communication'] },
    { role: 'Java Developer', type: 'HR', difficulty: 'Easy', gaps: [] },
];
let allSessionsDeduplicated = true;
for (const [idx, cfg] of testConfigs.entries()) {
    const res = selectQuestions(cfg, `session-dedup-${idx}`);
    const ids = res.questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
        allSessionsDeduplicated = false;
        console.error(`Duplicates found in config ${cfg.type} - ${cfg.role}:`, ids);
    }
}
assert(allSessionsDeduplicated, 'No duplicate questions within any session');
// -----------------------------------------------------------------
// Requirement 8: Use focus areas to prioritize relevant questions
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 8: Focus Areas Prioritization ---');
const configFocus = {
    role: 'Full Stack Developer',
    type: 'Technical',
    difficulty: 'Easy',
    gaps: ['SQL'],
};
const resultFocus = selectQuestions(configFocus, 'session-focus-sql');
// The first question should match the focus area
const firstQuestion = resultFocus.questions[0];
const focusScoreFirst = calculateFocusScore(firstQuestion, ['SQL']);
const nonFocusQuestions = resultFocus.questions.filter((q) => calculateFocusScore(q, ['SQL']) === 0);
assert(firstQuestion.category.toLowerCase().includes('sql') || focusScoreFirst >= 40, 'Questions matching focus area "SQL" are prioritized first', `First question: ${firstQuestion.id} (${firstQuestion.category}) score: ${focusScoreFirst}`);
// -----------------------------------------------------------------
// Constraint: Do not use random questions unrelated to the selected role
// -----------------------------------------------------------------
console.log('\n--- Testing Constraint: Role Relevance Strictness ---');
const targetRoles = [
    'Data Analyst',
    'Frontend Developer',
    'Backend Developer',
    'Java Developer',
    'Python Developer',
    'Software Engineer',
    'Full Stack Developer',
];
let allRoleRelevanceStrict = true;
for (const role of targetRoles) {
    const res = selectQuestions({
        role,
        type: 'Technical',
        difficulty: 'Medium',
        gaps: [],
    });
    for (const q of res.questions) {
        if (!isRelevantToRole(q, role)) {
            allRoleRelevanceStrict = false;
            console.error(`Question ${q.id} (roles: ${JSON.stringify(q.role)}) is unrelated to role ${role}`);
        }
    }
}
assert(allRoleRelevanceStrict, 'Zero questions unrelated to the selected role are ever selected');
// -----------------------------------------------------------------
// Requirement 10: Empty-state handling
// -----------------------------------------------------------------
console.log('\n--- Testing Requirement 10: Empty-State Handling ---');
const impossibleConfig = {
    role: 'Astronaut Pilot', // Non-existent role
    type: 'Technical',
    difficulty: 'Hard',
    gaps: [],
};
const emptyResult = selectQuestions(impossibleConfig, 'session-empty');
assert(emptyResult.questions.length === 0, 'Returns empty question array when no questions match the role');
assert(emptyResult.totalAvailable === 0, 'Returns totalAvailable = 0 for empty match');
assert(typeof emptyResult.emptyReason === 'string' && emptyResult.emptyReason.length > 0, 'Provides descriptive emptyReason', `emptyReason: "${emptyResult.emptyReason}"`);
const countZero = getAvailableCount({ role: 'NonExistentRole' });
assert(countZero === 0, 'getAvailableCount returns 0 for non-existent role');
// -----------------------------------------------------------------
// Summary
// -----------------------------------------------------------------
console.log('\n========================================================');
console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log('========================================================');
if (failed > 0) {
    process.exit(1);
}
else {
    process.exit(0);
}
