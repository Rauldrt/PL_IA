'use client';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { LoaderCircle } from 'lucide-react';

interface WelcomeScreenProps {
  suggestedMessages: string[];
  onSuggestionClick: (message: string) => void;
  isLoading: boolean;
}

export function WelcomeScreen({
  suggestedMessages,
  onSuggestionClick,
  isLoading,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 pt-16 text-center">
      <div className="relative">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary to-accent opacity-75 blur"></div>
        <div className="relative rounded-lg bg-card p-6 shadow-lg">
          <Logo className="h-16 w-16 text-primary" />
        </div>
      </div>
      <h2 className="font-headline text-3xl font-bold text-foreground">
        ¿Cómo puedo ayudarte hoy?
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center pt-4">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-sm text-muted-foreground">Generando sugerencias...</p>
        </div>
      ) : (
        suggestedMessages.length > 0 && (
          <div className="w-full max-w-lg space-y-3 pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              O prueba una de estas sugerencias:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedMessages.slice(0, 4).map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="bg-card hover:bg-muted"
                  onClick={() => onSuggestionClick(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
