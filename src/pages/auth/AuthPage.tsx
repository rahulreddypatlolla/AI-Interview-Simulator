
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { syncUserProfile } from '../../services/interviewStorageService'
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
} from 'lucide-react'

type AuthMode = 'login' | 'signup'

const AuthPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signInDemo } = useAuth()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorDescription = params.get('error_description')
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription))
    }

    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup' && password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }


    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.')
      return
    }

    setLoading(true)

    if (!isSupabaseConfigured || !supabase) {
      signInDemo(
        email.trim(),
        name.trim() || 'Demo Candidate'
      )
      setLoading(false)
      navigate('/dashboard')
      return
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
          },
        })

        if (error) throw error

        if (data.user) {
          // Explicitly create/update profile record in public.profiles table
          await syncUserProfile(
            data.user.id,
            data.user.email || email.trim(),
            name.trim()
          ).catch((syncErr) => {
            console.warn('Profile sync fallback:', syncErr)
          })
        }

        if (data.session) {
          setSuccess('Account created successfully!')
          navigate('/dashboard')
        } else {
          setSuccess(
            'Account created. Please check your email to confirm your account before signing in.'
          )
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error

        navigate('/dashboard')
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Authentication failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setSuccess('')

    if (!isSupabaseConfigured || !supabase) {
      signInDemo('demo@example.com', 'Demo Candidate')
      navigate('/dashboard')
      return
    }

    setGoogleLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Google sign-in failed.'
      )
      setGoogleLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }

    if (!supabase || !isSupabaseConfigured) {
      setError('Password recovery requires Supabase configuration.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth`,
        }
      )

      if (error) throw error

      setSuccess('Password reset instructions have been sent to your email.')
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to send reset email.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
      </div>

      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <span>CV</span>
          </div>
          <span className="auth-brand-name">CareerVerse</span>
        </div>

        <div className="auth-hero-content">
          <div className="auth-badge">
            <Sparkles size={14} />
            <span>AI-Powered Career Growth</span>
          </div>

          <h1 className="auth-hero-title">
            Your whole career,
            <br />
            <span className="auth-gradient-text">with an AI mentor</span>
            <br />
            by your side.
          </h1>

          <p className="auth-hero-desc">
            Practice real interviews, track your skills, and get
            personalized feedback from AI - all in one place.
          </p>

          <div className="auth-stats-row">
            <div className="auth-stat">
              <strong>50K+</strong>
              <span>Mock Interviews</span>
            </div>
            <div className="auth-stat-divider" />
            <div className="auth-stat">
              <strong>94%</strong>
              <span>Success Rate</span>
            </div>
            <div className="auth-stat-divider" />
            <div className="auth-stat">
              <strong>200+</strong>
              <span>Companies</span>
            </div>
          </div>
        </div>

        <div className="auth-testimonial">
          <div className="auth-testimonial-avatar">R</div>
          <div className="auth-testimonial-text">
            <p>
              "CareerVerse helped me improve my interview preparation
              and build confidence."
            </p>
            <span>CareerVerse Candidate</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-mode-toggle">
            <button
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login')
                setError('')
                setSuccess('')
              }}
            >
              Sign In
            </button>

            <button
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup')
                setError('')
                setSuccess('')
              }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Get started free'}</h2>
            <p>
              {mode === 'login'
                ? 'Sign in to continue your journey'
                : 'Create your account to begin'}
            </p>
          </div>

          <button
            className="auth-google-btn"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            id="google-auth-btn"
          >
            {googleLoading ? (
              <div className="auth-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleEmailAuth} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label>Full Name</label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    id="auth-name-input"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Email address</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="auth-email-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>
                Password
                {mode === 'login' && (
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                )}
              </label>

              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    mode === 'signup' ? 'Min. 8 characters' : 'Enter password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                  id="auth-password-input"
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error-msg">{error}</div>}
            {success && <div className="auth-success-msg">{success}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="auth-spinner" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {!isSupabaseConfigured && (
            <div className="auth-demo-notice">
              <Sparkles size={13} />
              <span>
                Demo mode - Supabase not configured. Use any email and
                password to enter the app.
              </span>
            </div>
          )}

          <p className="auth-switch-text">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              className="auth-switch-link"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
                setSuccess('')
              }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <p className="auth-terms">
            By continuing, you agree to our{' '}
            <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
