import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useTypingIndicator(conversationId: string | null, user: any) {
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const typingChannelRef = useRef<any | null>(null);
  const typingTimeoutRef = useRef<any | null>(null);
  const subscribedRef = useRef(false);
  const pendingTrackRef = useRef(false);

  useEffect(() => {
    // Clear when conversation changes
    setTypingUsers([]);

    if (!conversationId || !user?.id) return;

    // Cleanup existing channel if present
    if (typingChannelRef.current) {
      try {
        supabase.removeChannel(typingChannelRef.current);
      } catch (e) {
        // ignore
      }
      typingChannelRef.current = null;
      subscribedRef.current = false;
      pendingTrackRef.current = false;
    }

    const channelName = `typing:${conversationId}:${user.id}`;
    const channel = supabase.channel(channelName, { config: { presence: { key: user.id } } });
    typingChannelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      try {
        const state = channel.presenceState();
        const flattened = Object.values(state).flat();
        const othersTyping = (flattened as any[]).filter((p: any) => p.user_id !== user.id);
        setTypingUsers(othersTyping);

        // keep a global map for other parts of the UI (conversation list)
        try {
          const globalAny: any = globalThis as any;
          if (!globalAny.__trendhub_typing_states) globalAny.__trendhub_typing_states = new Map();
          globalAny.__trendhub_typing_states.set(conversationId, othersTyping);
          // emit event for listeners
          window.dispatchEvent(new CustomEvent('trendhub:typing', { detail: { conversationId, typingUsers: othersTyping } }));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        console.error('presence sync error', e);
      }
    });

    channel.on('presence', { event: 'leave' }, () => {
      setTypingUsers([]);
    });

    channel.subscribe((status: any) => {
      if (status === 'SUBSCRIBED') {
        subscribedRef.current = true;
        // If we had a pending track request, send it now
        if (pendingTrackRef.current) {
          try {
            channel.track({ user_id: user.id, username: user.username, avatar_url: user.avatar_url, is_typing: true });
            pendingTrackRef.current = false;
          } catch (e) {
            console.error('failed to track after subscribe', e);
          }
        }
      }
      if (status?.error) console.error('typing channel status error', status.error);
    });

    return () => {
      try {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        channel.untrack?.();
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore cleanup errors
      }
      try {
        const globalAny: any = globalThis as any;
        if (globalAny.__trendhub_typing_states) globalAny.__trendhub_typing_states.delete(conversationId);
        window.dispatchEvent(new CustomEvent('trendhub:typing', { detail: { conversationId, typingUsers: [] } }));
      } catch (e) {
        // ignore
      }
      typingChannelRef.current = null;
      subscribedRef.current = false;
      pendingTrackRef.current = false;
      setTypingUsers([]);
    };
  }, [conversationId, user?.id]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    try {
      typingChannelRef.current?.untrack?.();
    } catch (e) {
      // ignore
    }
    setTypingUsers([]);
    pendingTrackRef.current = false;
  }, []);

  const startTyping = useCallback(() => {
    if (!typingChannelRef.current) return;

    // If not subscribed yet, mark pending and return
    if (!subscribedRef.current) {
      pendingTrackRef.current = true;
    } else {
      try {
        typingChannelRef.current.track({ user_id: user.id, username: user.username, avatar_url: user.avatar_url, is_typing: true });
      } catch (e) {
        // ignore
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current as any);
    typingTimeoutRef.current = setTimeout(() => {
      // stop typing after 2s of inactivity
      try {
        typingChannelRef.current?.untrack?.();
      } catch (e) {
        // ignore
      }
      setTypingUsers([]);
      pendingTrackRef.current = false;
    }, 2000);
  }, [user?.id]);

  return { typingUsers, startTyping, stopTyping };
}

export default useTypingIndicator;
