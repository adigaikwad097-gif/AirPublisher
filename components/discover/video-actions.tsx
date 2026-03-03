import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { getCurrentCreator, getCreatorProfile } from '@/lib/db/creator'

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

    // Fetch like status on mount
    useEffect(() => {
        async function checkLikeStatus() {
            try {
                const creator = await getCurrentCreator()
                if (!creator) return

                const { data: like } = await supabase
                    .from('airpublisher_video_likes')
                    .select('id')
                    .eq('video_id', videoId)
                    .eq('creator_unique_identifier', creator.unique_identifier)
                    .maybeSingle()

                const { count } = await supabase
                    .from('airpublisher_video_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('video_id', videoId)

                setLiked(!!like)
                setLikeCount(count || 0)
            } catch (err) {
                console.error('Error checking like status:', err)
            }
        }
        checkLikeStatus()
    }, [videoId])

    const handleLike = async () => {
        if (togglingLike) return

        setTogglingLike(true)
        try {
            const creator = await getCurrentCreator()
            if (!creator) {
                alert('Unauthorized: Please create a creator profile first')
                return
            }

            if (liked) {
                // Unlike
                const { error } = await supabase
                    .from('airpublisher_video_likes')
                    .delete()
                    .eq('video_id', videoId)
                    .eq('creator_unique_identifier', creator.unique_identifier)

                if (error) throw error
            } else {
                // Like
                const { error } = await supabase
                    .from('airpublisher_video_likes')
                    .insert({
                        video_id: videoId,
                        creator_unique_identifier: creator.unique_identifier,
                    })

                if (error) throw error
            }

            // Update count
            const { count } = await supabase
                .from('airpublisher_video_likes')
                .select('*', { count: 'exact', head: true })
                .eq('video_id', videoId)

            setLiked(!liked)
            setLikeCount(count || 0)
        } catch (error) {
            console.error('Error toggling like:', error)
            alert('Failed to like video. Please try again.')
        } finally {
            setTogglingLike(false)
        }
    }

    const loadComments = async () => {
        if (loadingComments) return

        setLoadingComments(true)
        try {
            const { data: dbComments, error } = await supabase
                .from('airpublisher_video_comments')
                .select('*')
                .eq('video_id', videoId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Fetch creator profiles for each comment
            const commentsWithCreators = await Promise.all(
                (dbComments || []).map(async (comment: any) => {
                    try {
                        const creator = await getCreatorProfile(comment.creator_unique_identifier)
                        return {
                            ...comment,
                            creator: {
                                unique_identifier: creator.unique_identifier,
                                display_name: creator.display_name || 'Unknown Creator',
                                avatar_url: creator.avatar_url,
                            },
                        }
                    } catch {
                        return {
                            ...comment,
                            creator: {
                                unique_identifier: comment.creator_unique_identifier,
                                display_name: 'Unknown Creator',
                                avatar_url: null,
                            },
                        }
                    }
                })
            )

            setComments(commentsWithCreators)
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
            const currentCreator = await getCurrentCreator()
            if (!currentCreator) {
                alert('Unauthorized: Please create a creator profile first')
                return
            }

            const { data: comment, error } = await supabase
                .from('airpublisher_video_comments')
                .insert({
                    video_id: videoId,
                    creator_unique_identifier: currentCreator.unique_identifier,
                    comment_text: commentText.trim(),
                })
                .select()
                .single()

            if (error) throw error

            const creatorProfile = await getCreatorProfile(currentCreator.unique_identifier)

            const newComment = {
                ...comment,
                creator: {
                    unique_identifier: creatorProfile.unique_identifier,
                    display_name: creatorProfile.display_name || 'Unknown Creator',
                    avatar_url: creatorProfile.avatar_url,
                },
            }

            setComments([newComment, ...comments])
            setCommentText('')
            onCommentAdded?.()
        } catch (error) {
            console.error('Error posting comment:', error)
            alert('Failed to post comment. Please try again.')
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
