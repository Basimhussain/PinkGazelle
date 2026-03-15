import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, sendMagicLink } from '../lib/auth'
import { useAuthStore } from '../store/useAuthStore'

type LoginMode = 'password' | 'magic-link'

import logo from '../assets/logo-login.png'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<LoginMode>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  
  const navigate = useNavigate()
  const { profile, isLoading } = useAuthStore()

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/client', { replace: true })
    }
  }, [profile, isLoading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (mode === 'password') {
        await signIn(email, password)
      } else {
        await sendMagicLink(email)
        setMagicLinkSent(true)
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Pink Gazelle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in to your Pink Gazelle portal</p>

        {/* Mode Selector (Segmented Control style) */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--color-bg-muted)', 
          padding: '4px', 
          borderRadius: '12px', 
          marginBottom: '32px',
          position: 'relative'
        }}>
          <button 
            type="button"
            onClick={() => { setMode('password'); setError(''); setMagicLinkSent(false); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              fontSize: '13px', 
              fontWeight: mode === 'password' ? '600' : '400',
              borderRadius: '9px',
              background: mode === 'password' ? 'var(--color-bg)' : 'transparent',
              color: mode === 'password' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: mode === 'password' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
              zIndex: 1
            }}
          >
            Admin Portal
          </button>
          <button 
            type="button"
            onClick={() => { setMode('magic-link'); setError(''); setMagicLinkSent(false); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              fontSize: '13px', 
              fontWeight: mode === 'magic-link' ? '600' : '400',
              borderRadius: '9px',
              background: mode === 'magic-link' ? 'var(--color-bg)' : 'transparent',
              color: mode === 'magic-link' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: mode === 'magic-link' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
              zIndex: 1
            }}
          >
            Client Portal
          </button>
        </div>

        {error && (
          <div className="login-error" role="alert" style={{ 
            marginBottom: '24px', 
            padding: '12px 16px', 
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}
        
        {magicLinkSent ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px 24px', 
            background: 'var(--color-success-subtle)', 
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--color-success)', fontWeight: '600' }}>Check your email</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              We've sent a secure login link to <br/><strong>{email}</strong>
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setMagicLinkSent(false)}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label htmlFor="email" style={{ marginBottom: '8px', display: 'block' }}>Work Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                style={{ padding: '12px 16px', borderRadius: '10px' }}
              />
            </div>
            
            {mode === 'password' && (
              <div className="form-group">
                <label htmlFor="password" style={{ marginBottom: '8px', display: 'block' }}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ padding: '12px 16px', borderRadius: '10px' }}
                />
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '14px', 
                fontSize: '15px', 
                fontWeight: '600',
                borderRadius: '12px',
                marginTop: '8px'
              }}
            >
              {loading ? 'Processing...' : mode === 'password' ? 'Sign In to Admin' : 'Email me a Magic Link'}
            </button>
            
            {mode === 'magic-link' && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                borderRadius: '8px', 
                background: 'var(--color-bg-subtle)',
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                Security Note: Clients use passwordless login. You'll receive a unique link valid for one-time use.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
