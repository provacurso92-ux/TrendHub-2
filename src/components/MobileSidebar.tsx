import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Users, Trophy, MessageCircle, User, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MobileSidebar() {
  const location = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Explorar', path: '/search' },
    { icon: Users, label: 'Comunidades', path: '/communities' },
    { icon: Trophy, label: 'Desafios', path: '/challenges' },
    { icon: MessageCircle, label: 'Mensagens', path: '/messages' },
    { icon: Bookmark, label: 'Salvos', path: '/saved' },
    { icon: User, label: 'Perfil', path: `/profile/${profile?.username}` },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive(item.path)
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
