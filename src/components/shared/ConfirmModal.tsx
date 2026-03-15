interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isDanger?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="slide-overlay" style={{ zIndex: 100 }} onClick={onCancel} />
      <div className="card" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 101,
        width: '90%',
        maxWidth: '400px',
        animation: 'fadeIn 0.2s ease',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{message}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
