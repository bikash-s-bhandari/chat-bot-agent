'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
  isTyping?: boolean;
}

export function MessageBubble({ content, role, timestamp, isTyping = false }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="/bot-avatar.png" alt="AI Assistant" />
          <AvatarFallback className="bg-blue-500 text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-3',
        isUser 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-900 rounded-bl-none'
      )}>
        <div className="whitespace-pre-wrap text-sm">
          {isTyping ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            content
          )}
        </div>
        
        {timestamp && (
          <div className={cn(
            'text-xs mt-2 opacity-70',
            isUser ? 'text-blue-100' : 'text-gray-500'
          )}>
            {timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback className="bg-gray-500 text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
