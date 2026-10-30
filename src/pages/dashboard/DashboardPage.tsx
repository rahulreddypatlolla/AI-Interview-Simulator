
import React, { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Plus,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  fetchUserSessions,
  fetchUserProgress,
  type StoredSessionResult,
} from '../../services/interviewStorageService'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// Saved interview result structure
interface SavedPracticeResult {
  sessionId: string
  completed?: boolean
  completedAt?: string
  averageScore?: number
  totalQuestions?: number
  answeredQuestions?: number
  config?: {
    role?: string
    type?: string
    difficulty?: string
  }
  evaluations?: {
    category: string
    score: number
  }[]
}

// Read completed interview results
function getSavedPracticeResults(): SavedPracticeResult[] {
  const results: SavedPracticeResult[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (!key?.startsWith('practiceResult-')) continue

    try {
      const result = JSON.parse(
        sessionStorage.getItem(key) || '{}'
      ) as SavedPracticeResult

      if (result.completed && result.sessionId && !seenIds.has(result.sessionId)) {
        seenIds.add(result.sessionId)
        results.push(result)
      }
    } catch (error) {
      console.error('Error reading interview result:', error)
    }
  }

  try {
    const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
    if (Array.isArray(history)) {
      for (const item of history) {
        const sid = item.sessionId || item.id
        if (item.completed && sid && !seenIds.has(sid)) {
          seenIds.add(sid)
          results.push({
            sessionId: sid,
            completed: true,
            completedAt: item.completedAt,
            averageScore: item.averageScore,
            totalQuestions: item.totalQuestions,
            answeredQuestions: item.answeredQuestions,
            config: item.config,
          })
        }
      }
    }
  } catch (error) {
    console.error('Error reading localStorage practiceHistory:', error)
  }

  return results.sort(
    (a, b) =>
      new Date(b.completedAt || 0).getTime() -
      new Date(a.completedAt || 0).getTime()
  )
}

// Calculate skill scores from saved evaluations
function getDashboardSkills(results: SavedPracticeResult[]) {
  const grouped: Record<
    string,
    { total: number; count: number }
  > = {}

  results.forEach((result) => {
    result.evaluations?.forEach((evaluation) => {
      const category = evaluation.category || 'General'

      if (!grouped[category]) {
        grouped[category] = { total: 0, count: 0 }
      }

      grouped[category].total += evaluation.score
      grouped[category].count += 1
    })
  })

  return Object.entries(grouped).map(([skill, data]) => ({
    skill,
    score: Math.round(data.total / data.count),
  }))
}

