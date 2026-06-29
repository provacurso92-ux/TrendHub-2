import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { useCommunities } from '@/hooks/useCommunities';
import { Plus } from 'lucide-react';

const categories = [
  'Tecnologia',
  'Arte',
  'Música',
  'Esportes',
  'Jogos',
  'Educação',
  'Culinária',
  'Viagens',
  'Moda',
  'Outros',
];

export function CreateCommunityDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [rules, setRules] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const { createCommunity } = useCommunities();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description) {
      return;
    }

    try {
      await createCommunity.mutateAsync({
        name,
        description,
        category,
        rules: rules || undefined,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined,
      });

      setName('');
      setDescription('');
      setCategory(categories[0]);
      setRules('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Comunidade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="flex flex-col max-h-[85vh]">
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold">Criar Nova Comunidade</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Crie uma comunidade para reunir pessoas com interesses em comum
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <form id="create-community-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Avatar da Comunidade (opcional)</Label>
                <ImageUpload bucket="communities" onUploadComplete={(url) => setAvatarUrl(url)} />
                {avatarUrl && <p className="text-sm text-gray-500">Avatar pronto</p>}
              </div>

              <div className="space-y-2">
                <Label>Banner da Comunidade (opcional)</Label>
                <ImageUpload bucket="banners" onUploadComplete={(url) => setBannerUrl(url)} />
                {bannerUrl && <p className="text-sm text-gray-500">Banner pronto</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome da Comunidade *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Fãs de JavaScript"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito da comunidade..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {description.length}/500 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Regras (opcional)</Label>
                <Textarea
                  id="rules"
                  placeholder="Regras e diretrizes da comunidade..."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  rows={3}
                />
              </div>
            </form>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="create-community-form" disabled={createCommunity.isPending}>
              {createCommunity.isPending ? 'Criando...' : 'Criar Comunidade'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
