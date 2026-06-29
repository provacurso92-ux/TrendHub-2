import { type FormEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, UserMinus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityMembership, useCommunityMembersCount, useCommunities } from '@/hooks/useCommunities';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

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

interface CommunityCardProps {
  community: any;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { deleteCommunity, updateCommunity } = useCommunities();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState(community.name ?? '');
  const [editDescription, setEditDescription] = useState(community.description ?? '');
  const [editCategory, setEditCategory] = useState(community.category ?? categories[0]);
  const [editAvatarUrl, setEditAvatarUrl] = useState(community.avatar_url ?? '');
  const [editBannerUrl, setEditBannerUrl] = useState(community.banner_url ?? '');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { isMember, isAdmin, isLoading, joinCommunity, leaveCommunity } = useCommunityMembership(community.id);
  const membersCount = useCommunityMembersCount(community.id);
  const isOwner = profile?.id && (profile.id === community.creator_id || profile.id === community.creator?.id);

  useEffect(() => {
    setEditName(community.name ?? '');
    setEditDescription(community.description ?? '');
    setEditCategory(community.category ?? categories[0]);
    setEditAvatarUrl(community.avatar_url ?? '');
    setEditBannerUrl(community.banner_url ?? '');
  }, [community]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isLoading) return;
    if (isMember) {
      navigate(`/communities/${community.id}`);
    }
  };

  const handleJoin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await joinCommunity.mutateAsync();
      navigate(`/communities/${community.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowLeaveConfirm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!community.id) return;

    try {
      await updateCommunity.mutateAsync({
        id: community.id,
        updates: {
          name: editName,
          description: editDescription,
          category: editCategory,
          avatar_url: editAvatarUrl || null,
          banner_url: editBannerUrl || null,
        },
      });
      setShowEditDialog(false);
      setMenuOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteConfirm = async () => {
    setMenuOpen(false);
    await deleteCommunity.mutateAsync(community.id);
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={`overflow-hidden transition-all duration-300 ${isMember ? 'cursor-pointer hover:shadow-lg hover:opacity-95' : 'cursor-default'}`}
      >
        {/* Banner */}
        {community.banner_url ? (
          <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${community.banner_url})` }} />
        ) : (
          <div className="h-32 bg-cyan-600" />
        )}

        {/* Content */}
        <div className="p-4 -mt-12">
          <div className="flex items-end justify-between mb-4">
            <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-950 shadow-lg">
              <AvatarImage src={community.avatar_url || ''} />
              <AvatarFallback className="bg-cyan-600 text-white text-2xl">
                <Users className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              {!isMember ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleJoin}
                  disabled={joinCommunity.isPending || isLoading}
                >
                  {joinCommunity.isPending ? 'Carregando...' : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Participar
                    </>
                  )}
                </Button>
              ) : (
                !isAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleLeave}
                    disabled={leaveCommunity.isPending || isLoading}
                  >
                    {leaveCommunity.isPending ? 'Saindo...' : (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Sair
                      </>
                    )}
                  </Button>
                )
              )}

              {isOwner && (
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((prev) => !prev);
                    }}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 z-50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditDialog(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <ConfirmDeleteDialog onConfirm={handleDeleteConfirm}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCommunity.mutate(community.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </ConfirmDeleteDialog>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {community.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {community.category}
              </p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {community.description}
            </p>

            <div className="flex items-center gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{membersCount} membros</span>
              </div>
              <span>•</span>
              <span>{community.status === 'active' ? 'Ativa' : 'Arquivada'}</span>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sair da comunidade?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Você não verá mais as publicações desta comunidade.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await leaveCommunity.mutateAsync();
                } catch (error) {
                  console.error(error);
                } finally {
                  setShowLeaveConfirm(false);
                }
              }}
            >
              Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar comunidade</DialogTitle>
            <DialogDescription>Altere o nome, descrição ou categoria da comunidade.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="community-name" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Nome
              </label>
              <input
                id="community-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="community-category" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Categoria
              </label>
              <select
                id="community-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="community-description" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Descrição
              </label>
              <textarea
                id="community-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="flex w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateCommunity.isPending}>
                {updateCommunity.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
