import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-logo">
          <div className="auth-brand-logo"><span>CV</span></div>
          <span className="auth-brand-name">CareerVerse</span>
        </div>
        <div className="auth-loading-spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
