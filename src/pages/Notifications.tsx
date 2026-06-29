import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Heart, MessageCircle, Users, UserPlus } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export function Notifications() {
  const { notifications, isLoading, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-600" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-violet-600" />;
      case 'community':
        return <Users className="h-5 w-5 text-cyan-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-violet-600" />
            Notificações
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-2">
        {isLoading ? (
          <Card className="p-12">
            <p>Carregando...</p>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Você não tem notificações novas
            </p>
          </Card>
        ) : (
          notifications.map((notification: any) => (
          <Card
            key={notification.id}
            onClick={() => {
              if (!notification.read) markAsRead.mutate(notification.id);
              if (notification.reference_id) navigate(`/post/${notification.reference_id}`);
            }}
            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
              !notification.read ? 'border-l-4 border-violet-600' : ''
            }`}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={notification.actor?.avatar_url || ''} />
                <AvatarFallback className="bg-violet-600 text-white">
                  {notification.actor?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm">
                  <span className="font-bold">{notification.actor?.username}</span>
                  {' '}{notification.content}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
          ))
        )}
      </div>
    </div>
  );
}
