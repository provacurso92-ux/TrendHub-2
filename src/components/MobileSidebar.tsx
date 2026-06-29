import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home, Search, Users, Trophy, MessageCircle, Bookmark, MoreHorizontal, Settings, Sun, Moon, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function MobileSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Explorar', path: '/search' },
    { icon: Users, label: 'Comunidades', path: '/communities' },
    { icon: Trophy, label: 'Desafios', path: '/challenges' },
    { icon: MessageCircle, label: 'Mensagens', path: '/messages' },
    { icon: Bookmark, label: 'Salvos', path: '/saved' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center px-1 py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2 transition-all text-[10px] ${
                isActive(item.path)
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex-1 min-w-0 flex flex-col items-center gap-1 py-2 text-[10px] text-gray-600 dark:text-gray-400"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-950 rounded-t-3xl p-6 space-y-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                navigate('/settings');
                setDrawerOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Settings className="h-5 w-5" />
              Configurações
            </button>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setDrawerOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </button>
            {profile?.username && (
              <button
                type="button"
                onClick={() => {
                  navigate(`/profile/${profile.username}`);
                  setDrawerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <User className="h-5 w-5" />
                Perfil
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                await signOut();
                setDrawerOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}
