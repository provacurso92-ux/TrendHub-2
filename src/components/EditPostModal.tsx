import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditPostModalProps {
  post: any;
  updatePost: any;
  children: React.ReactNode;
}

export function EditPostModal({ post, updatePost, children }: EditPostModalProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(post?.content || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setContent(post?.content || '');
  }, [post]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Conteúdo vazio');
      return;
    }
    setIsSaving(true);
    try {
      await updatePost.mutateAsync({ id: post.id, updates: { content } });
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Conteúdo</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditPostModal;
