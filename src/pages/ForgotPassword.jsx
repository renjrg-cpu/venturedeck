import { useState } from 'react'
import { supabase } from '../supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://venturedeck-opal.vercel.app/reset-password'
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email — we sent you a password reset link!')
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 20px' }}>
      <h1>Reset your password</h1>
      <p>Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleReset}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      {message && <p style={{ marginTop: 16 }}>{message}</p>}

      <p style={{ marginTop: 24 }}><a href="/login">Back to login</a></p>
    </div>
  )
}