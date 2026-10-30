
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Plus,
  Code2,
  MessageSquare,
  Brain,
  CheckCircle2,
} from 'lucide-react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  fetchUserSessions,
  fetchUserProgress,
  fetchUserEvaluationMetrics,
  type StoredSessionResult,
  type UserProgressRecord,
  type EvaluationAspectMetrics,
} from '../../services/interviewStorageService'

type Evaluation = {
  category: string
  score: number
  strengths?: string[]
  improvements?: string[]
}

type PracticeResult = {
  sessionId: string
  config?: {
    role?: string
    type?: string
  }
  evaluations?: Evaluation[]
  averageScore?: number
  answeredQuestions?: number
  totalQuestions?: number
  completed: boolean
  completedAt?: string
}

type ProgressSession = {
  id: string
  role: string
  date: string
  sortDate: number
  type: string
  score: number
}

function getSavedResults(): PracticeResult[] {
  const results: PracticeResult[] = []
  const seenIds = new Set<string>()

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)

      if (!key?.startsWith('practiceResult-')) continue

      const result = JSON.parse(
        sessionStorage.getItem(key) || 'null'
      ) as PracticeResult | null

      if (result?.completed && result.sessionId && !seenIds.has(result.sessionId)) {
        seenIds.add(result.sessionId)
        results.push(result)
      }
    }
  } catch (error) {
    console.error('Unable to load practice history:', error)
  }

  try {
    const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
    if (Array.isArray(history)) {
      for (const item of history) {
        const sid = item.sessionId || item.id
        if (item.completed && sid && !seenIds.has(sid)) {
          seenIds.add(sid)
          results.push(item as PracticeResult)
        }
      }
    }
  } catch (error) {
    console.error('Unable to load localStorage practiceHistory:', error)
  }

  return results.sort(
    (a, b) =>
      new Date(a.completedAt || 0).getTime() -
      new Date(b.completedAt || 0).getTime()
  )
}

function getSkillProgress(results: PracticeResult[]) {
  const grouped: Record<string, number[]> = {}

  results.forEach((result) => {
    result.evaluations?.forEach((item) => {
      const category = item.category || 'General'

      if (!grouped[category]) {
        grouped[category] = []
      }

      grouped[category].push(item.score)
    })
  })

  return Object.entries(grouped).map(([skill, scores]) => ({
    skill,
    score: Math.round(
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length
    ),
  }))
}

