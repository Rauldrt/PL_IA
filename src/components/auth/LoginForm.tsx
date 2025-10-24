'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';

import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} size="lg">
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <>
          Iniciar Sesión <ArrowRight />
        </>
      )}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, { message: '', success: false });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Éxito',
        description: state.message,
      });
      window.localStorage.setItem('isLoggedIn', 'true');
      router.push('/chat');
    } else if (state.message && !state.success) {
      toast({
        title: 'Error de inicio de sesión',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, router, toast]);
  
  return (
    <Card className="w-full">
      <form action={formAction}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="usuario"
              required
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="contraseña"
              required
              className="text-base"
            />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
