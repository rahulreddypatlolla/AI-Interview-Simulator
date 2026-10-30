
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncUserProfile } from '../services/interviewStorageService'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInDemo: (email?: string, name?: string) => void
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
  signInDemo: () => { },
  isConfigured: false,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const restoreDemoUser = () => {
      try {
        const stored = sessionStorage.getItem('cv_demo_user')

        if (!stored) return

        const demo = JSON.parse(stored)

        const demoUser = {
          id: demo.id,
          email: demo.email,
          user_metadata: { full_name: demo.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User

        setUser(demoUser)
        setSession(null)
      } catch {
        sessionStorage.removeItem('cv_demo_user')
      }
    }

    const client = supabase
    if (!isSupabaseConfigured || !client) {
      restoreDemoUser()
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      const { data, error } = await client.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Session loading error:', error.message)
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

      if (data.session?.user) {
        syncUserProfile(
          data.session.user.id,
          data.session.user.email ?? '',
          data.session.user.user_metadata?.full_name,
        ).catch(() => {})
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)

      if (currentSession?.user) {
        syncUserProfile(
          currentSession.user.id,
          currentSession.user.email ?? '',
          currentSession.user.user_metadata?.full_name,
        ).catch(() => {})
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInDemo = (
    email = 'candidate@careerverse.ai',
    name = 'Demo Candidate'
  ) => {
    const demoUser = {
      id: 'demo-user-1',
      email,
      user_metadata: { full_name: name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User

    setUser(demoUser)
    setSession(null)

    sessionStorage.setItem(
      'cv_demo_user',
      JSON.stringify({
        id: demoUser.id,
        email,
        name,
      })
    )
  }

  const signOut = async () => {
    if (user?.id === 'demo-user-1') {
      sessionStorage.removeItem('cv_demo_user')
    } else if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }
    }

    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        signInDemo,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
