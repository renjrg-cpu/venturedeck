import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const fetchAndMarkRead = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setNotifications(data || [])
      setLoading(false)

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false)
    }

    fetchAndMarkRead()
  }, [isOpen])

  const handleClick = (notification) => {
    onClose()
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  return (
    <>
      {/* Overlay */}
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

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 320,
        background: 'var(--white)',
        borderLeft: '1px solid var(--gray-light)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '28px 24px',
          borderBottom: '1px solid var(--gray-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
            Notifications
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-text)' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--gray-text)', letterSpacing: '0.06em' }}>
              LOADING
            </p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--gray-text)' }}>
              No notifications yet.
            </p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--gray-light)',
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.read ? 'var(--white)' : 'var(--gray-light)',
                  transition: 'background 0.15s'
                }}
              >
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--black)', marginBottom: 6 }}>
                  {n.message}
                </p>
                <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.04em' }}>
                  {new Date(n.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  )
}