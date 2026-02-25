export default function Lightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out'
      }}
    >
      <img
        src={src}
        alt="Profile"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain'
        }}
      />
    </div>
  )
}