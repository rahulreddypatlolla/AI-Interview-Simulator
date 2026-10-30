
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  CalendarDays,
  Plus,
  Printer,
  ChevronDown,
} from 'lucide-react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  fetchSessionDetail,
  fetchUserSessions,
  type StoredSessionResult,
} from '../../services/interviewStorageService'
import type { AnswerEvaluation } from '../../types'

type PracticeResult = {
  sessionId: string
  config?: {
    role?: string
    voice?: string
    source?: string
    gaps?: string[]
    type?: string
    difficulty?: string
  }
  answers: string[]
  evaluations?: AnswerEvaluation[]
  totalQuestions: number
  answeredQuestions: number
  reviewedQuestions: number
  averageScore: number
  completed: boolean
  completedAt?: string
  fullscreenExitCount?: number
  screenSharingStatus?: string
  submissionReason?: string
  status?: string
  followUps?: Record<number, any[]>
}

export default function Reports() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [saved, setSaved] = useState<PracticeResult | null>(null)
  const [allSessions, setAllSessions] = useState<StoredSessionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRealUser = Boolean(
    user && isSupabaseConfigured && user.id && user.id !== 'demo-user-1'
  )

  const loadData = useCallback(async () => {
    // 1. Fetch user's session list in background for previous reports index & switcher
    if (isRealUser && user) {
      fetchUserSessions(user.id).then((res) => {
        if (res.sessions) setAllSessions(res.sessions)
      }).catch(() => {})
    }

    if (!sessionId) {
      // Navigated to /reports directly
      if (isRealUser && user) {
        setLoading(true)
        setError(null)
        try {
          const res = await fetchUserSessions(user.id)
          if (res.error) {
            setError(res.error)
          } else {
            setAllSessions(res.sessions || [])
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sessions.')
        } finally {
          setLoading(false)
        }
      }
      return
    }

    // 2. Loading a specific report
    // Check if the currently loaded report matches the requested sessionId
    if (saved && saved.sessionId === sessionId) return

    // Check location.state from recent navigation
    if (location.state && (location.state as any).result?.sessionId === sessionId) {
      setSaved((location.state as any).result)
      return
    }

    // Check sessionStorage
    try {
      const fromSession = sessionStorage.getItem(`practiceResult-${sessionId}`)
      if (fromSession) {
        const parsed = JSON.parse(fromSession)
        if (parsed.sessionId === sessionId) {
          setSaved(parsed)
          return
        }
      }
    } catch {
      // ignore
    }

    // Fetch from Supabase with user ownership validation
    if (isRealUser && user) {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchSessionDetail(sessionId, user.id)
        if (res.error || !res.session) {
          setError(
            'Report not found or access denied. You can only access your own completed interview reports.'
          )
          setSaved(null)
        } else {
          const session = res.session
          const reconstructed: PracticeResult = {
            sessionId: session.id,
            config: {
              role: session.role,
              type: session.type,
              difficulty: session.difficulty,
              voice: session.voice,
              source: session.source,
              gaps: session.focusAreas,
            },
            answers: res.answers || [],
            evaluations: res.evaluations || [],
            totalQuestions: session.totalQuestions,
            answeredQuestions: session.answeredQuestions,
            reviewedQuestions: session.reviewedQuestions,
            averageScore: session.averageScore,
            completed: session.completed,
            completedAt: session.completedAt,
          }
          setSaved(reconstructed)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching report from Supabase.')
        setSaved(null)
      } finally {
        setLoading(false)
      }
      return
    }

    // Fallback to local history for offline/demo mode
    try {
      const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
      if (Array.isArray(history)) {
        const found = history.find(
          (i: any) => i.sessionId === sessionId || i.id === sessionId
        )
        if (found) {
          setSaved(found)
          return
        }
      }
    } catch {
      // ignore
    }

    setError('Report not found. No saved practice report exists for this session.')
    setSaved(null)
  }, [sessionId, saved, isRealUser, user, location.state])

  useEffect(() => {
    loadData()
  }, [loadData])

  // List of previous reports for switcher and index
  const previousReportsList = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        role: string
        type: string
        difficulty: string
        score: number
        date: string
      }
    >()

    // 1. Supabase sessions
    for (const s of allSessions) {
      if (s.id) {
        map.set(s.id, {
          id: s.id,
          role: s.role || 'Practice Interview',
          type: s.type || 'Mixed',
          difficulty: s.difficulty || 'Medium',
          score: s.averageScore ?? 0,
          date: s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-IN') : 'Recently',
        })
      }
    }

    // 2. Local development / immediate history
    try {
      const localHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
      if (Array.isArray(localHistory)) {
        for (const s of localHistory) {
          const sid = s.sessionId || s.id
          if (sid && !map.has(sid)) {
            map.set(sid, {
              id: sid,
              role: s.config?.role || s.role || 'Practice Interview',
              type: s.config?.type || s.type || 'Mixed',
              difficulty: s.config?.difficulty || s.difficulty || 'Medium',
              score: s.averageScore ?? 0,
              date: s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-IN') : 'Recently',
            })
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Any active sessionStorage practiceResult
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k?.startsWith('practiceResult-')) {
          const item = JSON.parse(sessionStorage.getItem(k) || '{}')
          const sid = item.sessionId || item.id
          if (sid && !map.has(sid)) {
            map.set(sid, {
              id: sid,
              role: item.config?.role || item.role || 'Practice Interview',
              type: item.config?.type || item.type || 'Mixed',
              difficulty: item.config?.difficulty || item.difficulty || 'Medium',
              score: item.averageScore ?? 0,
              date: item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-IN') : 'Recently',
            })
          }
        }
      }
    } catch {
      // ignore
    }

    return Array.from(map.values())
  }, [allSessions])

  if (loading) {
    return (
      <div className="page-stack">
        <div className="back-line">
          <Link to="/progress">
            <ArrowLeft size={15} /> Back to progress
          </Link>
        </div>
        <section className="panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 1rem', color: '#3b82f6' }} />
          <h3>Loading interview report from Supabase...</h3>
          <p style={{ color: 'var(--text-muted, #888)' }}>
            Retrieving questions, submitted answers, and multi-dimensional AI evaluations.
          </p>
        </section>
      </div>
    )
  }

  if (error && !saved) {
    return (
      <div className="page-stack">
        <div className="back-line">
          <Link to="/progress">
            <ArrowLeft size={15} /> Back to progress
          </Link>
        </div>
        <section className="panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <h3>Access Denied or Report Not Found</h3>
          <p style={{ color: '#ef4444', marginBottom: '1.5rem', maxWidth: '480px', marginInline: 'auto' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link className="button button-primary" to="/reports">
              View Your Reports
            </Link>
            <button
              onClick={() => loadData()}
              className="secondary-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </section>
      </div>
    )
  }

  // Reports index view when navigated to /reports directly
  if (!sessionId && !saved) {
    return (
      <div className="page-stack">
        <div className="page-heading">
          <p className="eyebrow">SAVED EVALUATIONS</p>
          <h1>Interview Reports</h1>
          <p className="page-subtitle">
            Review detailed feedback, AI evaluations, and outlines for all completed practice sessions.
          </p>
        </div>

        {previousReportsList.length > 0 ? (
          <section className="panel">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>INTERVIEW ROLE</th>
                    <th>TYPE</th>
                    <th>DIFFICULTY</th>
                    <th>DATE</th>
                    <th>SCORE</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {previousReportsList.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <div className="interview-name">
                          <div className="role-icon">
                            <CalendarDays size={16} />
                          </div>
                          <div>
                            <strong>{session.role}</strong>
                            <span>{session.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="type-chip">{session.type}</span>
                      </td>
                      <td>
                        <span className="type-chip">{session.difficulty}</span>
                      </td>
                      <td className="muted-cell">{session.date}</td>
                      <td>
                        <strong className="score-number">{session.score}/100</strong>
                      </td>
                      <td>
                        <Link
                          className="button button-primary"
                          to={`/reports/${session.id}`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          View Report <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <FolderOpen size={42} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3>No reports available</h3>
            <p style={{ color: 'var(--text-muted, #888)', marginBottom: '1.5rem' }}>
              Complete a mock interview session to generate your comprehensive AI performance report.
            </p>
            <Link
              className="button button-primary"
              to="/interview/setup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Start an interview
            </Link>
          </section>
        )}
      </div>
    )
  }

  if (!saved) {
    return (
      <div className="page-stack">
        <div className="back-line">
          <Link to="/progress">
            <ArrowLeft size={15} /> Back to progress
          </Link>
        </div>

        <section className="panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3>Report not found</h3>
          <p style={{ color: 'var(--text-muted, #888)', marginBottom: '1.5rem', maxWidth: '480px', marginInline: 'auto' }}>
            No saved practice report exists for session identifier <code>{sessionId}</code>.
            Complete an interview to generate an evaluation report.
          </p>

          <Link className="button button-primary" to="/interview/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Start a practice session
          </Link>
        </section>
      </div>
    )
  }

  const role = saved.config?.role || 'Practice Interview'
  const answers = saved.answers || []
  const evaluations = saved.evaluations || []
  const score = saved.averageScore ?? 0
  const completed = saved.completed

  const answeredQuestions =
    saved.answeredQuestions ??
    answers.filter((answer) => answer.trim().length > 0).length

  const totalQuestions = saved.totalQuestions ?? answers.length

  const completedDate = saved.completedAt
    ? new Date(saved.completedAt).toLocaleString()
    : 'Date unavailable'

  const exportTxt = () => {
    const content = [
      '====================================================================',
      'CAREERVERSE AI INTERVIEW SIMULATOR — CANDIDATE EVALUATION REPORT',
      '====================================================================',
      '',
      `Role:                   ${role}`,
      `Interview Type:         ${saved.config?.type || 'Technical'}`,
      `Difficulty:             ${saved.config?.difficulty || 'Medium'}`,
      `Interviewer Voice:      ${saved.config?.voice === 'female' ? 'Female voice' : 'Male voice'}`,
      `Preparation Source:     ${saved.config?.source === 'job_post' ? 'Job Description' : 'Profile'}`,
      `Focus Areas:            ${saved.config?.gaps?.join(', ') || 'General'}`,
      `Session ID:             ${sessionId || saved.sessionId}`,
      `Completion Date:        ${completedDate}`,
      `Interview Status:       ${saved.status || (completed ? 'Completed' : 'Incomplete')}`,
      `Submission Reason:      ${saved.submissionReason || (completed ? 'Normal submission' : 'Candidate ended interview')}`,
      `Fullscreen Violations:  ${saved.fullscreenExitCount ?? 0}`,
      `Screen Sharing:         ${saved.screenSharingStatus || 'Active during interview'}`,
      `Overall Score:          ${score}/100`,
      `Questions Answered:     ${answeredQuestions}/${totalQuestions}`,
      '',
      '====================================================================',
      'CORE EVALUATION METRICS',
      '====================================================================',
      ...metrics.map((m) => `• ${m.label.padEnd(30)}: ${m.value}%`),
      '',
      '====================================================================',
      'DETAILED QUESTION-BY-QUESTION EVALUATION',
      '====================================================================',
      '',
      ...evaluations.map((item, index) =>
        [
          `--------------------------------------------------------------------`,
          `QUESTION ${index + 1} (${item.category}${item.isFollowUp ? ' — AI DYNAMIC FOLLOW-UP' : ' — MAIN QUESTION'}): ${item.score}/100`,
          `Evaluated By: ${item.evaluatedBy === 'ai' ? 'AI Evaluation' : 'Offline Fallback'}`,
          `--------------------------------------------------------------------`,
          `PROMPT:`,
          `  ${item.question}`,
          '',
          `CANDIDATE SUBMITTED ANSWER:`,
          `  ${item.answer.trim() || 'No answer submitted.'}`,
          '',
          `SUB-SCORES & FEEDBACK:`,
          item.technicalCorrectness
            ? `  - Technical Correctness (${item.technicalCorrectness.score}/100): ${item.technicalCorrectness.feedback}`
            : '',
          item.communication
            ? `  - Communication & Structure (${item.communication.score}/100): ${item.communication.feedback}`
            : '',
          item.problemSolving
            ? `  - Problem Solving & Trade-offs (${item.problemSolving.score}/100): ${item.problemSolving.feedback}`
            : '',
          '',
          item.strengths?.length ? `STRENGTHS:\n  • ${item.strengths.join('\n  • ')}` : '',
          item.weaknesses?.length
            ? `WEAKNESSES & MISSING CONCEPTS:\n  • ${item.weaknesses.join('\n  • ')}`
            : '',
          item.improvements?.length
            ? `SPECIFIC IMPROVEMENT SUGGESTIONS:\n  • ${item.improvements.join('\n  • ')}`
            : '',
          item.idealAnswerOutline?.length
            ? `IDEAL ANSWER OUTLINE:\n  • ${item.idealAnswerOutline.join('\n  • ')}`
            : '',
          '',
        ]
          .filter(Boolean)
          .join('\n')
      ),
      '====================================================================',
      'END OF REPORT',
      '====================================================================',
    ].join('\n')

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `interview-report-${sessionId || saved.sessionId}.txt`
    link.click()

    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    window.print()
  }

  const metrics = [
    {
      label: 'Technical correctness',
      value: evaluations.length
        ? Math.round(
          evaluations.reduce(
            (sum, item) => sum + (item.technicalCorrectness?.score ?? item.score),
            0
          ) / evaluations.length
        )
        : 0,
    },
    {
      label: 'Communication & structure',
      value: evaluations.length
        ? Math.round(
          evaluations.reduce(
            (sum, item) => sum + (item.communication?.score ?? item.score),
            0
          ) / evaluations.length
        )
        : 0,
    },
    {
      label: 'Problem solving & trade-offs',
      value: evaluations.length
        ? Math.round(
          evaluations.reduce(
            (sum, item) => sum + (item.problemSolving?.score ?? item.score),
            0
          ) / evaluations.length
        )
        : 0,
    },
    {
      label: 'Overall consistency',
      value: score,
    },
  ]

  const nextSteps = [
    {
      title: 'Use a repeatable structure',
      description:
        'For experience questions, try Situation → Task → Action → Result.',
    },
    {
      title: 'Make your contribution clear',
      description:
        'Explain what you personally decided, implemented, or learned.',
    },
    {
      title: 'Practise with evidence',
      description:
        'Include a test, measurable outcome, or concrete example when possible.',
    },
  ]

  return (
    <div className="page-stack">
      {/* Print PDF document styling */}
      <style>{`
        @media print {
          nav, aside, .back-line, .report-bottom-cta, .no-print, button {
            display: none !important;
          }
          body, .page-stack {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .report-banner {
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
            page-break-inside: avoid;
          }
          .panel, .answer-review-item {
            page-break-inside: avoid;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
          @page {
            margin: 14mm 12mm;
            size: auto;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="back-line no-print">
        <Link to="/progress">
          <ArrowLeft size={15} /> Back to progress
        </Link>
      </div>

      <section className="report-heading">
        <div>
          <p className="eyebrow">SESSION SUMMARY</p>
          <h1>Interview report</h1>
          <p className="page-subtitle">
            {role} · {completedDate} · {sessionId || saved.sessionId}
          </p>

          <div
            className="report-config-badges"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '10px',
            }}
          >
            {saved.config?.type && (
              <span className="type-chip">{saved.config.type}</span>
            )}
            {saved.config?.difficulty && (
              <span className="type-chip">{saved.config.difficulty}</span>
            )}
            {saved.config?.voice && (
              <span className="type-chip">
                {saved.config.voice === 'female'
                  ? 'Female voice'
                  : 'Male voice'}
              </span>
            )}
            {saved.config?.source && (
              <span className="type-chip">
                {saved.config.source === 'job_post'
                  ? 'Job Description'
                  : 'My Profile'}
              </span>
            )}
            {saved.status && (
              <span
                className="type-chip"
                style={{
                  background: saved.status === 'Completed' ? '#dcfce7' : '#fee2e2',
                  color: saved.status === 'Completed' ? '#15803d' : '#b91c1c',
                  fontWeight: 700,
                }}
              >
                {saved.status}
              </span>
            )}
            {saved.submissionReason && (
              <span
                className="type-chip"
                style={{
                  background: saved.submissionReason === 'Fullscreen violation' ? '#fef3c7' : '#f1f5f9',
                  color: saved.submissionReason === 'Fullscreen violation' ? '#b45309' : '#475569',
                }}
              >
                Reason: {saved.submissionReason}
              </span>
            )}
            {saved.fullscreenExitCount !== undefined && (
              <span
                className="type-chip"
                style={{
                  background: saved.fullscreenExitCount > 0 ? '#fee2e2' : '#f1f5f9',
                  color: saved.fullscreenExitCount > 0 ? '#b91c1c' : '#64748b',
                }}
              >
                Fullscreen Exits: {saved.fullscreenExitCount}
              </span>
            )}
            {saved.config?.gaps &&
              saved.config.gaps.map((gap) => (
                <span
                  key={gap}
                  className="type-chip"
                  style={{
                    background: '#f0f1ff',
                    color: '#626fd0',
                    borderColor: '#e0e3fa',
                  }}
                >
                  {gap}
                </span>
              ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="no-print">
          <button
            className="button button-secondary"
            onClick={exportTxt}
            title="Download formatted text report"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Export TXT
          </button>
          <button
            className="button button-primary"
            onClick={exportPdf}
            title="Print or save as PDF document"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Export PDF
          </button>
        </div>
      </section>

      {/* Switch between previous interview reports */}
      {previousReportsList.length > 1 && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--card-bg, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            marginBottom: '1rem',
            fontSize: '13px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
            Previous reports:
          </span>
          <select
            value={sessionId || saved.sessionId}
            onChange={(e) => navigate(`/reports/${e.target.value}`)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-primary, #ffffff)',
              color: 'inherit',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              flex: '1',
              maxWidth: '460px',
            }}
          >
            {previousReportsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.role} ({s.type} · {s.difficulty}) — {s.date} — {s.score}/100
              </option>
            ))}
          </select>
          <Link
            to="/reports"
            style={{
              marginLeft: 'auto',
              color: '#6574d9',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            All Reports ({previousReportsList.length}) →
          </Link>
        </div>
      )}

      <div className="report-banner">
        <div className="report-score-ring">
          <div>
            <strong>{score}</strong>
            <span>out of 100</span>
          </div>
        </div>

        <div className="report-banner-copy">
          <span className="report-status">
            <span />
            {completed ? 'PRACTICE COMPLETE' : 'PRACTICE INCOMPLETE'}
          </span>

          <h2>
            {score >= 80
              ? 'A solid session. Keep building on it.'
              : 'A useful starting point for your next attempt.'}
          </h2>

          <p>
            {evaluations.some((e) => e.evaluatedBy === 'ai')
              ? 'This report provides a comprehensive AI-powered evaluation of your technical accuracy, communication clarity, and problem-solving method.'
              : 'This report summarizes your evaluated interview performance, answer feedback, and recommended improvement outlines.'}
          </p>
        </div>

        <div className="report-banner-stat">
          <span>
            <TrendingUp size={16} /> Questions answered
          </span>
          <strong>
            {answeredQuestions}
            <small> / {totalQuestions}</small>
          </strong>
        </div>
      </div>

      <div className="report-grid">
        <section className="panel report-card">
          <div className="panel-heading">
            <div>
              <h3>Performance overview</h3>
              <p>Areas to reflect on after this session</p>
            </div>
            <Target size={18} className="panel-heading-icon" />
          </div>

          <div className="report-metric-list">
            {metrics.map((metric) => (
              <Metric
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>

          <div className="report-disclaimer">
            {evaluations.some((e) => e.evaluatedBy === 'ai')
              ? 'Scores reflect multi-dimensional AI answer evaluations based on technical correctness, clarity of communication, and problem-solving method.'
              : 'These indicators summarize your evaluated practice results across key interview competency dimensions.'}
          </div>
        </section>

        <section className="panel report-card">
          <div className="panel-heading">
            <div>
              <h3>Your next steps</h3>
              <p>Make the next session count</p>
            </div>
            <Lightbulb size={18} className="panel-heading-icon" />
          </div>

          {nextSteps.map((step, index) => (
            <div className="next-step" key={step.title}>
              <span className="next-step-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {evaluations.length > 0 && (
        <section className="panel answer-review-panel">
          <div className="panel-heading">
            <div>
              <h3>Detailed answer evaluation</h3>
              <p>Question-wise scores and feedback from your session</p>
            </div>
            <FileText size={18} className="panel-heading-icon" />
          </div>

          {evaluations.map((item, index) => (
            <div className="answer-review-item" key={item.questionId || index}>
              <div className="answer-review-heading">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>
                    {item.isFollowUp
                      ? `AI Follow-up: ${item.category}`
                      : `Question ${index + 1}: ${item.category}`}
                  </strong>
                  {item.isFollowUp && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                      }}
                    >
                      Dynamic Follow-up Question
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      background: item.evaluatedBy === 'ai' ? '#ecfdf5' : '#fffbeb',
                      color: item.evaluatedBy === 'ai' ? '#047857' : '#b45309',
                      border: `1px solid ${item.evaluatedBy === 'ai' ? '#a7f3d0' : '#fde68a'}`,
                    }}
                  >
                    {item.evaluatedBy === 'ai' ? '✨ AI Evaluation' : '⚠️ Offline Fallback'}
                  </span>
                </div>
                <span>{item.score}/100</span>
              </div>

              <p className="report-question">{item.question}</p>

              <div className="report-answer">
                <strong>Your answer</strong>
                <p>{item.answer.trim() || 'No answer submitted.'}</p>
              </div>

              {/* Sub-scores breakdown */}
              {item.technicalCorrectness && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    margin: '14px 0',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      <span>Technical Correctness</span>
                      <span>{item.technicalCorrectness.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                      {item.technicalCorrectness.feedback}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      <span>Communication &amp; Structure</span>
                      <span>{item.communication.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                      {item.communication.feedback}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      <span>Problem Solving &amp; Trade-offs</span>
                      <span>{item.problemSolving.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                      {item.problemSolving.feedback}
                    </p>
                  </div>
                </div>
              )}

              {item.strengths?.length > 0 && (
                <div className="report-feedback">
                  <strong>Strengths</strong>
                  <ul>
                    {item.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.weaknesses && item.weaknesses.length > 0 && (
                <div className="report-feedback">
                  <strong>Weaknesses &amp; Missing Concepts</strong>
                  <ul>
                    {item.weaknesses.map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.improvements?.length > 0 && (
                <div className="report-feedback">
                  <strong>Specific Improvement Suggestions</strong>
                  <ul>
                    {item.improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.idealAnswerOutline && item.idealAnswerOutline.length > 0 && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <b style={{ display: 'block', marginBottom: '6px', color: '#166534', fontSize: '12px' }}>
                    💡 Ideal Answer Outline:
                  </b>
                  {item.idealAnswerOutline.map((point, pIdx) => (
                    <p key={pIdx} style={{ margin: '3px 0', fontSize: '11px', color: '#14532d', lineHeight: 1.5 }}>
                      {point.startsWith('•') || /^\d+\./.test(point) ? point : `• ${point}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {answers.length > 0 && evaluations.length === 0 && (
        <section className="panel answer-review-panel">
          <div className="panel-heading">
            <div>
              <h3>Answer review</h3>
              <p>Your saved responses from this browser session</p>
            </div>
            <FileText size={18} className="panel-heading-icon" />
          </div>

          {answers.map((answer, index) => (
            <div className="answer-review-item" key={index}>
              <strong>Answer {index + 1}</strong>
              <p>{answer.trim() || 'No answer submitted.'}</p>
            </div>
          ))}
        </section>
      )}

      <div className="report-bottom-cta">
        <div>
          <h3>Ready for another round?</h3>
          <p>
            Use one of your next steps as the focus for your next practice
            session.
          </p>
        </div>

        <Link className="button button-primary" to="/interview/setup">
          Set up another interview <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className="report-metric">
      <div>
        <span>{label}</span>
        <strong>{safeValue}%</strong>
      </div>
      <div className="skill-track">
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}
