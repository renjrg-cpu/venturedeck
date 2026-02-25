import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ContactButton({ currentUser, targetProfile }) {
  const [status, setStatus] = useState(null) // null | 'pending' | 'accepted'
  const [requestId, setRequestId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      if (!currentUser || !targetProfile) return

      // Check if already a contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('contact_id', targetProfile.id)
        .single()

      if (contact) { setStatus('accepted'); setLoading(false); return }

      // Check if request exists
      const { data: request } = await supabase
        .from('contact_requests')
        .select('id, status')
        .eq('sender_id', currentUser.id)
        .eq('receiver_id', targetProfile.id)
        .single()

      if (request) {
        setStatus(request.status)
        setRequestId(request.id)
      }

      setLoading(false)
    }
    check()
  }, [currentUser, targetProfile])

  const handleAdd = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contact_requests')
      .insert({ sender_id: currentUser.id, receiver_id: targetProfile.id })
      .select()
      .single()

    if (!error) {
      setStatus('pending')
      setRequestId(data.id)

      await supabase.from('notifications').insert({
        user_id: targetProfile.id,
        type: 'contact_request',
        message: `${currentUser.email} sent you a contact request`,
        link: `/founder/${currentUser.id}`,
        metadata: JSON.stringify({ sender_id: currentUser.id, request_id: data.id })
      })
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    setLoading(true)
    await supabase.from('contact_requests').delete().eq('id', requestId)
    setStatus(null)
    setRequestId(null)
    setLoading(false)
  }

  if (loading) return null

  if (status === 'accepted') return (
    <span style={{
      fontSize: 11,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--gray-text)'
    }}>
      ✓ Connected
    </span>
  )

  if (status === 'pending' || status === 'ignored') return (
    <button
      onClick={handleCancel}
      className="btn-ghost"
      style={{ fontSize: 11, padding: '6px 12px' }}
    >
      Cancel Request
    </button>
  )

  return (
    <button
      onClick={handleAdd}
      className="btn-ghost"
      style={{ fontSize: 11, padding: '6px 12px' }}
    >
      + Add
    </button>
  )
}