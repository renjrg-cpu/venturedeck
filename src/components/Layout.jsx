import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
      </nav>

      {/* Page content */}
      {children}
    </>
  )
}