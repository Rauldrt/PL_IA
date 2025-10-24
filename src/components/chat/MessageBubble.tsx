import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Message } from '@/lib/types';

export default function MessageBubble({ message }: { message: Message }) {
  const aiAvatar = PlaceHolderImages.find((p) => p.id === 'ai-avatar');
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-4 sm:gap-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 border">
          {aiAvatar && <AvatarImage src={aiAvatar.imageUrl} alt="AI Avatar" data-ai-hint={aiAvatar.imageHint} />}
          <AvatarFallback>IA</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-4 py-3 text-sm shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarFallback>
            <User size={16} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
