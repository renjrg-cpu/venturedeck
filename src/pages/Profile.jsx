import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <p style={{ margin: 100, textAlign: 'center' }}>Loading...</p>

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 20px' }}>
      <h1>Your Profile</h1>
      <p>Logged in as <strong>{user.email}</strong></p>

      <p style={{ marginTop: 24, color: '#888' }}>
        Profile setup coming soon — this is where you'll add your bio, skills, and startup vision.
      </p>

      <button onClick={handleLogout} style={{ marginTop: 32, padding: '10px 20px' }}>
        Log out
      </button>
    </div>
  )
}