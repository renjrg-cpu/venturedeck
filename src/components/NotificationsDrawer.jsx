import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchAndMarkRead = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setCurrentUser(session.user)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      // Enrich contact_request notifications with sender profile
      const enriched = await Promise.all((data || []).map(async (n) => {
        if (n.type === 'contact_request' && n.metadata) {
          const meta = JSON.parse(n.metadata)
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, university, institution')
            .eq('id', meta.sender_id)
            .single()
          return { ...n, sender, meta }
        }
        return n
      }))

      setNotifications(enriched)
      setLoading(false)

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false)
    }

    fetchAndMarkRead()
  }, [isOpen])

  const handleAccept = async (n) => {
    // Create mutual contacts
    await supabase.from('contacts').insert([
      { user_id: currentUser.id, contact_id: n.meta.sender_id },
      { user_id: n.meta.sender_id, contact_id: currentUser.id }
    ])

    // Update request status
    await supabase
      .from('contact_requests')
      .update({ status: 'accepted' })
      .eq('id', n.meta.request_id)

    // Notify sender
    await supabase.from('notifications').insert({
      user_id: n.meta.sender_id,
      type: 'contact_accepted',
      message: `${n.sender?.full_name || 'Someone'} accepted your contact request.`,
      link: `/founder/${currentUser.id}`
    })

    // Remove notification from list
    setNotifications(prev => prev.filter(notif => notif.id !== n.id))
    await supabase.from('notifications').delete().eq('id', n.id)
  }

  const handleIgnore = async (n) => {
    // Update request status to ignored (keep for 30 days)
    await supabase
      .from('contact_requests')
      .update({ status: 'ignored' })
      .eq('id', n.meta.request_id)

    setNotifications(prev => prev.filter(notif => notif.id !== n.id))
    await supabase.from('notifications').delete().eq('id', n.id)
  }

  const handleClick = (n) => {
    if (n.type === 'contact_request') return
    onClose()
    if (n.link) window.location.href = n.link
  }

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
        right: 0,
        height: '100vh',
        width: 340,
        background: 'var(--white)',
        borderLeft: '1px solid var(--gray-light)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column'
      }}>

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

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--gray-text)', letterSpacing: '0.06em' }}>LOADING</p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--gray-text)' }}>No notifications yet.</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--gray-light)',
                  cursor: n.type === 'contact_request' ? 'default' : n.link ? 'pointer' : 'default',
                  background: n.read ? 'var(--white)' : 'var(--gray-light)',
                }}
              >
                {n.type === 'contact_request' && n.sender ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {n.sender.avatar_url ? (
                        <img
                          src={n.sender.avatar_url}
                          alt={n.sender.full_name}
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gray-light)', flexShrink: 0 }} />
                      )}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--black)', marginBottom: 2 }}>
                          {n.sender.full_name}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--gray-text)' }}>
                          {[n.sender.university, n.sender.institution].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
                      Wants to connect with you
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleAccept(n)}
                        className="btn-primary"
                        style={{ flex: 1, padding: '8px', fontSize: 11 }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleIgnore(n)}
                        className="btn-ghost"
                        style={{ flex: 1, padding: '8px', fontSize: 11 }}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--black)', marginBottom: 6 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.04em' }}>
                      {new Date(n.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}