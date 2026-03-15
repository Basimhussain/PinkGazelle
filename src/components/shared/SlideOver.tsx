interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  if (!isOpen) return null
  return (
    <>
      <div className="slide-overlay" onClick={onClose} />
      <div className="slide-panel" role="dialog" aria-modal aria-label={title}>
        <div className="slide-header">
          <h2 className="slide-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="slide-body">{children}</div>
      </div>
    </>
  )
}
