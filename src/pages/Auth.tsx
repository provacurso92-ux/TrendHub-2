import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Flame } from 'lucide-react';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username || !fullName) {
          toast.error('Por favor, preencha todos os campos');
          return;
        }
        await signUp(email, password, username, fullName);
        toast.success('Conta criada! Verifique seu email.');
      } else {
        await signIn(email, password);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <CardHeader className="text-center text-zinc-900 dark:text-zinc-100">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-[#8B5CF6] flex items-center justify-center shadow-lg">
              <Flame className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            TrendHub
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            {isSignUp ? 'Crie sua conta e entre nas trends' : 'Entre e explore as trends'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-700" disabled={loading}>
              {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#2563EB] dark:text-[#06B8D4] hover:underline block w-full"
            >
              {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
            {!isSignUp && (
              <Link to="/forgot-password" className="text-[#2563EB] dark:text-[#06B8D4] hover:underline block">
                Esqueceu sua senha?
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
