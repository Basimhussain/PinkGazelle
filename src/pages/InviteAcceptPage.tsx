import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { 
      console.log('No token found in InviteAcceptPage, redirecting to login');
      navigate('/login', { replace: true }); 
      return 
    }

    const assignedRef = { current: false }

    async function assignProject(userId: string) {
      if (assignedRef.current) return
      assignedRef.current = true
      
      console.log(`Attempting to assign project with token: ${token} for user: ${userId}`);
      
      const { error: rpcError } = await supabase.rpc('accept_project_invite', {
        p_token: token!,
        p_user_id: userId,
      })
      
      if (rpcError) {
        console.error('RPC Error in InviteAcceptPage:', rpcError);
        setError(rpcError.message)
      } else {
        console.log('Invitation accepted successfully, navigating to client portal');
        // Small delay to ensure DB propagation if needed, although RPC is transactional
        setTimeout(() => navigate('/client', { replace: true }), 100);
      }
    }

    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('Existing session found in InviteAcceptPage:', session.user.id);
        assignProject(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event in InviteAcceptPage:', event)
      if (session?.user) {
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
