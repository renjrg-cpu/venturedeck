import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated! You can now log in with your new password.')
    }

    setLoading(false)
  }

  if (!ready) return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 20px' }}>
      <p>Verifying your reset link...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 20px' }}>
      <h1>Set a new password</h1>

      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: 12 }}>
          <label>New password</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  )
}