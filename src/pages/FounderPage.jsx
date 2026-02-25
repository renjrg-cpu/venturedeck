import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Layout from '../components/Layout'
import Lightbox from '../components/Lightbox'
import ContactButton from '../components/ContactButton'

export default function FounderPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [mediaFile, setMediaFile] = useState(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)

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
    if (!newPost.trim() && !mediaFile) return
    setPosting(true)

    let media_url = null
    let media_type = null

    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop()
      const fileName = `${currentUser.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, mediaFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(fileName)
        media_url = urlData.publicUrl
        media_type = mediaFile.type
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: currentUser.id, content: newPost, media_url, media_type })
      .select()
      .single()

    if (!error) {
      setPosts([data, ...posts])
      setNewPost('')
      setMediaFile(null)
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
  {profile.avatar_url && (
    <img
      src={profile.avatar_url}
      alt={profile.full_name}
      onClick={() => setLightboxSrc(profile.avatar_url)}
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        objectFit: 'cover',
        cursor: 'zoom-in',
        marginBottom: 20
      }}
    />
  )}
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
            {!isOwner && (
                <div style={{ marginTop: 16 }}>
                  <ContactButton currentUser={currentUser} targetProfile={profile} />
                </div>
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
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    LinkedIn
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    GitHub
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — updates feed */}
        <div style={{ position: 'sticky', top: 80 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32 }}>
            Updates
          </h2>

          {isOwner && (
            <form onSubmit={handlePost} style={{ marginBottom: 40 }}>
              <div className="field">
                <label className="field-label">Share an update</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    className="textarea"
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    placeholder="What are you working on?"
                    style={{ minHeight: 100, paddingRight: 40 }}
                  />
                  <label style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 8,
                    cursor: 'pointer',
                    color: mediaFile ? 'var(--black)' : 'var(--gray-text)',
                    transition: 'color 0.15s'
                  }}>
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={e => setMediaFile(e.target.files[0])}
                    />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </label>
                </div>
                {mediaFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.04em' }}>
                      {mediaFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMediaFile(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              background: 'var(--gray-light)',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {posts.map(post => (
                <div key={post.id} style={{
                  background: 'var(--white)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  {post.content && (
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--black)' }}>
                      {post.content}
                    </p>
                  )}
                  {post.media_url && post.media_type && post.media_type.startsWith('image/') && (
                    <img
                      src={post.media_url}
                      alt="attachment"
                      style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
                    />
                  )}
                  {post.media_url && post.media_type === 'application/pdf' && (
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      View PDF
                    </a>
                  )}
                  {post.media_url && post.media_type && !post.media_type.startsWith('image/') && post.media_type !== 'application/pdf' && (
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      Download attachment
                    </a>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.04em' }}>
                      {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--gray-text)', cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}
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