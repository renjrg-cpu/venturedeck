import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Sidebar({ isOpen, onClose }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const links = [
    { label: 'Directory', href: '/directory' },
    { label: 'My Profile', href: '/profile' },
    { label: 'Your Contacts', href: '/contacts' },
    { label: 'Idea Board', href: '/ideas' },
  ]

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.3s',
          zIndex: 40
        }}
      />

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 280,
        background: 'var(--white)',
        borderRight: '1px solid var(--gray-light)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 0'
      }}>

        <div style={{ padding: '0 28px 40px' }}>
          <a href="/" className="navbar-logo">VentureDeck</a>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(function(link) {
            const active = window.location.pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  padding: '12px 28px',
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: active ? 'var(--black)' : 'var(--gray-text)',
                  fontWeight: active ? 500 : 300,
                  borderLeft: active ? '2px solid var(--black)' : '2px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div style={{ padding: '24px 28px 0', borderTop: '1px solid var(--gray-light)' }}>
          {user && (
            <p style={{ fontSize: 11, color: 'var(--gray-text)', marginBottom: 16, letterSpacing: '0.02em' }}>
              {user.email}
            </p>
          )}
          <button className="btn-ghost" onClick={handleLogout} style={{ width: '100%' }}>
            Log out
          </button>
        </div>

      </div>
    </>
  )
}