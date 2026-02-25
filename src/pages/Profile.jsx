import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import Layout from '../components/Layout'

const UNIVERSITIES = [
  'Politecnico di Milano',
  'Bocconi University',
  'Università degli Studi di Milano',
  'Università di Milano-Bicocca',
  'Università Cattolica del Sacro Cuore',
  'ESCP Business School',
  'Politecnico di Torino',
  'Università di Torino',
  'Università di Pisa',
  'Università di Bologna',
  'Sapienza Università di Roma',
  'LUISS Guido Carli',
  "Università Ca' Foscari Venezia"
]

const COFOUNDER_TYPES = ['Technical', 'Non-technical', 'Hybrid']

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    university: '',
    institution: '',
    industry_vertical: '',
    skills: '',
    startup_vision: '',
    cofounder_type: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    avatar_url: ''
  })
  const fileInputRef = useRef(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          university: profile.university || '',
          institution: profile.institution || '',
          industry_vertical: profile.industry_vertical || '',
          skills: profile.skills || '',
          startup_vision: profile.startup_vision || '',
          cofounder_type: profile.cofounder_type || '',
          linkedin_url: profile.linkedin_url || '',
          github_url: profile.github_url || '',
          portfolio_url: profile.portfolio_url || '',
          avatar_url: profile.avatar_url || ''
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setAvatarUploading(true)

  const ext = file.name.split('.').pop()
  const fileName = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (!uploadError) {
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const avatar_url = urlData.publicUrl + '?t=' + Date.now()
    setForm(prev => ({ ...prev, avatar_url }))

    await supabase.from('profiles').update({ avatar_url }).eq('id', user.id)
  }

  setAvatarUploading(false)
}

  const handleSave = async (e) => {
  e.preventDefault()
  setSaving(true)
  setMessage('')

  const isComplete = form.full_name && form.bio && form.industry_vertical &&
                     form.skills && form.startup_vision && form.cofounder_type

  const { error } = await supabase
    .from('profiles')
    .select('is_complete')
    .eq('id', user.id)
    .single()
    .then(async ({ data: existing }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ...form, is_complete: !!isComplete })
        .eq('id', user.id)

      if (!error && isComplete && !existing?.is_complete) {
        window.location.href = '/directory'
      } else if (!error) {
        setMessage(isComplete
          ? 'Profile saved.'
          : 'Draft saved — complete all required fields to appear in the directory.'
        )
      }
      return { error }
    })

  if (error) setMessage(error.message)
  setSaving(false)
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ fontSize: 13, letterSpacing: '0.1em', color: 'var(--gray-text)' }}>LOADING</span>
    </div>
  )

  return (
    <Layout>

      <div className="page">
        <h1 className="page-title">Your Profile</h1>
        <p className="page-subtitle">{user.email}</p>

        <form onSubmit={handleSave}>
        {/* Avatar */}
        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '1px solid var(--gray-mid)',
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--gray-light)'
            }}
          >
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Photo</span>
            )}
          </div>
          <div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fileInputRef.current.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? 'Uploading...' : 'Upload photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <p style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 8 }}>Click the circle or the button to upload</p>
          </div>
        </div>
          <div className="field">
            <label className="field-label">Full name *</label>
            <input
              className="input"
              type="text"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div className="field">
            <label className="field-label">Short bio *</label>
            <textarea
              className="textarea"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="A few sentences about who you are and what drives you"
            />
          </div>

          <div className="field">
            <label className="field-label">University / School</label>
            <select
              className="select"
              value={form.university}
              onChange={e => setForm({ ...form, university: e.target.value })}
            >
              <option value="">Select your university</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Company / Organization</label>
            <input
              className="input"
              type="text"
              value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })}
              placeholder="e.g. YC S24, Acme Corp, Freelance"
            />
          </div>

          <div className="field">
            <label className="field-label">Industry vertical *</label>
            <input
              className="input"
              type="text"
              value={form.industry_vertical}
              onChange={e => setForm({ ...form, industry_vertical: e.target.value })}
              placeholder="e.g. Fintech payments · Spacetech propulsion · Green energy BESS"
            />
          </div>

          <div className="field">
            <label className="field-label">Skills & specialties *</label>
            <textarea
              className="textarea"
              value={form.skills}
              onChange={e => setForm({ ...form, skills: e.target.value })}
              placeholder="e.g. Fullstack development, React, Python, financial modelling"
            />
          </div>

          <div className="field">
            <label className="field-label">Startup vision *</label>
            <textarea
              className="textarea"
              value={form.startup_vision}
              onChange={e => setForm({ ...form, startup_vision: e.target.value })}
              placeholder="What do you want to build? What problem are you solving?"
              style={{ minHeight: 100 }}
            />
          </div>

          <div className="field">
            <label className="field-label">I am a *</label>
            <div className="bubble-group">
              {COFOUNDER_TYPES.map(type => (
                <button
                  type="button"
                  key={type}
                  className={`bubble ${form.cofounder_type === type ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, cofounder_type: type })}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <hr className="divider" />

          <div className="field">
            <label className="field-label">LinkedIn</label>
            <input
              className="input"
              type="url"
              value={form.linkedin_url}
              onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/yourname"
            />
          </div>

          <div className="field">
            <label className="field-label">GitHub</label>
            <input
              className="input"
              type="url"
              value={form.github_url}
              onChange={e => setForm({ ...form, github_url: e.target.value })}
              placeholder="https://github.com/yourname"
            />
          </div>

          <div className="field">
            <label className="field-label">Portfolio</label>
            <input
              className="input"
              type="url"
              value={form.portfolio_url}
              onChange={e => setForm({ ...form, portfolio_url: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>

          {message && <p className="message">{message}</p>}

        </form>
      </div>
    </Layout>
  )
}