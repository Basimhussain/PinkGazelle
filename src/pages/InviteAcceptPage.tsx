import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Checking invitation…')

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
      
      setStatus('Accepting invitation and assigning project…')
      console.log(`Attempting to assign project with token: ${token} for user: ${userId}`);
      
      const { error: rpcError } = await supabase.rpc('accept_project_invite', {
        p_token: token!,
        p_user_id: userId,
      })
      
      if (rpcError) {
        console.error('RPC Error in InviteAcceptPage:', rpcError);
        setError(rpcError.message)
        setStatus('Failed to assign project')
      } else {
        console.log('Invitation accepted successfully, navigating to client portal');
        setStatus('Success! Redirecting to your portal…')
        // Small delay to ensure DB propagation if needed
        setTimeout(() => navigate('/client', { replace: true }), 1500);
      }
    }

    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('Existing session found in InviteAcceptPage:', session.user.id);
        assignProject(session.user.id)
      } else {
        setStatus('Ready to accept invitation. Please sign in via the magic link.')
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
          <p className="login-sub">{status}</p>
        )}
      </div>
    </div>
  )
}
