
import { useState } from 'react'
import {
  ArrowLeft, Bell, LockKeyhole, UserRound, Save, LogOut,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { syncUserProfile } from '../../services/interviewStorageService'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string) || ''
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage('Please enter your name.')
      return
    }

    if (!supabase || !isSupabaseConfigured) {
      setMessage('Profile updates require Supabase authentication.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    })

    if (!error && user?.id) {
      await syncUserProfile(user.id, user.email || '', name.trim()).catch(() => {})
    }

    setLoading(false)
    setMessage(error ? error.message : 'Profile updated successfully.')
  }

  const handlePasswordReset = async () => {
    if (!user?.email || !supabase) {
      setMessage('Please sign in with a valid email address.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(
      user.email,
      { redirectTo: `${window.location.origin}/auth` }
    )
    setLoading(false)

    setMessage(
      error ? error.message : 'Password reset link sent to your email.'
    )
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="page-stack narrow-page">
      <div className="back-line">
        <Link to="/dashboard">
          <ArrowLeft size={15} /> Back to overview
        </Link>
      </div>

      <div className="page-heading">
        <p className="eyebrow">PREFERENCES</p>
        <h1>Settings</h1>
        <p className="page-subtitle">
          Manage your profile, account security, and preferences.
        </p>
      </div>

      {message && (
        <div className="insight-callout">
          <p>{message}</p>
        </div>
      )}

      <section className="panel settings-item">
        <div className="settings-item-icon">
          <UserRound size={19} />
        </div>
        <div>
          <strong>Profile details</strong>
          <p>Manage your name and account information.</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="settings-input"
          />
          <p>{user?.email || 'Demo account'}</p>
          <button
            className="primary-button"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            <Save size={15} />
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </section>

      <section className="panel settings-item">
        <div className="settings-item-icon">
          <LockKeyhole size={19} />
        </div>
        <div>
          <strong>Privacy and security</strong>
          <p>Manage your account password.</p>
          <button
            className="secondary-button"
            onClick={handlePasswordReset}
            disabled={loading}
          >
            Send password reset link
          </button>
        </div>
      </section>

      <section className="panel settings-item">
        <div className="settings-item-icon">
          <Bell size={19} />
        </div>
        <div>
          <strong>Notifications</strong>
          <p>Practice reminders and notification preferences.</p>
          <span className="coming-soon">Coming soon</span>
        </div>
      </section>

      <section className="panel settings-item">
        <div className="settings-item-icon">
          <LogOut size={19} />
        </div>
        <div>
          <strong>Sign out</strong>
          <p>Sign out of your Interview Studio account.</p>
          <button className="secondary-button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </section>

      <div className="insight-callout">
        <LockKeyhole size={17} />
        <p>
          Interview responses should only be stored with appropriate user
          consent and database access policies.
        </p>
      </div>
    </div>
  )
}