const getGreeting = () => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const formattedDate = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export default function Dashboard() {
  const { user } = useAuth()

  const [supabaseSessions, setSupabaseSessions] = useState<StoredSessionResult[]>([])
  const [supabaseSkills, setSupabaseSkills] = useState<{ skill: string; score: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const candidateName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    'Candidate'

  const isRealUser = Boolean(
    user && isSupabaseConfigured && user.id && user.id !== 'demo-user-1'
  )

  const loadSupabaseData = useCallback(async () => {
    if (!isRealUser || !user) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const [sessionsRes, progressRes] = await Promise.all([
        fetchUserSessions(user.id),
        fetchUserProgress(user.id),
      ])

      if (sessionsRes.error) {
        setLoadError(sessionsRes.error)
      } else {
        setSupabaseSessions(sessionsRes.sessions || [])
      }

      if (progressRes.progress && progressRes.progress.length > 0) {
        setSupabaseSkills(
          progressRes.progress.map((p) => ({
            skill: p.category,
            score: p.score,
          }))
        )
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load interview records.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [user, isRealUser])

  useEffect(() => {
    loadSupabaseData()
  }, [loadSupabaseData])

  // Load fallback completed interview results from local session
  const savedResults = getSavedPracticeResults()

  // Merge Supabase sessions and locally saved sessions to guarantee immediate updates after an interview
  const completedSessions = useMemo(() => {
    const sessionMap = new Map<
      string,
      {
        sessionId: string
        completed: boolean
        completedAt?: string
        averageScore: number
        totalQuestions: number
        answeredQuestions: number
        config: {
          role?: string
          type?: string
          difficulty?: string
        }
      }
    >()

    // 1. Insert Supabase sessions
    for (const s of supabaseSessions) {
      if (s.completed && s.id) {
        sessionMap.set(s.id, {
          sessionId: s.id,
          completed: s.completed,
          completedAt: s.completedAt || s.createdAt,
          averageScore: s.averageScore ?? 0,
          totalQuestions: s.totalQuestions ?? 0,
          answeredQuestions: s.answeredQuestions ?? 0,
          config: {
            role: s.role,
            type: s.type,
            difficulty: s.difficulty,
          },
        })
      }
    }

    // 2. Merge local sessions (which include any immediately completed interview)
    for (const local of savedResults) {
      if (local.completed && local.sessionId) {
        sessionMap.set(local.sessionId, {
          sessionId: local.sessionId,
          completed: true,
          completedAt: local.completedAt,
          averageScore: local.averageScore ?? 0,
          totalQuestions: local.totalQuestions ?? 0,
          answeredQuestions: local.answeredQuestions ?? 0,
          config: local.config || {},
        })
      }
    }

    return Array.from(sessionMap.values()).sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime()
    )
  }, [supabaseSessions, savedResults])

  // Total questions answered
  const totalQuestionsAnswered = useMemo(() => {
    return completedSessions.reduce(
      (acc, s) => acc + (s.answeredQuestions || s.totalQuestions || 0),
      0
    )
  }, [completedSessions])

  // Calculate average score
  const averageScore = completedSessions.length
    ? Math.round(
      completedSessions.reduce(
        (total, result) => total + (result.averageScore || 0),
        0
      ) / completedSessions.length
    )
    : 0

  // Calculate skills
  const dashboardSkills =
    isRealUser && supabaseSkills.length > 0
      ? supabaseSkills
      : getDashboardSkills(savedResults)

  const lowestSkill = useMemo(() => {
    if (dashboardSkills.length === 0) return null
    return [...dashboardSkills].sort((a, b) => a.score - b.score)[0]
  }, [dashboardSkills])

  // Prepare chart data chronologically (oldest to newest)
  const dashboardTrend = useMemo(() => {
    return [...completedSessions]
      .reverse()
      .map((result, index) => ({
        session: `Session ${index + 1}`,
        score: result.averageScore || 0,
      }))
  }, [completedSessions])

  const latestScore =
    completedSessions.length > 0
      ? completedSessions[0].averageScore
      : 0

  const firstScore =
    dashboardTrend.length > 0
      ? dashboardTrend[0].score
      : 0

  const scoreImprovement =
    dashboardTrend.length > 1 && firstScore > 0
      ? ((latestScore - firstScore) / firstScore) * 100
      : 0

  // Prepare recent interview table (latest 5)
  const dashboardSessions = completedSessions.slice(0, 5).map((result) => ({
    id: result.sessionId,
    role: result.config?.role || 'Practice interview',
    type: result.config?.type || 'Mixed',
    date: result.completedAt
      ? new Date(result.completedAt).toLocaleDateString('en-IN')
      : 'Recently',
    score: result.averageScore || 0,
    status: 'Completed',
  }))

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
          <span>Synchronizing your sessions from Supabase...</span>
        </div>
      )}

      {/* Error state alert */}
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
            onClick={() => loadSupabaseData()}
            className="secondary-button"
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Welcome Section */}
      <section className="welcome-row">
        <div>
          <p className="eyebrow">
            {formattedDate.toUpperCase()}
          </p>

          <h1>
            {getGreeting()}, {candidateName}
            <span className="wave"> ✳</span>
          </h1>

          <p className="page-subtitle">
            A little focused practice today can make a real
            difference tomorrow.
          </p>
        </div>

        <Link
          className="button button-primary"
          to="/interview/setup"
        >
          <Plus size={17} />
          Start an interview
        </Link>
      </section>

      {/* Milestone Section */}
      <section className="hero-panel">
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="hero-kicker-icon">
              <Target size={15} />
            </span>
            YOUR NEXT MILESTONE
          </div>

          <h2>Build confidence, one answer at a time.</h2>

          <p>
            You're making steady progress. Keep sharpening
            your examples and explaining the thinking behind
            your decisions.
          </p>

          <Link
            to="/interview/setup"
            className="hero-link"
          >
            Continue practising <ArrowRight size={16} />
          </Link>
        </div>

        <div className="hero-illustration" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="illustration-card card-back">
            <span className="tiny-line" />
            <span className="tiny-line short" />
            <span className="tiny-line" />
          </div>

          <div className="illustration-card card-front">
            <div className="mini-check">
              <CheckCircle2 size={22} />
            </div>

            <div className="mini-label">Answer clarity</div>

            <div className="mini-progress">
              <span />
            </div>

            <div className="mini-foot">
              <span>Good momentum</span>
              <TrendingUp size={14} />
            </div>
          </div>

          <div className="floating-spark spark-a">✦</div>
          <div className="floating-spark spark-b">✳</div>
        </div>
      </section>

      {/* Statistics */}
      <section className="stats-grid">

        <StatCard
          label="Total completed interviews"
          value={completedSessions.length}
          detail={
            completedSessions.length === 1
              ? '1 interview completed'
              : `${completedSessions.length} interviews completed`
          }
          icon={<CheckCircle2 size={18} />}
        />

        <StatCard
          label="Average interview score"
          value={
            completedSessions.length > 0 ? (
              <>
                {averageScore}
                <span>/100</span>
              </>
            ) : (
              '—'
            )
          }
          detail={
            completedSessions.length > 0
              ? `Across ${completedSessions.length} completed interviews`
              : 'Complete an interview to see average'
          }
          icon={<Target size={18} />}
          trend={scoreImprovement > 0 ? 'up' : undefined}
        />

        <StatCard
          label="Latest interview score"
          value={
            completedSessions.length > 0 ? (
              <>
                {latestScore}
                <span>/100</span>
              </>
            ) : (
              '—'
            )
          }
          detail={
            completedSessions.length > 0
              ? 'Most recent interview result'
              : 'Take your first interview to get scored'
          }
          icon={<TrendingUp size={18} />}
        />

        <StatCard
          label="Questions answered"
          value={totalQuestionsAnswered}
          detail={
            totalQuestionsAnswered > 0
              ? `${totalQuestionsAnswered} answers evaluated by AI`
              : 'No answers submitted yet'
          }
          icon={<Clock3 size={18} />}
        />

      </section>

      {/* Performance and Skills */}
      <section className="dashboard-grid">

        {/* Score Chart */}
        <div className="panel trend-panel">

          <div className="panel-heading">
            <div>
              <h3>Score over time</h3>
              <p>Your recent interview performance</p>
            </div>

            <Link to="/progress" className="text-link">
              View progress <ArrowRight size={14} />
            </Link>
          </div>

          <div className="chart-summary">
            <strong>
              {latestScore}
              <span>/100</span>
            </strong>

            {dashboardTrend.length > 1 && (
              <span className="trend-pill">
                <ArrowUpRight size={14} />
                {scoreImprovement > 0 ? '+' : ''}
                {scoreImprovement.toFixed(1)}%
              </span>
            )}

            <span className="chart-summary-note">
              {dashboardTrend.length > 1
                ? 'compared with your first recorded session'
                : 'Complete more interviews to track improvement'}
            </span>
          </div>

          <div className="chart-wrap">
            {dashboardTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardTrend}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -24,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="scoreFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6574d9"
                        stopOpacity={0.19}
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

                  <Tooltip
                    contentStyle={{
                      border: '1px solid #e8ebf2',
                      borderRadius: 10,
                      boxShadow: '0 8px 24px #202b4512',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6674d9"
                    strokeWidth={2.5}
                    fill="url(#scoreFill)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 0,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-muted, #888)', textAlign: 'center', padding: '2rem 1rem' }}>
                <TrendingUp size={28} style={{ opacity: 0.35 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No score trend available</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Complete an interview session to track your score progression over time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Snapshot */}
        <div className="panel focus-panel">

          <div className="panel-heading">
            <div>
              <h3>Skills snapshot</h3>
              <p>Based on your recent practice</p>
            </div>

            <Link
              to="/progress"
              className="round-link"
              aria-label="View skill progress"
            >
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="skill-list">
            {dashboardSkills.length > 0 ? (
              dashboardSkills.map((item) => (
                <div className="skill-row" key={item.skill}>

                  <div className="skill-label">
                    <span>{item.skill}</span>
                    <strong>{item.score}%</strong>
                  </div>

                  <div className="skill-track">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, item.score)
                        )}%`,
                      }}
                    />
                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--text-muted, #888)' }}>
                <Target size={24} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  No skill metrics recorded yet. Complete an interview to analyze your performance across focus areas.
                </p>
              </div>
            )}
          </div>

          <div className="focus-note">
            <div className="focus-note-icon">
              <Target size={16} />
            </div>

            <p>
              <strong>Suggested focus</strong>
              <br />
              {lowestSkill
                ? `Practise more ${lowestSkill.skill} questions (${lowestSkill.score}%). Explaining your reasoning step-by-step will raise your score.`
                : 'Complete an interview session to identify personalized skill recommendations.'}
            </p>
          </div>

        </div>
      </section>

      {/* Recent Interviews */}
      <section className="panel recent-panel">

        <div className="panel-heading">
          <div>
            <h3>Recent interviews</h3>
            <p>Pick up where you left off</p>
          </div>

          <Link to="/reports" className="text-link">
            All reports <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-wrap">

          <table className="data-table">

            <thead>
              <tr>
                <th>INTERVIEW</th>
                <th>TYPE</th>
                <th>DATE</th>
                <th>SCORE</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {dashboardSessions.length > 0 ? (
                dashboardSessions.map((session) => (
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
                      <span className="type-chip">
                        {session.type}
                      </span>
                    </td>

                    <td className="muted-cell">
                      {session.date}
                    </td>

                    <td>
                      <div className="score-cell">
                        <span className="score-number">
                          {session.score}
                        </span>

                        <div className="tiny-score-track">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, session.score)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="status-chip completed">
                        <span />
                        {session.status}
                      </span>
                    </td>

                    <td>
                      <Link
                        className="row-arrow"
                        to={`/reports/${session.id}`}
                        aria-label={`Open report for ${session.role}`}
                      >
                        <ArrowRight size={17} />
                      </Link>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                      <FolderOpen size={36} style={{ opacity: 0.4 }} />
                      <strong style={{ fontSize: '1rem' }}>No practice sessions yet</strong>
                      <p style={{ margin: 0, color: 'var(--text-muted, #888)', fontSize: '0.875rem' }}>
                        Start your first interview session to begin tracking performance and building question mastery.
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

    </div>
  )
}

// Reusable statistics card
function StatCard({
  label,
  value,
  detail,
  icon,
  trend,
}: {
  label: string
  value: ReactNode
  detail: string
  icon: ReactNode
  trend?: 'up'
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-detail">
        {trend && (
          <span className="stat-trend">
            <ArrowUpRight size={13} />
          </span>
        )}

        {detail}
      </div>

    </div>
  )
}
