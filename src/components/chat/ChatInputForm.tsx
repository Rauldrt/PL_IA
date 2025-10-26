'use client';

import { CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputFormProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  handleSendMessage: (message: string) => void;
}

export default function ChatInputForm({
  input,
  setInput,
  isLoading,
  handleSendMessage,
}: ChatInputFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <footer className="sticky bottom-0 border-t bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
            placeholder="Escribe tu mensaje aquí..."
            className="min-h-[48px] resize-none rounded-2xl border-2 border-input bg-card pr-16 text-base shadow-sm"
            disabled={isLoading}
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-accent disabled:bg-muted disabled:text-muted-foreground"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensaje"
          >
            <CornerDownLeft className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </footer>
  );
}
