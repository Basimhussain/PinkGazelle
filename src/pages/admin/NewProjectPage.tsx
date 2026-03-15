import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { createProject } from '../../lib/projects'
import { useToast } from '../../components/shared/Toast'
import logoFooter from '../../assets/logo-admin-footer.png'

export function NewProjectPage() {
  useDocumentTitle('New Project — Admin Portal')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const project = await createProject(title, description, deadline || undefined)
      showToast('Project created!', 'success')
      navigate(`/admin/projects/${project.id}`)
    } catch {
      showToast('Failed to create project', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="app-main">
        <div className="topbar">
          <div className="topbar-title">New Project</div>
        </div>
        <div className="page-content">
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 className="card-title" style={{ marginBottom: 20 }}>Create a new project</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="title">Project title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. E-commerce Redesign"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the project…"
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline">Deadline (optional)</label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <footer style={{ 
          padding: '80px 0 60px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 20,
          marginTop: 'auto'
        }}>
          <img src={logoFooter} alt="Pink Gazelle" style={{ width: 80, height: 'auto', borderRadius: '8px' }} />
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>
            © {new Date().getFullYear()} Pink Gazelle®. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
