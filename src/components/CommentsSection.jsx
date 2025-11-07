
import React, { useState, memo, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/useToast';
import { Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const CommentsSection = memo(({ requisitionId, comments = [], onAddComment, onDeleteComment }) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = {
        id: `comment-${Date.now()}`,
        requisitionId,
        userId: user.id,
        userName: user.full_name,
        userAvatar: user.avatar_url,
        message: newComment.trim(),
        timestamp: new Date().toISOString(),
      };

      if (onAddComment) {
        await onAddComment(comment);
      }
      setNewComment('');
      toast({
        title: 'Comentario agregado',
        description: 'Tu comentario ha sido publicado.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback((commentId) => {
    if (onDeleteComment) {
      onDeleteComment(commentId);
      toast({
        title: 'Comentario eliminado',
        description: 'El comentario ha sido eliminado.',
        variant: 'info',
      });
    }
  }, [onDeleteComment, toast]);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
          <AvatarFallback>{user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newComment.trim() || isSubmitting} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-8 italic"
            >
              No hay comentarios aún. Sé el primero en comentar.
            </motion.p>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3 p-4 bg-muted/50 rounded-xl"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                  <AvatarFallback>{comment.userName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{comment.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                    {comment.userId === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.message}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

CommentsSection.displayName = 'CommentsSection';

export default CommentsSection;

