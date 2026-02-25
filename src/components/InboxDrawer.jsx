import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ChatDrawer from './ChatDrawer'

export default function InboxDrawer({ isOpen, onClose, currentUser }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatTarget, setChatTarget] = useState(null)

  useEffect(() => {
    if (!isOpen || !currentUser) return

    const fetchConversations = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false })

      if (!data || data.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Fetch the other participant's profile for each conversation
      const enriched = await Promise.all(data.map(async (convo) => {
        const otherId = convo.participant_1 === currentUser.id
          ? convo.participant_2
          : convo.participant_1

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, university, institution')
          .eq('id', otherId)
          .single()

        return { ...convo, otherProfile: profile }
      }))

      setConversations(enriched)
      setLoading(false)
    }

    fetchConversations()
  }, [isOpen, currentUser])

  const handleOpenChat = (otherProfile) => {
    setChatTarget(otherProfile)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          opacity: isOpen && !chatTarget ? 1 : 0,
          pointerEvents: isOpen && !chatTarget ? 'all' : 'none',
          transition: 'opacity 0.3s',
          zIndex: 40
        }}
      />

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 360,
        background: 'var(--white)',
        borderLeft: '1px solid var(--gray-light)',
        transform: isOpen && !chatTarget ? 'translateX(0)' : 'translateX(100%)',
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
            Inbox
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-text)' }}
          >
            ✕
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--gray-text)', letterSpacing: '0.06em' }}>LOADING</p>
          ) : conversations.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--gray-text)' }}>
              No conversations yet — start one from the directory or a founder's page.
            </p>
          ) : (
            conversations.map(convo => (
              <div
                key={convo.id}
                onClick={() => handleOpenChat(convo.otherProfile)}
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--gray-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                {convo.otherProfile?.avatar_url ? (
                  <img
                    src={convo.otherProfile.avatar_url}
                    alt={convo.otherProfile.full_name}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gray-light)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 2 }}>
                    {convo.otherProfile?.full_name}
                  </p>
                  {convo.last_message && (
                    <p style={{
                      fontSize: 12,
                      color: 'var(--gray-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {convo.last_message}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 10, color: 'var(--gray-text)', flexShrink: 0 }}>
                  {new Date(convo.last_message_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short'
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat drawer opens on top */}
      <ChatDrawer
        isOpen={!!chatTarget}
        onClose={() => setChatTarget(null)}
        currentUser={currentUser}
        targetProfile={chatTarget}
      />
    </>
  )
}