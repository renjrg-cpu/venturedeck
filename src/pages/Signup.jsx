import { useState } from 'react'
import { supabase } from '../supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(error.message)
    } else if (data?.user?.identities?.length === 0) {
      setMessage("An account with this email already exists. Try logging in instead, or reset your password if you've forgotten it.")
    } else {
      setMessage('Check your email — we sent you a confirmation link!')
    }

    setLoading(false)
  }

  return (
    <>
      <nav className="navbar">
        <a href="/" className="navbar-logo">VentureDeck</a>
      </nav>

      <div className="page">
        <h1 className="page-title">Join VentureDeck</h1>
        <p className="page-subtitle">Create your account to find your cofounder</p>

        <form onSubmit={handleSignup}>
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
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <hr className="divider" />

        <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
          Already have an account? <a href="/">Log in</a>
        </p>
      </div>
    </>
  )
}