'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { formatDate } from '@/lib/utils';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, file?: File) => void;
  title?: string;
  /** When true, hide send input (e.g. admin monitoring customer chat) */
  readOnly?: boolean;
}

export function ChatWindow({ messages, onSendMessage, title, readOnly }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { t, locale } = useLocale();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() || selectedFile) {
      onSendMessage(inputValue, selectedFile || undefined);
      setInputValue('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Card variant="elevated" padding="none" className="flex flex-col min-h-[300px] h-[60vh] sm:h-[600px]">
      {title && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 shrink-0">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500">
            {t('chat.noMessages')}
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${
                      isOwn ? 'text-white/80' : 'text-neutral-600'
                    }`}>
                      {message.senderNameKey ? t(message.senderNameKey) : message.senderName}
                    </span>
                  </div>
                  {message.fileUrl && (
                    <div className="mb-2">
                      {message.fileType?.startsWith('image/') ? (
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={message.fileUrl} alt={message.fileName || ''} className="max-w-full max-h-48 rounded object-contain" />
                        </a>
                      ) : (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={message.fileName}
                          className="text-sm underline"
                        >
                          {message.fileName || t('chat.file')} ({message.fileType?.includes('pdf') ? 'Preview/Download' : 'Download'})
                        </a>
                      )}
                    </div>
                  )}
                  {message.content ? <p className="text-sm">{message.content}</p> : null}
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-white/70' : 'text-neutral-500'
                  }`}>
                    {formatDate(message.timestamp, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {!readOnly && (
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-200 space-y-2 shrink-0">
        {selectedFile && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 min-w-0">
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="truncate">{selectedFile.name}</span>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-error hover:text-red-700 shrink-0"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-neutral-50 rounded-xl cursor-pointer transition-colors shrink-0"
          >
            <Paperclip className="w-5 h-5 text-neutral-600" />
          </label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chat.typeMessage')}
            className="flex-1 min-w-0"
          />
          <Button onClick={handleSend} variant="primary" size="medium" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      )}
    </Card>
  );
}
