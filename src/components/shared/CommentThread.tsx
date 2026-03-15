import { useState, useEffect } from 'react'
import { getComments, createComment } from '../../lib/comments'
import { Avatar } from './Avatar'
import { timeAgo } from '../../lib/utils'
import { useAuthStore } from '../../store/useAuthStore'
import { useToast } from './Toast'
import type { Comment, CommentEntityType } from '../../types'

interface CommentThreadProps {
  entityType: CommentEntityType
  entityId: string
  canComment?: boolean
}

export function CommentThread({ entityType, entityId, canComment = true }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { profile } = useAuthStore()
  const { showToast } = useToast()

  useEffect(() => {
    getComments(entityType, entityId).then(setComments)
  }, [entityType, entityId])

  async function handleSubmit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const c = await createComment(entityType, entityId, text.trim())
      setComments(prev => [...prev, c])
      setText('')
    } catch {
      showToast('Failed to post comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="comment-list">
        {comments.length === 0 && (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No comments yet.</p>
        )}
        {comments.map(c => {
          const isOwn = c.author_id === profile?.id
          const displayName = c.author
            ? `${c.author.first_name || ''} ${c.author.last_name || ''}`.trim() || c.author.email
            : 'Unknown'
          return (
            <div key={c.id} className="comment-item">
              <Avatar name={displayName} size="sm" />
              <div className={`comment-bubble ${isOwn ? 'own' : ''}`}>
                <div className="comment-author">{displayName}</div>
                <div className="comment-text">{c.content}</div>
                <div className="comment-time">{timeAgo(c.created_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
      {canComment && (
        <div className="comment-input-row" style={{ marginTop: 16 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment…"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            aria-label="Post comment"
          >
            {submitting ? '…' : 'Post'}
          </button>
        </div>
      )}
    </div>
  )
}
