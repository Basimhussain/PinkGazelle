import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from '../../lib/auth'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { getAllProjects } from '../../lib/projects'
import type { ProjectWithProgress } from '../../types'

import logoLogin from '../../assets/logo-login.png'
import logoAvatar from '../../assets/logo-avatar.png'

export function AdminSidebar() {
  const { profile } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
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
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark" style={{ background: 'transparent' }}>
          <img src={logoLogin} alt="Pink Gazelle" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="sidebar-logo-details">
          <div className="sidebar-logo-name" style={{ fontSize: 16 }}>Pink Gazelle – Admin Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: sidebarCollapsed ? 'center' : 'space-between', 
          padding: sidebarCollapsed ? '0' : '0 12px',
          marginBottom: 4,
          marginTop: -4
        }}>
          {!sidebarCollapsed && <span className="sidebar-heading" style={{ padding: 0 }}>Overview</span>}
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={toggleSidebar} 
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand" : "Collapse"}
            style={{ padding: 4, height: 24, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>
        <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
          </svg>
          <span className="sidebar-link-text">Dashboard</span>
        </NavLink>

        {!sidebarCollapsed && <span className="sidebar-heading" style={{ marginTop: 8 }}>Projects</span>}
        <NavLink to="/admin/projects" end className={() => `sidebar-link ${isAllProjectsActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="3" x2="21" y1="9" y2="9"/>
          </svg>
          <span className="sidebar-link-text">All Projects</span>
        </NavLink>
        
        {projects.map(p => (
          <NavLink
            key={p.id}
            to={`/admin/projects/${p.id}`}
            className={({ isActive }) => `sidebar-link sidebar-link-sub ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? p.title : undefined}
          >
            {sidebarCollapsed ? (
              <span style={{ fontSize: 10, fontWeight: 600 }}>{p.title.charAt(0)}</span>
            ) : (
              <>
                <span style={{ opacity: 0.4 }}>└</span>
                <span className="sidebar-link-text">{p.title}</span>
              </>
            )}
          </NavLink>
        ))}

        <NavLink
          to="/admin/projects?archived=true"
          className={() => `sidebar-link ${isArchivedActive ? 'active' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
          </svg>
          <span className="sidebar-link-text">Archived</span>
        </NavLink>
        <NavLink to="/admin/projects/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-7-7v14"/>
          </svg>
          <span className="sidebar-link-text">New Project</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-logo-mark" style={{ background: 'transparent', width: 26, height: 26 }}>
            <img src={logoAvatar} alt="PG" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleSignOut} aria-label="Sign out" title="Sign out" style={{ fontSize: 16 }}>
          ↩
        </button>
      </div>
    </aside>
  )
}
