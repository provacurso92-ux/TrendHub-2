import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // realtime
  useEffect(() => {
    const globalAny: any = globalThis as any;
    if (!globalAny.__trendhub_notification_channels) globalAny.__trendhub_notification_channels = new Map();
    const notifChannels: Map<string, any> = globalAny.__trendhub_notification_channels;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // avoid creating multiple channels for same user
        if (notifChannels.has(user.id)) return;

        const channelName = `notifications-${user.id}-${Math.random().toString(36).slice(2)}`;
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => {
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
          )
          .subscribe((status: any) => {
            if (status?.error) console.error('notifications subscribe error', status.error);
            else console.debug('subscribed to notifications channel', channelName);
          });

        notifChannels.set(user.id, channel);
      } catch (err) {
        console.error('useNotifications realtime error', err);
      }
    })();

    return () => {
      try {
        const { data: { user } } = supabase.auth.getUser();
        if (user && notifChannels.has(user.id)) {
          const ch = notifChannels.get(user.id);
          try { ch.unsubscribe(); } catch (e) { console.warn('notif unsubscribe', e); }
          notifChannels.delete(user.id);
        }
      } catch (e) {
        /* ignore */
      }
    };
  }, [queryClient]);

  return { notifications: notifications || [], isLoading, markAsRead };
}

export default useNotifications;
