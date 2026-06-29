import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteDialogProps {
  onConfirm: () => Promise<void> | void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function ConfirmDeleteDialog({ onConfirm, children, title = 'Confirmar exclusão', description = 'Tem certeza que deseja excluir este item? Esta operação não pode ser desfeita.' }: ConfirmDeleteDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { /* close handled by dialog */ }}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Excluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDeleteDialog;
