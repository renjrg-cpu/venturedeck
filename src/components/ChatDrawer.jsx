import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

export default function ChatDrawer({ isOpen, onClose, currentUser, targetProfile }) {
  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !currentUser || !targetProfile) return
    let channel

    const init = async () => {
      setLoading(true)

      // Get or create conversation
      const p1 = currentUser.id < targetProfile.id ? currentUser.id : targetProfile.id
      const p2 = currentUser.id < targetProfile.id ? targetProfile.id : currentUser.id

      let { data: convo } = await supabase
        .from('conversations')
        .select('*')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .single()

      if (!convo) {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert({ participant_1: p1, participant_2: p2 })
          .select()
          .single()
        convo = newConvo
      }

      setConversation(convo)

      // Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convo.id)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
      setLoading(false)

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', convo.id)
        .neq('sender_id', currentUser.id)

      // Real-time subscription
      channel = supabase
        .channel(`conversation:${convo.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convo.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [isOpen, currentUser, targetProfile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation) return
    setSending(true)

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      content: newMessage
    })

    await supabase.from('conversations').update({
      last_message: newMessage,
      last_message_at: new Date().toISOString()
    }).eq('id', conversation.id)

    setNewMessage('')
    setSending(false)
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
        width: 360,
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
          padding: '20px 24px',
          borderBottom: '1px solid var(--gray-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          {targetProfile?.avatar_url ? (
            <img
              src={targetProfile.avatar_url}
              alt={targetProfile.full_name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gray-light)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {targetProfile?.full_name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--gray-text)' }}>
              {targetProfile?.university || targetProfile?.institution || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-text)' }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--gray-text)', letterSpacing: '0.06em' }}>LOADING</p>
          ) : messages.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>No messages yet — say hello!</p>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === currentUser?.id
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    background: isMine ? 'var(--gray-light)' : 'var(--gray-light)',
                    color: 'var(--black)',
                    fontSize: 13,
                    lineHeight: 1.6
                  }}>
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-light)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={sending}
              style={{ width: 'auto', padding: '8px 16px', fontSize: 12 }}
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </>
  )
}