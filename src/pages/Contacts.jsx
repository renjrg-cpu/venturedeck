import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      setCurrentUserId(session.user.id)

      const { data } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('user_id', session.user.id)

      if (!data || data.length === 0) {
        setLoading(false)
        return
      }

      const ids = data.map(c => c.contact_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids)

      setContacts(profiles || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ fontSize: 13, letterSpacing: '0.1em', color: 'var(--gray-text)' }}>LOADING</span>
    </div>
  )

  const handleRemove = async (contactId) => {
  await supabase.from('contacts').delete()
    .eq('user_id', currentUserId).eq('contact_id', contactId)
  await supabase.from('contacts').delete()
    .eq('user_id', contactId).eq('contact_id', currentUserId)
  setContacts(prev => prev.filter(c => c.id !== contactId))
}
  return (
    <Layout>
      <div className="page">
        <h1 className="page-title">Your Contacts</h1>
        <p className="page-subtitle">{contacts.length} mutual connection{contacts.length !== 1 ? 's' : ''}</p>

        {contacts.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
            No contacts yet — send requests from the <a href="/directory">directory</a>.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--gray-light)' }}>
            {contacts.map(contact => (
              <a
                key={contact.id}
                href={`/founder/${contact.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                background: 'var(--white)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'background 0.15s',
                justifyContent: 'space-between'
                }}>
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url}
                      alt={contact.full_name}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gray-light)', flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--black)', marginBottom: 4 }}>
                      {contact.full_name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                      {[contact.university, contact.institution].filter(Boolean).join(' · ')}
                    </p>
                    {contact.industry_vertical && (
                      <p style={{ fontSize: 12, color: 'var(--gray-text)', fontStyle: 'italic', marginTop: 2 }}>
                        {contact.industry_vertical}
                      </p>
                    )}
                  </div>
                    <button
                    onClick={(e) => { e.preventDefault(); handleRemove(contact.id) }}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 11,
                        color: 'var(--gray-text)',
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        flexShrink: 0
                    }}
                    >
                    Remove
                    </button>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}