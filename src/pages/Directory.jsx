import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'
import Lightbox from '../components/Lightbox'
import ContactButton from '../components/ContactButton'
import ChatDrawer from '../components/ChatDrawer'

const COFOUNDER_TYPES = ['All', 'Technical', 'Non-technical', 'Hybrid']

export default function Directory() {
  const [profiles, setProfiles] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [user, setUser] = useState(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [requestMap, setRequestMap] = useState({})
  const [contacts, setContacts] = useState(new Set())
  const [chatTarget, setChatTarget] = useState(null)

  useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/'; return }
    setUser(session.user)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_complete', true)
      .order('created_at', { ascending: false })

    setProfiles(data || [])
    setFiltered(data || [])

    // Fetch existing requests sent by current user
    const { data: requests } = await supabase
      .from('contact_requests')
      .select('*')
      .eq('sender_id', session.user.id)

    const requestMap = {}
    requests?.forEach(r => { requestMap[r.receiver_id] = r })
    setRequestMap(requestMap)

    setLoading(false)
  }
  init()
}, [])

  useEffect(() => {
    let results = profiles

    if (typeFilter !== 'All') {
      results = results.filter(p => p.cofounder_type === typeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.skills?.toLowerCase().includes(q) ||
        p.industry_vertical?.toLowerCase().includes(q) ||
        p.startup_vision?.toLowerCase().includes(q) ||
        p.university?.toLowerCase().includes(q)
      )
    }

    setFiltered(results)
  }, [search, typeFilter, profiles])


  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ fontSize: 13, letterSpacing: '0.1em', color: 'var(--gray-text)' }}>LOADING</span>
    </div>
  )

  
  return (
    <Layout>

      <div className="page-wide">
        <h1 className="page-title">Cofounder Directory</h1>
        <p className="page-subtitle">{profiles.length} founder{profiles.length !== 1 ? 's' : ''} looking for their next chapter</p>

        {/* Search & filters */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="field-label">Search</label>
            <input
              className="input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Name, skill, industry, university..."
            />
          </div>
          <div className="bubble-group" style={{ paddingBottom: 8 }}>
            {COFOUNDER_TYPES.map(type => (
              <button
                type="button"
                key={type}
                className={`bubble ${typeFilter === type ? 'active' : ''}`}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {(search || typeFilter !== 'All') && (
          <p style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 24, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--gray-text)', fontSize: 14 }}>No profiles match your search.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 0,
            background: 'var(--white)'
          }}>
            {filtered.map(profile => (
              <div key={profile.id} style={{
                    background: 'var(--white)',
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    border: '1px solid var(--gray-light)'
                    }}>
                {/* Avatar + Name & type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {profile.avatar_url && (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      onClick={() => setLightboxSrc(profile.avatar_url)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'zoom-in',
                        marginRight: 12,
                        flexShrink: 0
                      }}
                    />
                  )}
                  <a href={`/founder/${profile.id}`} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--black)' }}>
                         {profile.full_name}
                    </h2>
                    </a>
                  {profile.cofounder_type && (
                    <span style={{
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--gray-text)',
                      border: '1px solid var(--gray-mid)',
                      padding: '3px 8px',
                      whiteSpace: 'nowrap',
                      marginLeft: 8
                    }}>
                      {profile.cofounder_type}
                    </span>
                  )}
                </div>

                {/* Institution */}
                {(profile.university || profile.institution) && (
                  <p style={{ fontSize: 12, color: 'var(--gray-text)', letterSpacing: '0.02em' }}>
                    {[profile.university, profile.institution].filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Vision */}
                {profile.startup_vision && (
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--black)' }}>
                    {profile.startup_vision?.length > 120 ? profile.startup_vision.slice(0, 120) + '…' : profile.startup_vision}
                </p>
                )}

                {/* Industry */}
                {profile.industry_vertical && (
                <p style={{ fontSize: 12, color: 'var(--gray-text)', fontStyle: 'italic' }}>
                    {profile.industry_vertical}
                </p>
                )}

                {/* Links */}
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      LinkedIn
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      GitHub
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Portfolio
                    </a>
                  )}
                </div>
                {user && profile.id !== user.id && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ContactButton currentUser={user} targetProfile={profile} />
                  <button
                    onClick={() => setChatTarget(profile)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--gray-text)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>
          )
      }
      </div>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <ChatDrawer
        isOpen={!!chatTarget}
        onClose={() => setChatTarget(null)}
        currentUser={user}
        targetProfile={chatTarget}
      />
    </Layout>
  )
}