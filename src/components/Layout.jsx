import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Sidebar from './Sidebar'
import NotificationsDrawer from './NotificationsDrawer'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false)

      setUnreadCount(count || 0)
    }

    fetchUnread()

    // Real-time updates
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => fetchUnread())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const handleOpenNotifications = () => {
    setNotificationsOpen(true)
    setUnreadCount(0)
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Top navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5
            }}
          >
            <span style={{ display: 'block', width: 22, height: 1, background: 'var(--black)' }} />
            <span style={{ display: 'block', width: 22, height: 1, background: 'var(--black)' }} />
            <span style={{ display: 'block', width: 22, height: 1, background: 'var(--black)' }} />
          </button>
          <a href="/directory" className="navbar-logo">VentureDeck</a>
        </div>

        {/* Bell icon */}
        <button
          onClick={handleOpenNotifications}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'red'
            }} />
          )}
        </button>
      </nav>

      {children}
    </>
  )
}