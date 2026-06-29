import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { useConversations, useMessages } from '@/hooks/useChat';
import { useCreateConversation } from '@/hooks/useChat';
import TypingIndicator from '@/components/TypingIndicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

export function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsReadRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const { conversations, isLoading: conversationsLoading } = useConversations();
  const [searchUsersQuery, setSearchUsersQuery] = useState('');
  const { messages, sendMessage, markAsRead, typingUsers, startTyping, stopTyping } = useMessages(selectedConversationId);
  const { data: userSearchResults } = useQuery({
    queryKey: ['message-user-search', searchUsersQuery],
    queryFn: async () => {
      if (!searchUsersQuery) return [];
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchUsersQuery}%`)
        .or(`full_name.ilike.%${searchUsersQuery}%`)
        .limit(10);
      return data || [];
    },
    enabled: searchUsersQuery.length > 0,
  });

  const createConversation = useCreateConversation();

  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId);
  const otherUser = selectedConversation
    ? selectedConversation.participant_one_id === user?.id
      ? selectedConversation.participant_two
      : selectedConversation.participant_one
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // scroll when typing indicator appears
  useEffect(() => {
    if (typingUsers && typingUsers.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typingUsers]);

  // Typing debounce
  const typingTimeoutRef = useRef<any>(null);
  const handleTypingChange = (value: string) => {
    setMessageText(value);
    startTyping();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  // Mark messages as read only once per conversation
  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;
    
    // Check if we've already marked this conversation as read
    if (hasMarkedAsReadRef.current.has(selectedConversationId)) return;
    
    // Mark it as done
    hasMarkedAsReadRef.current.add(selectedConversationId);
    
    // Call markAsRead mutation
    markAsRead.mutate();
  }, [selectedConversationId, user?.id, markAsRead]);

  // Clear the tracking when changing conversations
  useEffect(() => {
    return () => {
      // Don't clear on unmount, but this allows tracking across sessions
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    try {
      // stop typing immediately
      stopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      await sendMessage.mutateAsync(messageText);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-violet-600" />
            Mensagens
          </h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
          <div className="p-3">
            <Input
              placeholder="Buscar usuários para conversar..."
              value={searchUsersQuery}
              onChange={(e) => setSearchUsersQuery(e.target.value)}
              className="mb-2"
            />
            {searchUsersQuery && (
              <div className="space-y-2">
                {(userSearchResults || []).map((u: any) => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      try {
                        const conv = await createConversation.mutateAsync(u.id);
                        setSelectedConversationId(conv.id);
                        setSearchUsersQuery('');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback className="bg-violet-600 text-white">{u.username?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{u.full_name || u.username}</p>
                        <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {conversationsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma conversa ainda
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {conversations.map((conv: any) => {
                const other = conv.participant_one_id === user?.id
                  ? conv.participant_two
                  : conv.participant_one;
                const globalTypingStates: any = (window as any).__trendhub_typing_states || new Map();
                const typingStateForConv: any[] = globalTypingStates.get?.(conv.id) || [];
                const isOtherTyping = typingStateForConv.some((p: any) => p.user_id !== user?.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left ${
                      selectedConversationId === conv.id
                        ? 'bg-violet-50 dark:bg-violet-950/20 border-l-4 border-violet-600'
                        : ''
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={other?.avatar_url || ''} />
                      <AvatarFallback className="bg-violet-600 text-white">
                        {other?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-gray-900 dark:text-gray-100">
                        {other?.full_name || other?.username}
                      </p>
                      <div className="text-sm truncate">
                        {isOtherTyping ? (
                          <span className="text-purple-500 italic font-medium">Digitando...</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">@{other?.username}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedConversationId && otherUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.avatar_url || ''} />
                    <AvatarFallback className="bg-violet-600 text-white">
                      {otherUser?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {otherUser?.full_name || otherUser?.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{otherUser?.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma mensagem ainda. Seja o primeiro a enviar!
                    </p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isSender = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-2 ${
                            isSender
                              ? 'bg-violet-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none shadow-sm'
                          }`}
                        >
                          {msg.post ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 border-b border-zinc-700/70 pb-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={msg.post.profile?.avatar_url || ''} />
                                  <AvatarFallback className="bg-violet-600 text-white">
                                    {msg.post.profile?.username?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-zinc-200">@{msg.post.profile?.username}</span>
                              </div>

                              {msg.post.image_url && (
                                <img src={msg.post.image_url} alt="Post compartilhado" className="w-full max-h-48 object-cover rounded-lg" />
                              )}

                              {msg.post.video_url && !msg.post.image_url && (
                                <video src={msg.post.video_url} controls className="w-full max-h-48 rounded-lg" />
                              )}

                              <div className="p-1">
                                <p className="text-sm text-zinc-300 line-clamp-3">{msg.post.content}</p>
                              </div>

                              <div className="pt-1">
                                <span className="text-xs text-zinc-500">📎 Post compartilhado</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm break-words">{msg.content}</p>
                          )}
                          <span
                            className={`text-xs mt-1 block ${
                              isSender ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              
              {/* Typing indicator (other users) */}
              {typingUsers && typingUsers.length > 0 && (
                <div className="p-2">
                  <TypingIndicator typingUser={typingUsers[0]} />
                </div>
              )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageText}
                    onChange={(e) => handleTypingChange(e.target.value)}
                    disabled={sendMessage.isPending}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={sendMessage.isPending || !messageText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <MessageCircle className="h-16 w-16 mx-auto text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Selecione uma conversa para começar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
