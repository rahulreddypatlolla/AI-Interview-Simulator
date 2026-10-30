
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, BookOpenCheck, BrainCircuit, ChevronDown, CircleHelp,
  ClipboardList, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck,
  Sparkles, UsersRound, X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Practice interviews', to: '/practice/interviews', icon: ClipboardList },
  { label: 'Career Twin (Map)', to: '/career-twin', icon: Sparkles },
  { label: 'My reports', to: '/reports', icon: BookOpenCheck },
  { label: 'Progress', to: '/progress', icon: Activity },
]

const workspaceItems = [
  { label: 'Mentor review', to: '/mentor', icon: UsersRound },
  { label: 'Administration', to: '/admin', icon: ShieldCheck },
]

const titleByPath: Record<string, string> = {
  '/dashboard': 'Overview',
  '/career-twin': 'Career Twin',
  '/onboarding': 'Career Twin',
  '/interview/setup': 'Interview setup',
  '/practice/interviews': 'Practice interviews',
  '/reports': 'My reports',
  '/progress': 'Progress',
  '/mentor': 'Mentor review',
  '/admin': 'Administration',
  '/settings': 'Settings',
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth', { replace: true })
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const displayName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split('@')[0] ||
    'Candidate'

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CA'

  const currentTitle = location.pathname.startsWith('/interview/')
    ? location.pathname.includes('/setup')
      ? 'Interview setup'
      : 'Interview room'
    : titleByPath[location.pathname] ??
    (location.pathname.startsWith('/reports/')
      ? 'Interview report'
      : 'Interview Studio')

  const sidebar = (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><BrainCircuit size={21} /></div>
        <div>
          <strong>Interview Studio</strong>
          <span>Practice with purpose</span>
        </div>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="workspace-switcher">
        <div className="workspace-avatar">{initials}</div>
        <div className="workspace-copy">
          <strong>Candidate workspace</strong>
          <span>Personal account</span>
        </div>
        <ChevronDown size={16} className="muted-icon" />
      </div>

      <p className="nav-caption">WORKSPACE</p>
      <nav className="nav-list">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="nav-caption second-caption">REVIEW TOOLS</p>
      <nav className="nav-list">
        {workspaceItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            <span className="nav-tag">Beta</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon"><CircleHelp size={17} /></div>
          <div>
            <strong>Need a hand?</strong>
            <p>Explore tips to get more from each practice.</p>
            <button onClick={() => alert('Help centre can be connected here.')}>
              Open help centre <span>↗</span>
            </button>
          </div>
        </div>

        <NavLink
          to="/settings"
          className="nav-link settings-link"
          onClick={() => setMobileOpen(false)}
        >
          <Settings2 size={18} />
          <span>Settings</span>
        </NavLink>

        <div className="profile-row">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-copy">
            <strong>{displayName}</strong>
            <span>{user?.email || 'Candidate'}</span>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            title="Sign out"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`sidebar-wrap ${mobileOpen ? 'sidebar-open' : ''}`}>
        {sidebar}
      </div>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-muted">Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{currentTitle}</strong>
          </div>

          <div className="topbar-right">
            <span className="status-dot" />
            <span className="saved-label">All changes saved</span>
            <div className="topbar-avatar" title={displayName}>{initials}</div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>Interview Studio</span>
          <span>Practice thoughtfully. Improve consistently.</span>
          <span><Sparkles size={13} /> Research preview</span>
        </footer>
      </main>
    </div>
  )
}
