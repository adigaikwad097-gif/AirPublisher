

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useModal } from '@/components/providers/modal-provider'

interface VideoActionsProps {
  videoId: string
  initialLikeCount?: number
  initialLiked?: boolean
  onCommentAdded?: () => void
}

export function VideoActions({ videoId, initialLikeCount = 0, initialLiked = false, onCommentAdded }: VideoActionsProps) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [togglingLike, setTogglingLike] = useState(false)
  const { showToast } = useModal()

  // Fetch like status on mount
  useEffect(() => {
    fetch(`/api/videos/${videoId}/like`)
      .then(res => res.json())
      .then(data => {
        if (data.liked !== undefined) {
          setLiked(data.liked)
        }
        if (data.likeCount !== undefined) {
          setLikeCount(data.likeCount)
        }
      })
      .catch(console.error)
  }, [videoId])

  const handleLike = async () => {
    if (togglingLike) return

    setTogglingLike(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.error) {
        showToast({ message: data.error, type: 'error' })
        return
      }

      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (error) {
      console.error('Error toggling like:', error)
      showToast({ message: 'Failed to like video. Please try again.', type: 'error' })
    } finally {
      setTogglingLike(false)
    }
  }

  const loadComments = async () => {
    if (loadingComments) return

    setLoadingComments(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`)
      const data = await response.json()

      if (data.comments) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentText.trim() || postingComment) return

    setPostingComment(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_text: commentText }),
      })

      const data = await response.json()

      if (data.error) {
        showToast({ message: data.error, type: 'error' })
        return
      }

      if (data.comment) {
        setComments([data.comment, ...comments])
        setCommentText('')
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      showToast({ message: 'Failed to post comment. Please try again.', type: 'error' })
    } finally {
      setPostingComment(false)
    }
  }

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to video page when clicking comment icon
    navigate(`/videos/${videoId}`)
  }

  const toggleComments = () => {
    if (!showComments) {
      loadComments()
    }
    setShowComments(!showComments)
  }

  return (
    <div className="space-y-3">
      {/* Like and Comment Buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={togglingLike}
          className="flex items-center gap-2"
        >
          <Heart
            className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`}
          />
          <span>{formatNumber(likeCount)}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCommentClick}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{formatNumber(comments.length)}</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border pt-3 space-y-3">
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={postingComment}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim() || postingComment}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-4 text-foreground/50 text-sm">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-foreground/50 text-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-primary font-semibold">
                      {comment.creator?.display_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.creator?.display_name || 'Unknown Creator'}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {comment.comment_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

