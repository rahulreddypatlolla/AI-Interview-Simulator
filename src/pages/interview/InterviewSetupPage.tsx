
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Briefcase,
  Play,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { getAvailableCount } from '../../engine/questionEngine';

type InterviewVoice = 'male' | 'female';
type InterviewSource = 'profile' | 'job_post';
type InterviewType = 'Technical' | 'Behavioral' | 'HR' | 'Mixed';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

const skillOptions = [
  'Data structures',
  'Algorithms',
  'Communication',
  'SQL',
  'Java',
  'Python',
  'React',
  'Problem solving',
  'System design',
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();

  // 1. Initialize settings from sessionStorage if previously saved
  const storedConfig = (() => {
    try {
      const raw = sessionStorage.getItem('activePractice');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [interviewerVoice, setInterviewerVoice] = useState<InterviewVoice>(
    storedConfig?.voice === 'male' || storedConfig?.voice === 'female'
      ? storedConfig.voice
      : 'female'
  );

  const [selectedSource, setSelectedSource] = useState<InterviewSource>(
    storedConfig?.source === 'profile' || storedConfig?.source === 'job_post'
      ? storedConfig.source
      : 'profile'
  );

  const [selectedGaps, setSelectedGaps] = useState<string[]>(
    Array.isArray(storedConfig?.gaps) && storedConfig.gaps.length > 0
      ? storedConfig.gaps
      : [
          'Data structures',
          'Algorithms',
          'Communication',
          'SQL',
        ]
  );

  const [selectedRole, setSelectedRole] = useState(
    typeof storedConfig?.role === 'string' && storedConfig.role.trim()
      ? storedConfig.role
      : 'Full Stack Developer'
  );

  const [selectedType, setSelectedType] = useState<InterviewType>(
    ['Technical', 'Behavioral', 'HR', 'Mixed'].includes(storedConfig?.type)
      ? storedConfig.type
      : 'Technical'
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(
    ['Easy', 'Medium', 'Hard'].includes(storedConfig?.difficulty)
      ? storedConfig.difficulty
      : 'Medium'
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleGap = (gap: string) => {
    setValidationError(null);
    setSelectedGaps((previous) =>
      previous.includes(gap)
        ? previous.filter((item) => item !== gap)
        : [...previous, gap]
    );
  };

  const handleRoleChange = (role: string) => {
    setValidationError(null);
    setSelectedRole(role);
  };

  const handleTypeChange = (type: InterviewType) => {
    setValidationError(null);
    setSelectedType(type);
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setValidationError(null);
    setSelectedDifficulty(difficulty);
  };

  const handleSourceChange = (source: InterviewSource) => {
    setValidationError(null);
    setSelectedSource(source);
  };

  const handleVoiceChange = (voice: InterviewVoice) => {
    setValidationError(null);
    setInterviewerVoice(voice);
  };

  const handleStartInterview = () => {
    // 5. Proper validation before starting an interview
    if (!selectedRole || !selectedRole.trim()) {
      setValidationError('Please select a target role before starting.');
      return;
    }

    if (!['Technical', 'Behavioral', 'HR', 'Mixed'].includes(selectedType)) {
      setValidationError('Please select a valid interview type.');
      return;
    }

    if (!['Easy', 'Medium', 'Hard'].includes(selectedDifficulty)) {
      setValidationError('Please select a valid difficulty level.');
      return;
    }

    if (!['profile', 'job_post'].includes(selectedSource)) {
      setValidationError('Please select a preparation source.');
      return;
    }

    if (!['female', 'male'].includes(interviewerVoice)) {
      setValidationError('Please select an interviewer voice.');
      return;
    }

    if (!selectedGaps || selectedGaps.length === 0) {
      setValidationError('Please select at least one focus area to practice.');
      return;
    }

    const availableCount = getAvailableCount({
      role: selectedRole,
      type: selectedType,
      difficulty: selectedDifficulty,
    });

    if (availableCount === 0) {
      setValidationError('No questions are currently available for this combination. Please adjust the role, difficulty, or interview type.');
      return;
    }

    setValidationError(null);

    const sessionId = `INT-${Date.now()}`;

    const config = {
      sessionId,
      role: selectedRole,
      type: selectedType,
      difficulty: selectedDifficulty,
      voice: interviewerVoice,
      source: selectedSource,
      gaps: selectedGaps,
      createdAt: new Date().toISOString(),
    };

    // 1. All interview settings stored in sessionStorage (global active & session-specific)
    sessionStorage.setItem('activePractice', JSON.stringify(config));
    sessionStorage.setItem(`practiceConfig-${sessionId}`, JSON.stringify(config));

    // 2. Direct to Pre-Interview Permissions & Proctoring verification
    navigate(`/interview/${sessionId}/permissions`, {
      state: config,
    });
  };


  return (
    <div className="interview-setup-page">
      <header className="setup-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="setup-brand">
          <Sparkles size={22} />
          <span>CareerVerse</span>
        </div>
      </header>

      <main className="setup-container">
        <div className="setup-heading">
          <span className="setup-eyebrow">PERSONALIZED PRACTICE</span>
          <h1>Set up your interview</h1>
          <p>
            Customize your interview session according to your career goals.
          </p>
        </div>

        <section className="source-section">
          <h2>Interview preferences</h2>

          <div className="setup-field">
            <label htmlFor="role">Target role</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(event) => handleRoleChange(event.target.value)}
            >
              <option>Full Stack Developer</option>
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Java Developer</option>
              <option>Python Developer</option>
              <option>Software Engineer</option>
              <option>Data Analyst</option>
            </select>
          </div>

          <div className="setup-field">
            <label htmlFor="type">Interview type</label>
            <select
              id="type"
              value={selectedType}
              onChange={(event) =>
                handleTypeChange(event.target.value as InterviewType)
              }
            >
              <option value="Technical">Technical</option>
              <option value="Behavioral">Behavioral</option>
              <option value="HR">HR</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div className="setup-field">
            <label htmlFor="difficulty">Difficulty level</label>
            <select
              id="difficulty"
              value={selectedDifficulty}
              onChange={(event) =>
                handleDifficultyChange(event.target.value as Difficulty)
              }
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {(() => {
            const count = getAvailableCount({
              role: selectedRole,
              type: selectedType,
              difficulty: selectedDifficulty,
            });
            return (
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: count > 0 ? '#10b981' : '#f59e0b',
                  fontWeight: 500,
                }}
              >
                {count > 0 ? (
                  <>
                    <CheckCircle size={14} />
                    <span>{count} questions available for this configuration</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>No questions available for this specific combination</span>
                  </>
                )}
              </div>
            );
          })()}
        </section>

        <section className="source-section">
          <h2>Choose your preparation source</h2>
          <p>Select the information you want to use for this interview.</p>

          <div className="setup-options">
            <button
              type="button"
              className={`setup-option ${selectedSource === 'profile' ? 'active' : ''
                }`}
              onClick={() => handleSourceChange('profile')}
            >
              <User size={22} />
              <span>My Profile</span>
              <small>Use your profile and skills</small>
            </button>

            <button
              type="button"
              className={`setup-option ${selectedSource === 'job_post' ? 'active' : ''
                }`}
              onClick={() => handleSourceChange('job_post')}
            >
              <Briefcase size={22} />
              <span>Job Description</span>
              <small>Practice for a target job</small>
            </button>
          </div>
        </section>

        <section className="source-section">
          <h2>Focus areas</h2>
          <p>Select the skills you want to practice.</p>

          <div className="skill-options">
            {skillOptions.map((gap) => (
              <button
                type="button"
                key={gap}
                className={`skill-chip ${selectedGaps.includes(gap) ? 'active' : ''
                  }`}
                onClick={() => toggleGap(gap)}
              >
                {gap}
              </button>
            ))}
          </div>
        </section>

        <section className="source-section">
          <h2>Interviewer voice</h2>

          <div className="setup-options">
            <button
              type="button"
              className={`setup-option ${interviewerVoice === 'female' ? 'active' : ''
                }`}
              onClick={() => handleVoiceChange('female')}
            >
              <User size={22} />
              <span>Female voice</span>
            </button>

            <button
              type="button"
              className={`setup-option ${interviewerVoice === 'male' ? 'active' : ''
                }`}
              onClick={() => handleVoiceChange('male')}
            >
              <User size={22} />
              <span>Male voice</span>
            </button>
          </div>
        </section>

        {validationError && (
          <div className="setup-validation-error" role="alert">
            <AlertCircle size={18} />
            <span>{validationError}</span>
          </div>
        )}

        <button
          type="button"
          className="start-interview-button"
          onClick={handleStartInterview}
        >
          <Play size={18} />
          Start Interview
        </button>
      </main>
    </div>
  );
}
