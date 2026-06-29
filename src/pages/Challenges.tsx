import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trophy, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

function parseDateValue(dateValue: string | null) {
  if (!dateValue) return null;

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(dateValue: string | null) {
  const parsed = parseDateValue(dateValue);
  if (!parsed) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getChallengeStatus(challenge: any) {
  if (challenge.status === 'cancelled' || challenge.status === 'canceled') return 'cancelado';
  if (challenge.status === 'completed') return 'concluido';

  const now = Date.now();
  const deadlineTime = new Date(challenge.end_date || challenge.created_at).getTime();

  if (now < deadlineTime) return 'em_andamento';
  return 'concluido';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'em_andamento':
      return { label: 'Em andamento', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
    case 'concluido':
      return { label: 'Concluído', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
    case 'cancelado':
      return { label: 'Cancelado', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' };
    default:
      return { label: 'A fazer', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  }
}

export function Challenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const minDate = new Date().toISOString().slice(0, 16);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [maxParticipants, setMaxParticipants] = useState(100);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          creator:profiles!creator_id(*),
          participants:challenge_participants(
            id,
            user_id,
            profiles!user_id(username, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((challenge: any) => ({
        ...challenge,
        status: getChallengeStatus(challenge),
      }));
    },
  });

  const createChallenge = useMutation({
    mutationFn: async (payload: any) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('challenges')
        .insert([{ ...payload, creator_id: user.id }] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Desafio criado com sucesso!');
      setOpen(false);
      setTitle('');
      setDescription('');
      setStartDate(new Date().toISOString().slice(0, 16));
      setEndDate(defaultEndDate);
      setMaxParticipants(100);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar desafio');
    },
  });

  const toggleParticipation = useMutation({
    mutationFn: async ({ challengeId, isParticipating }: { challengeId: string; isParticipating: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isParticipating) {
        const { error } = await supabase
          .from('challenge_participants')
          .delete()
          .eq('challenge_id', challengeId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('challenge_participants')
          .insert({ challenge_id: challengeId, user_id: user.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar participação');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !description.trim() || !startDate || !endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const parsedStartDate = parseDateValue(startDate);
    const parsedEndDate = parseDateValue(endDate);

    if (!parsedStartDate || !parsedEndDate) {
      toast.error('A data informada não é válida');
      return;
    }

    if (parsedEndDate.getTime() <= parsedStartDate.getTime()) {
      toast.error('A data de encerramento precisa ser após a data de início');
      return;
    }

    createChallenge.mutate({
      title: title.trim(),
      description: description.trim(),
      start_date: parsedStartDate.toISOString(),
      end_date: parsedEndDate.toISOString(),
      max_participants: Number(maxParticipants),
      status: 'a_fazer',
    });
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            Desafios Criativos
          </h1>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Criar Desafio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar desafio</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex.: 7 dias de criatividade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Descreva o desafio"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de início</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      min={minDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de encerramento</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      min={startDate}
                      onChange={(event) => setEndDate(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Máximo de participantes</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(event) => setMaxParticipants(Number(event.target.value))}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createChallenge.isPending}>
                    {createChallenge.isPending ? 'Criando...' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!isLoading && challenges.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum desafio ainda
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Seja o primeiro a criar um desafio criativo!
            </p>
          </Card>
        )}

        {!isLoading && challenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge: any) => {
              const status = getChallengeStatus(challenge);
              const badge = getStatusBadge(status);
              const currentParticipants = challenge.participants?.length || 0;
              const maxParticipants = 100;
              const progress = Math.min(100, Math.round((currentParticipants / maxParticipants) * 100));
              const isParticipating = (challenge.participants || []).some((participant: any) => participant.user_id === user?.id);
              const visibleParticipants = (challenge.participants || []).slice(0, 4);

              return (
                <Card key={challenge.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:opacity-95">
                  <div className="h-24 bg-[#06B8D4]" />

                  <div className="p-4 -mt-12">
                    <div className="flex items-end justify-between mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white/95 shadow-lg dark:border-gray-950">
                        <Trophy className="h-8 w-8 text-blue-600" />
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Desafio
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {challenge.creator?.full_name || challenge.creator?.username || 'Criador'}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {challenge.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Progresso</span>
                          <span>{currentParticipants}/{maxParticipants}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(challenge.end_date || challenge.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <div className="flex -space-x-2">
                          {visibleParticipants.map((participant: any) => (
                            <Avatar key={participant.id} className="h-8 w-8 border-2 border-white dark:border-gray-950">
                              <AvatarImage src={participant.profiles?.avatar_url || ''} />
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {participant.profiles?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {currentParticipants > visibleParticipants.length && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-semibold text-gray-700 dark:border-gray-950 dark:bg-gray-800 dark:text-gray-300">
                              +{currentParticipants - visibleParticipants.length}
                            </div>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={isParticipating ? 'outline' : 'default'}
                          disabled={!user || toggleParticipation.isPending}
                          onClick={() =>
                            toggleParticipation.mutate({
                              challengeId: challenge.id,
                              isParticipating,
                            })
                          }
                        >
                          {toggleParticipation.isPending ? 'Carregando...' : isParticipating ? 'Participando' : 'Participar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
