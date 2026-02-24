import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

export default function FounderPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      setCurrentUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      setProfile(profileData)

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      setPosts(postsData || [])
      setLoading(false)
    }
    init()
  }, [id])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return
    setPosting(true)

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: currentUser.id, content: newPost })
      .select()
      .single()

    if (!error) {
      setPosts([data, ...posts])
      setNewPost('')
    }

    setPosting(false)
  }

  const handleDeletePost = async (postId) => {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(posts.filter(p => p.id !== postId))
  }

  const isOwner = currentUser?.id === id

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ fontSize: 13, letterSpacing: '0.1em', color: 'var(--gray-text)' }}>LOADING</span>
    </div>
  )

  if (!profile) return (
    <Layout>
      <div className="page">
        <p style={{ color: 'var(--gray-text)' }}>Profile not found.</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="page-wide" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

        {/* Left — static profile */}
        <div>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h1 className="page-title">{profile.full_name}</h1>
              {profile.cofounder_type && (
                <span style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--gray-text)',
                  border: '1px solid var(--gray-mid)',
                  padding: '4px 10px',
                  marginLeft: 12,
                  whiteSpace: 'nowrap'
                }}>
                  {profile.cofounder_type}
                </span>
              )}
            </div>
            {(profile.university || profile.institution) && (
              <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 4 }}>
                {[profile.university, profile.institution].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <Section label="Bio" content={profile.bio} />
          <Section label="Startup Vision" content={profile.startup_vision} />
          <Section label="Industry" content={profile.industry_vertical} />
          <Section label="Skills & Specialties" content={profile.skills} />

          {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
            <div style={{ marginTop: 32 }}>
              <span className="field-label">Links</span>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>LinkedIn</a>}
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>GitHub</a>}
                {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Portfolio</a>}
              </div>
            </div>
          )}
        </div>

        {/* Right — updates feed */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32 }}>
            Updates
          </h2>

          {isOwner && (
            <form onSubmit={handlePost} style={{ marginBottom: 40 }}>
              <div className="field">
                <label className="field-label">Share an update</label>
                <textarea
                  className="textarea"
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="What are you working on? Share an idea, milestone, or resource..."
                  style={{ minHeight: 100 }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={posting}>
                {posting ? 'Posting...' : 'Post update'}
              </button>
            </form>
          )}

          {posts.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
              {isOwner ? 'No updates yet — share your first one above.' : 'No updates yet.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--gray-light)' }}>
              {posts.map(post => (
                <div key={post.id} style={{
                  background: 'var(--white)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--black)' }}>
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.04em' }}>
                      {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 11,
                          color: 'var(--gray-text)',
                          cursor: 'pointer',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

function Section({ label, content }) {
  if (!content) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <span className="field-label">{label}</span>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--black)', marginTop: 8 }}>
        {content}
      </p>
    </div>
  )
}