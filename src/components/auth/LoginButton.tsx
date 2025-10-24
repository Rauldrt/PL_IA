'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = () => {
    toast({
      title: 'Éxito',
      description: 'Inicio de sesión exitoso.',
    });
    window.localStorage.setItem('isLoggedIn', 'true');
    router.push('/chat');
  };
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Button onClick={handleLogin} className="w-full" size="lg">
            Iniciar Sesión <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
