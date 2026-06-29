import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Flame, ArrowLeft, Mail } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, digite seu email');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email');
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
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {sent ? 'Email Enviado!' : 'Recuperar Senha'}
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            {sent 
              ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha'
              : 'Digite seu email para receber as instruções de recuperação'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-[#06B8D4] flex items-center justify-center">
                  <Mail className="h-10 w-10 text-white" />
                </div>
              </div>
              <p className="text-center text-sm text-[#64748B]">
                Um email foi enviado para <strong className="text-zinc-900 dark:text-zinc-100">{email}</strong>
              </p>
              <p className="text-center text-xs text-[#64748B]">
                Não recebeu? Verifique sua pasta de spam ou tente novamente em alguns minutos.
              </p>
              <Link to="/auth" className="block">
                <Button className="w-full border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-700" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </Button>
              <Link to="/auth" className="block">
                <Button type="button" variant="ghost" className="w-full text-[#2563EB] dark:text-[#06B8D4]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para o Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
