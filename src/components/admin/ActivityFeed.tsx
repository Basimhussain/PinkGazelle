import { Avatar } from '../shared/Avatar'
import { timeAgo } from '../../lib/utils'
import type { ActivityLog } from '../../types'

interface ActivityFeedProps {
  activities: ActivityLog[]
  isLoading?: boolean
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

export function ActivityFeed({ activities, isLoading, selectionMode, selectedIds, onToggleSelect }: ActivityFeedProps) {
  if (isLoading) return <div className="empty-feed">Loading…</div>
  if (activities.length === 0) return (
    <div className="empty-feed">
      <div style={{ fontSize: 24, marginBottom: 8 }}>🌀</div>
      No activity yet
    </div>
  )

  return (
    <div className="feed-list">
      {activities.map(a => {
        const displayName = a.actor
          ? `${a.actor.first_name || ''} ${a.actor.last_name || ''}`.trim() || a.actor.email
          : 'System'
        const isSelected = selectedIds?.has(a.id) ?? false
        return (
          <div
            key={a.id}
            className={`feed-item ${selectionMode && isSelected ? 'selected' : ''}`}
            onClick={() => selectionMode && onToggleSelect?.(a.id)}
            style={{ cursor: selectionMode ? 'pointer' : 'default' }}
          >
            {selectionMode && (
              <input
                type="checkbox"
                className="item-checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect?.(a.id)}
                onClick={e => e.stopPropagation()}
              />
            )}
            <Avatar name={displayName} size="sm" />
            <div className="feed-item-content">
              <div className="feed-action">
                <span className="feed-actor">{displayName}</span>
                {' '}
                {a.action}
              </div>
              <div className="feed-time">{timeAgo(a.created_at)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
