import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }

    const assignedRef = { current: false }

    async function assignProject(userId: string) {
      if (assignedRef.current) return
      assignedRef.current = true
      
      const { error: rpcError } = await supabase.rpc('accept_project_invite', {
        p_token: token!,
        p_user_id: userId,
      })
      if (rpcError) {
        setError(rpcError.message)
      } else {
        navigate('/client', { replace: true })
      }
    }

    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        assignProject(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event in InviteAcceptPage:', event)
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
        // We don't unsubscribe immediately anymore to ensure we catch the event if it fires multiple times
        // but we protect inside assignProject if needed. Actually, RPC is idempotent-ish here.
        assignProject(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [token, navigate])

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">PG</div>
        {error ? (
          <>
            <h1 className="login-title">Something went wrong</h1>
            <p className="login-sub">{error}</p>
          </>
        ) : (
          <p className="login-sub">Setting up your account…</p>
        )}
      </div>
    </div>
  )
}
