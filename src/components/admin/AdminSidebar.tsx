import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from '../../lib/auth'
import { useAuthStore } from '../../store/useAuthStore'
import { getAllProjects } from '../../lib/projects'
import { Avatar } from '../shared/Avatar'
import type { ProjectWithProgress } from '../../types'

export function AdminSidebar() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const isArchivedActive = location.pathname === '/admin/projects' && searchParams.get('archived') === 'true'
  const isAllProjectsActive = location.pathname === '/admin/projects' && !searchParams.has('archived')
  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'Admin'
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])

  useEffect(() => {
    getAllProjects().then(setProjects).catch(() => {})
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">PG</div>
        <div>
          <div className="sidebar-logo-name">Pink Gazelle</div>
          <div className="sidebar-logo-sub">Admin Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-heading">Overview</span>
        <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>⊞</span> Dashboard
        </NavLink>

        <span className="sidebar-heading" style={{ marginTop: 8 }}>Projects</span>
        <NavLink to="/admin/projects" end className={({ isActive }) => `sidebar-link ${isAllProjectsActive ? 'active' : ''}`}>
          <span>◫</span> All Projects
        </NavLink>
        {projects.map(p => (
          <NavLink
            key={p.id}
            to={`/admin/projects/${p.id}`}
            className={({ isActive }) => `sidebar-link sidebar-link-sub ${isActive ? 'active' : ''}`}
          >
            <span style={{ opacity: 0.4 }}>└</span> {p.title}
          </NavLink>
        ))}
        <NavLink
          to="/admin/projects?archived=true"
          className={({ isActive }) => `sidebar-link ${isArchivedActive ? 'active' : ''}`}
        >
          <span>📦</span> Archived
        </NavLink>
        <NavLink to="/admin/projects/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span>+</span> New Project
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar name={displayName} size="sm" />
          <div>
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
          ↩
        </button>
      </div>
    </aside>
  )
}
