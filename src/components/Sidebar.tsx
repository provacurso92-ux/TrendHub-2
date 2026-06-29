import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Home,
  Search,
  Users,
  Trophy,
  MessageCircle,
  Bell,
  User,
  Settings,
  Moon,
  Sun,
  Flame,
  LogOut,
  Plus,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CreatePostModal from './CreatePostModal';

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado!');
      navigate('/auth');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Explorar', path: '/search' },
    { icon: Users, label: 'Comunidades', path: '/communities' },
    { icon: Trophy, label: 'Desafios', path: '/challenges' },
    { icon: MessageCircle, label: 'Mensagens', path: '/messages' },
    { icon: Bell, label: 'Notificações', path: '/notifications' },
    { icon: Bookmark, label: 'Posts Salvos', path: '/saved' },
    { icon: User, label: 'Perfil', path: `/profile/${profile?.username}` },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
            TrendHub
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isActive(item.path)
                ? 'bg-violet-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}

        {/* New Post Button */}
        <div className="w-full mt-4">
          <CreatePostModal />
        </div>
      </nav>

      {/* User Profile & Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            className="rounded-full"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <Link to={`/profile/${profile?.username}`}>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <Avatar className="h-10 w-10 ring-2 ring-violet-600 ring-offset-2 dark:ring-offset-gray-950">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-violet-600 text-white">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {profile?.full_name || profile?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{profile?.username}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
