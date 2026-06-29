import { type MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { useCommunityMembership, useCommunityMembersCount } from '@/hooks/useCommunities';

interface CommunityCardProps {
  community: any;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { isMember, isAdmin, isLoading, joinCommunity, leaveCommunity } = useCommunityMembership(community.id);
  const membersCount = useCommunityMembersCount(community.id);

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
            <div className="space-x-2">
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
    </>
  );
}
