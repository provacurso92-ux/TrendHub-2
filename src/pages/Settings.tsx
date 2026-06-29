import { Card } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, HelpCircle } from 'lucide-react';

export function Settings() {
  const settingsGroups = [
    {
      title: 'Conta',
      icon: User,
      items: [
        { label: 'Editar Perfil', description: 'Nome, foto, biografia' },
        { label: 'Alterar Senha', description: 'Segurança da conta' },
        { label: 'Privacidade', description: 'Controle quem pode ver seu conteúdo' },
      ],
    },
    {
      title: 'Notificações',
      icon: Bell,
      items: [
        { label: 'Push Notifications', description: 'Receber notificações no navegador' },
        { label: 'Email', description: 'Notificações por email' },
        { label: 'Preferências', description: 'Escolha o que deseja receber' },
      ],
    },
    {
      title: 'Aparência',
      icon: Palette,
      items: [
        { label: 'Tema', description: 'Claro, escuro ou automático' },
        { label: 'Tamanho da Fonte', description: 'Ajustar legibilidade' },
      ],
    },
    {
      title: 'Segurança',
      icon: Shield,
      items: [
        { label: 'Autenticação em Dois Fatores', description: 'Proteja sua conta' },
        { label: 'Sessões Ativas', description: 'Dispositivos conectados' },
        { label: 'Bloqueios', description: 'Usuários bloqueados' },
      ],
    },
    {
      title: 'Ajuda',
      icon: HelpCircle,
      items: [
        { label: 'Central de Ajuda', description: 'Tire suas dúvidas' },
        { label: 'Reportar Problema', description: 'Nos ajude a melhorar' },
        { label: 'Sobre', description: 'Versão e informações' },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-gray-600" />
            Configurações
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
              <group.icon className="h-5 w-5 text-violet-600" />
              {group.title}
            </h2>
            <Card className="divide-y divide-gray-200 dark:divide-gray-800">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </Card>
          </div>
        ))}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <Palette className="h-5 w-5 text-violet-600" />
            Aparência
          </h2>
          <Card className="p-4">
            <ThemeToggle />
          </Card>
        </div>

        <div className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">Tema</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Claro ou Escuro (salvo localmente)</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded ${theme === 'light' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900'}`}
          onClick={() => setTheme('light')}
        >
          Claro
        </button>
        <button
          className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900'}`}
          onClick={() => setTheme('dark')}
        >
          Escuro
        </button>
        <button
          className="px-3 py-1 rounded bg-transparent border border-gray-300 dark:border-gray-700"
          onClick={toggleTheme}
        >
          Alternar
        </button>
      </div>
    </div>
  );
}
