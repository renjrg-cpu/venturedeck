import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)
  setMessage('')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    setMessage(error.message)
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_complete')
      .eq('id', data.user.id)
      .single()

    if (profile?.is_complete) {
      window.location.href = '/directory'
    } else {
      window.location.href = '/profile'
    }
  }

  setLoading(false)
}

  return (
    <>
      <nav className="navbar">
        <a href="/" className="navbar-logo">VentureDeck</a>
      </nav>

      <div className="page">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Log in to your account to continue</p>

        <form onSubmit={handleLogin}>
          <div className="field">
            <label className="field-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <hr className="divider" />

        <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
        <p style={{ fontSize: 13, marginTop: 12, color: 'var(--gray-text)' }}>
          <a href="/forgot-password">Forgot your password?</a>
        </p>
      </div>
    </>
  )
}