export default function Progress() {
  const { user } = useAuth()
  const [supabaseSessions, setSupabaseSessions] = useState<StoredSessionResult[]>([])
  const [supabaseProgress, setSupabaseProgress] = useState<UserProgressRecord[]>([])
  const [aspectMetrics, setAspectMetrics] = useState<EvaluationAspectMetrics>({
    technicalAverage: 0,
    communicationAverage: 0,
    problemSolvingAverage: 0,
    totalEvaluations: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isRealUser = Boolean(
    user && isSupabaseConfigured && user.id && user.id !== 'demo-user-1'
  )

  const loadData = useCallback(async () => {
    if (!isRealUser || !user) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const [sessionsRes, progressRes, evalMetricsRes] = await Promise.all([
        fetchUserSessions(user.id),
        fetchUserProgress(user.id),
        fetchUserEvaluationMetrics(user.id),
      ])

      if (sessionsRes.error) {
        setLoadError(sessionsRes.error)
      } else {
        setSupabaseSessions(sessionsRes.sessions || [])
      }

      if (progressRes.progress) {
        setSupabaseProgress(progressRes.progress)
      }

      if (evalMetricsRes.metrics) {
        setAspectMetrics(evalMetricsRes.metrics)
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load progress records.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [user, isRealUser])

  useEffect(() => {
    loadData()
  }, [loadData])

  const savedResults = getSavedResults()

  // Merge Supabase sessions with any immediately completed local sessions for instant chart update
  const history: ProgressSession[] = useMemo(() => {
    const sessionMap = new Map<string, ProgressSession>()

    // 1. Supabase sessions
    for (const s of supabaseSessions) {
      if (s.completed && s.id) {
        const date = s.completedAt
          ? new Date(s.completedAt)
          : s.createdAt
          ? new Date(s.createdAt)
          : null
        sessionMap.set(s.id, {
          id: s.id,
          role: s.role || 'Practice Interview',
          date:
            date && !Number.isNaN(date.getTime())
              ? date.toLocaleDateString('en-IN')
              : 'Recently',
          sortDate: date && !Number.isNaN(date.getTime()) ? date.getTime() : 0,
          type: s.type || 'Mixed',
          score: s.averageScore || 0,
        })
      }
    }

    // 2. Local sessions (ensuring newly finished interview updates immediately)
    for (const local of savedResults) {
      if (local.completed && local.sessionId) {
        const date = local.completedAt ? new Date(local.completedAt) : null
        sessionMap.set(local.sessionId, {
          id: local.sessionId,
          role: local.config?.role || 'Practice Interview',
          date:
            date && !Number.isNaN(date.getTime())
              ? date.toLocaleDateString('en-IN')
              : 'Recently',
          sortDate: date && !Number.isNaN(date.getTime()) ? date.getTime() : 0,
          type: local.config?.type || 'Mixed',
          score: local.averageScore || 0,
        })
      }
    }

    return Array.from(sessionMap.values()).sort(
      (a, b) => b.sortDate - a.sortDate
    )
  }, [supabaseSessions, savedResults])

  const completedSessions = history.length

  const averageScore = completedSessions
    ? Math.round(
      history.reduce((sum, item) => sum + item.score, 0) /
      completedSessions
    )
    : 0

  const latestScore = history.length > 0 ? history[0].score : 0

  // Fallback calculation for aspect metrics from local evaluations
  const localAspectMetrics = useMemo(() => {
    let tech = 0
    let comm = 0
    let prob = 0
    let count = 0

    for (const r of savedResults) {
      for (const ev of r.evaluations || []) {
        const e = ev as any
        if (e.technicalCorrectness?.score !== undefined) {
          tech += e.technicalCorrectness.score
          comm += e.communication?.score ?? e.score
          prob += e.problemSolving?.score ?? e.score
          count++
        } else if (e.score !== undefined) {
          tech += e.score
          comm += e.score
          prob += e.score
          count++
        }
      }
    }

    return {
      technicalAverage: count > 0 ? Math.round(tech / count) : 0,
      communicationAverage: count > 0 ? Math.round(comm / count) : 0,
      problemSolvingAverage: count > 0 ? Math.round(prob / count) : 0,
      totalEvaluations: count,
    }
  }, [savedResults])

  const activeAspectMetrics =
    isRealUser && aspectMetrics.totalEvaluations > 0
      ? aspectMetrics
      : localAspectMetrics

  const skills =
    isRealUser && supabaseProgress.length > 0
      ? supabaseProgress.map((p) => ({
          skill: p.category,
          score: p.score,
        }))
      : getSkillProgress(savedResults)

  const strongestSkill = [...skills].sort(
    (a, b) => b.score - a.score
  )[0]

  const weakestSkill = [...skills].sort(
    (a, b) => a.score - b.score
  )[0]

  // Chronological score trend (oldest to newest)
  const trendData = useMemo(() => {
    return [...history]
      .reverse()
      .map((item, index) => ({
        session: `Session ${index + 1}`,
        score: item.score,
      }))
  }, [history])

  return (
    <div className="page-stack">
      {/* Loading state indicator */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            color: '#3b82f6',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <Loader2 size={16} className="spin" />
          <span>Synchronizing progress records from Supabase...</span>
        </div>
      )}

      {/* Error state banner */}
      {loadError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={17} />
            <span>Supabase sync notice: {loadError}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="secondary-button"
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      <div className="page-heading">
        <p className="eyebrow">YOUR DEVELOPMENT</p>
        <h1>Progress and insights</h1>
        <p className="page-subtitle">
          Look for patterns over time, not perfection in a single answer.
        </p>
      </div>

      {/* Statistics */}
      <div className="stats-grid progress-stats">

        <div className="stat-card">
          <div className="stat-top">
            <span>Average interview score</span>
            <span className="stat-icon">
              <Target size={18} />
            </span>
          </div>

          <div className="stat-value">
            {completedSessions > 0 ? (
              <>
                {averageScore}
                <span>/100</span>
              </>
            ) : (
              '—'
            )}
          </div>

          <div className="stat-detail">
            {completedSessions > 0
              ? `Calculated from ${completedSessions} completed sessions`
              : 'Complete your first interview to see average'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Completed interviews</span>
            <span className="stat-icon">
              <CalendarDays size={18} />
            </span>
          </div>

          <div className="stat-value">
            {completedSessions}
          </div>

          <div className="stat-detail">
            {completedSessions === 1
              ? '1 session recorded'
              : `${completedSessions} sessions recorded`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Latest interview score</span>
            <span className="stat-icon">
              <TrendingUp size={18} />
            </span>
          </div>

          <div className="stat-value">
            {completedSessions > 0 ? (
              <>
                {latestScore}
                <span>/100</span>
              </>
            ) : (
              '—'
            )}
          </div>

          <div className="stat-detail">
            {completedSessions > 0
              ? 'Score from your most recent session'
              : 'Take an interview to record your first score'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Strongest skill area</span>
            <span className="stat-icon">
              <CheckCircle2 size={18} />
            </span>
          </div>

          <div className="stat-value text-value">
            {strongestSkill?.skill || '—'}
          </div>

          <div className="stat-detail">
            {strongestSkill
              ? `${strongestSkill.score}% average proficiency`
              : 'Complete an interview to see skill progress'}
          </div>
        </div>

      </div>

      {/* Core Competencies: Technical, Communication, Problem-Solving */}
      <section className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-heading">
          <div>
            <h3>Core Evaluation Competencies</h3>
            <p>Track your development across the three pillars assessed by AI on every answer</p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginTop: '0.75rem',
          }}
        >
          {/* Technical skill progress */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-color, rgba(140, 150, 175, 0.15))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                <Code2 size={18} style={{ color: '#6574d9' }} />
                <span>Technical skill progress</span>
              </div>
              <strong style={{ fontSize: '1.15rem' }}>
                {activeAspectMetrics.technicalAverage}%
              </strong>
            </div>
            <p
              style={{
                margin: '0 0 0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted, #888)',
              }}
            >
              Correctness, technical depth, and conceptual precision
            </p>
            <div className="skill-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, activeAspectMetrics.technicalAverage)
                  )}%`,
                  background: '#6574d9',
                }}
              />
            </div>
          </div>

          {/* Communication progress */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-color, rgba(140, 150, 175, 0.15))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                <MessageSquare size={18} style={{ color: '#10b981' }} />
                <span>Communication progress</span>
              </div>
              <strong style={{ fontSize: '1.15rem' }}>
                {activeAspectMetrics.communicationAverage}%
              </strong>
            </div>
            <p
              style={{
                margin: '0 0 0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted, #888)',
              }}
            >
              Clarity, structure (STAR method), and concise articulation
            </p>
            <div className="skill-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, activeAspectMetrics.communicationAverage)
                  )}%`,
                  background: '#10b981',
                }}
              />
            </div>
          </div>

          {/* Problem-solving progress */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-color, rgba(140, 150, 175, 0.15))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                <Brain size={18} style={{ color: '#f59e0b' }} />
                <span>Problem-solving progress</span>
              </div>
              <strong style={{ fontSize: '1.15rem' }}>
                {activeAspectMetrics.problemSolvingAverage}%
              </strong>
            </div>
            <p
              style={{
                margin: '0 0 0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted, #888)',
              }}
            >
              Logical reasoning, trade-off evaluation, and edge-case handling
            </p>
            <div className="skill-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, activeAspectMetrics.problemSolvingAverage)
                  )}%`,
                  background: '#f59e0b',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="dashboard-grid progress-charts">

        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h3>Interview performance over time</h3>
              <p>Chronological score trend across mock interviews</p>
            </div>

            <span className="chart-legend">
              <i /> Overall score
            </span>
          </div>

          <div className="chart-wrap large-chart">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -24,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="progressFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6574d9"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor="#6574d9"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#edf0f5"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="session"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: '#8992a5',
                      fontSize: 11,
                    }}
                    dy={10}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: '#8992a5',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6674d9"
                    strokeWidth={2.5}
                    fill="url(#progressFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '0.65rem',
                  color: 'var(--text-muted, #888)',
                  textAlign: 'center',
                  padding: '2rem 1rem',
                }}
              >
                <TrendingUp size={30} style={{ opacity: 0.35 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No score trend available</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                  Complete your first interview to track your performance progression over time.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h3>Skill comparison</h3>
              <p>Current practice snapshot across categories</p>
            </div>
          </div>

          <div className="chart-wrap large-chart">
            {skills.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skills}
                  layout="vertical"
                  margin={{
                    top: 3,
                    right: 18,
                    left: 5,
                    bottom: 3,
                  }}
                >
                  <CartesianGrid
                    stroke="#edf0f5"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: '#8992a5',
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="skill"
                    width={104}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: '#657087',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="score"
                    fill="#7c88df"
                    radius={[0, 5, 5, 0]}
                    barSize={13}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '0.65rem',
                  color: 'var(--text-muted, #888)',
                  textAlign: 'center',
                  padding: '2rem 1rem',
                }}
              >
                <Target size={30} style={{ opacity: 0.35 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No skill data recorded yet</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                  Complete an interview to compare your performance across different skill domains.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Completed Interview History */}
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h3>Completed interview history</h3>
            <p>All completed interview sessions and comprehensive AI evaluation reports</p>
          </div>

          <Link
            to="/interview/setup"
            className="text-link"
          >
            New session <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ROLE</th>
                <th>DATE</th>
                <th>FORMAT</th>
                <th>SCORE</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="interview-name">
                        <div className="role-icon">
                          <CalendarDays size={16} />
                        </div>

                        <div>
                          <strong>{item.role}</strong>
                          <span>{item.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="muted-cell">
                      {item.date}
                    </td>

                    <td>
                      <span className="type-chip">
                        {item.type}
                      </span>
                    </td>

                    <td>
                      <strong className="score-number">
                        {item.score}/100
                      </strong>
                    </td>

                    <td>
                      <Link
                        className="row-arrow"
                        to={`/reports/${item.id}`}
                        aria-label={`Open report for ${item.role}`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                      <FolderOpen size={36} style={{ opacity: 0.4 }} />
                      <strong style={{ fontSize: '1rem' }}>No practice sessions yet</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted, #888)', fontSize: '0.875rem' }}>
                        Take your first interview to track your skill metrics and answer progress over time.
                      </p>
                      <Link
                        className="button button-primary"
                        to="/interview/setup"
                        style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Plus size={15} /> Start an interview
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Personalized Insight */}
      <div className="insight-callout">
        <div>
          <Target size={18} />
        </div>

        <p>
          <strong>One thing to focus on next:</strong>{' '}
          {weakestSkill
            ? `Your lowest current indicator is ${weakestSkill.skill} (${weakestSkill.score}%). Practise this area in your next interview.`
            : 'Complete a practice session to receive personalized progress insights.'}
        </p>
      </div>

      <p className="small-disclaimer">
        {isRealUser
          ? 'Progress is continuously synchronized with your Supabase account and secured with Row Level Security.'
          : 'Showing local browser session history. Connect or sign into Supabase to sync your progress securely across devices.'}
      </p>

    </div>
  )
}
