import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import useTypingIndicator from '@/hooks/useTypingIndicator';

// Simple in-memory cache for profiles fetched via realtime payloads
const profilesCache: Record<string, any> = {};

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            participant_one:profiles!participant_one_id(*),
            participant_two:profiles!participant_two_id(*)
          `)
          .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('useConversations fetch error:', error);
          return [];
        }
        return data;
      } catch (err) {
        console.error('useConversations unexpected error:', err);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Subscribe to conversations updates so the list refreshes in real-time
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Failed to remove conversations-list channel', e);
      }
    };
  }, [user?.id, queryClient]);

  return { conversations: conversations || [], isLoading };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for messages to allow realtime appends and optimistic updates
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      try {
        if (!conversationId) return [];

        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            post:post_id (
              id,
              content,
              image_url,
              video_url,
              user_id,
              profile:profiles!user_id (
                username,
                avatar_url
              )
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('useMessages fetch error:', error);
          return [];
        }
        return data;
      } catch (err) {
        console.error('useMessages unexpected error:', err);
        return [];
      }
    },
    enabled: !!conversationId,
    retry: false,
  });

  // When initial fetch completes, populate local messages
  useEffect(() => {
    setLocalMessages(initialMessages || []);
  }, [initialMessages]);

  // Helper to fetch and cache profiles for sender enrichment
  const fetchProfileIfNeeded = useCallback(async (senderId: string) => {
    if (!senderId) return null;
    if (profilesCache[senderId]) return profilesCache[senderId];
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', senderId)
        .single();
      profilesCache[senderId] = data;
      return data;
    } catch (e) {
      return null;
    }
  }, []);

  const sendMessage = useMutation({
    retry: false,
    onMutate: async (content: string) => {
      // optimistic update: add temp message
      const tempMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user?.id,
        content,
        created_at: new Date().toISOString(),
        isTemp: true,
      } as any;

      setLocalMessages((prev) => [...prev, tempMessage]);
      return { tempMessage };
    },
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error('No conversation selected');
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert([{ conversation_id: conversationId, sender_id: user.id, content }] as any)
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() } as any)
        .eq('id', conversationId);

      return data;
    },
    onSuccess: (realMessage: any, _vars, context: any) => {
      // Replace temporary message with the real one
      setLocalMessages((prev) => prev.map((m) => (m.id === context?.tempMessage?.id ? realMessage : m)));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (_err, _vars, context: any) => {
      // Remove temp message
      setLocalMessages((prev) => prev.filter((m) => m.id !== context?.tempMessage?.id));
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    },
  });

  const markAsRead = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!conversationId) return;
      if (!user?.id) return;

      const { error } = await supabase
        .from('messages')
        .update({ read: true } as any)
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onError: (error: any) => {
      console.error('Error marking messages as read:', error);
    },
  });

  // Setup realtime subscription
  // Track active subscriptions per conversation to avoid duplicate subscribe attempts
  // which can cause the "cannot add postgres_changes callbacks after subscribe" error
  const globalAny: any = globalThis as any;
  if (!globalAny.__trendhub_message_channels) globalAny.__trendhub_message_channels = new Map();
  const activeChannels: Map<string, any> = globalAny.__trendhub_message_channels;

  useEffect(() => {
    if (!conversationId) return;

    // If there's already an active channel for this conversation, don't recreate it
    if (activeChannels.has(conversationId)) {
      // ensure invalidation still happens when messages change
      return;
    }

    try {
      const channelName = `messages-${conversationId}-${Math.random().toString(36).slice(2)}`;
      const newChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload: any) => {
            try {
              let newMessage = payload.new as any;

              if (newMessage.post_id) {
                const { data: joinedMessage } = await supabase
                  .from('messages')
                  .select(`
                    *,
                    post:post_id (
                      id,
                      content,
                      image_url,
                      video_url,
                      user_id,
                      profile:profiles!user_id (
                        username,
                        avatar_url
                      )
                    )
                  `)
                  .eq('id', newMessage.id)
                  .maybeSingle();

                if (joinedMessage) {
                  newMessage = joinedMessage;
                }
              }

              // enrich sender profile if needed
              const profile = await fetchProfileIfNeeded(newMessage.sender_id);
              const enriched = { ...newMessage, senderProfile: profile };

              setLocalMessages((prev) => {
                if (prev.some((m) => m.id === enriched.id)) return prev;
                return [...prev, enriched];
              });

              // Also ensure conversations list is updated
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            } catch (e) {
              console.error('Error handling realtime message payload', e);
            }
          }
        )
        .subscribe((status: any) => {
          if (status?.error) console.error('subscribe error', status.error);
          else console.debug('subscribed to messages channel', channelName);
        });

      activeChannels.set(conversationId, newChannel);

      return () => {
        try {
          supabase.removeChannel(newChannel);
          activeChannels.delete(conversationId);
        } catch (e) {
          console.warn('Failed to unsubscribe from messages channel:', e);
        }
      };
    } catch (err) {
      console.error('useMessages setup realtime error:', err);
    }
  }, [conversationId, queryClient]);

  // Use dedicated hook for typing presence (handles subscribe-before-track, cleanup, debounce)
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(conversationId, user);

  return { messages: localMessages || [], isLoading, sendMessage, markAsRead, typingUsers, startTyping, stopTyping };
}

export function useCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createConversation = useMutation({
    retry: false,
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_one_id.eq.${user.id},participant_two_id.eq.${otherUserId}),and(participant_one_id.eq.${otherUserId},participant_two_id.eq.${user.id})`
        )
        .single();

      if (existing) return existing;

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          participant_one_id: user.id,
          participant_two_id: otherUserId,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar conversa');
    },
  });

  return createConversation;
}
