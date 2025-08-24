'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, User, Bot } from 'lucide-react';
import { generateSessionId } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatUIProps {
  patientId?: string;
  userRole?: 'patient' | 'doctor' | 'admin' | 'nurse';
}

export function ChatUI({ patientId, userRole = 'patient' }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session on component mount
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm your hospital AI assistant. I can help you with:\n\n• Booking and managing appointments\n• Checking doctor availability\n• Answering questions about our services\n• Providing information about insurance and billing\n• Assessing symptoms and triage\n\nHow can I assist you today?`,
      timestamp: new Date()
    }]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          patientId,
          userRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our staff directly.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm your hospital AI assistant. I can help you with:\n\n• Booking and managing appointments\n• Checking doctor availability\n• Answering questions about our services\n• Providing information about insurance and billing\n• Assessing symptoms and triage\n\nHow can I assist you today?`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6" />
          <div>
            <h1 className="text-lg font-semibold">Hospital AI Assistant</h1>
            <p className="text-sm opacity-90">Powered by Groq AI</p>
          </div>
        </div>
        <Button
          onClick={clearChat}
          className="p-2 rounded-full hover:bg-blue-700 transition-colors"
          title="Start new conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            content={message.content}
            role={message.role}
            timestamp={message.timestamp}
          />
        ))}
        
        {isLoading && (
          <MessageBubble
            content=""
            role="assistant"
            isTyping={true}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
