import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { Trash2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommentsListProps {
  postId: string;
}

export function CommentsList({ postId }: CommentsListProps) {
  const { user } = useAuth();
  const { comments, isLoading, createComment, deleteComment } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment.mutateAsync(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500 dark:text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />
        <Button type="submit" size="icon" disabled={!newComment.trim() || isSubmitting}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <Link to={`/profile/${comment.profile?.username}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-violet-600 text-white text-xs">
                    {comment.profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/profile/${comment.profile?.username}`}
                      className="font-semibold text-sm hover:underline text-gray-900 dark:text-gray-100"
                    >
                      {comment.profile?.full_name || comment.profile?.username}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  {comment.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => deleteComment.mutate(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-1 text-gray-900 dark:text-gray-100">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
