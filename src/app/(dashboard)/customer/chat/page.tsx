'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockChats, mockChatMessages, mockEmployees } from '@/lib/mockData';
import { Chat, ChatMessage } from '@/types';

export default function CustomerChatPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const customerChats = mockChats.filter(c => c.type === 'customer_employee' && c.participantIds.includes(user?.id || ''));
  const [selectedChat, setSelectedChat] = useState<string | null>(customerChats[0]?.id || null);
  const [chats] = useState<Chat[]>(customerChats);
  const [messages, setMessages] = useState<ChatMessage[]>(
    mockChatMessages.filter(m => chats.some(c => c.id === m.chatId))
  );

  const selectedChatData = chats.find(c => c.id === selectedChat);
  const assignedEmployee = mockEmployees.find(e => 
    selectedChatData?.participantIds.includes(e.id) && e.id !== user?.id
  );

  const handleSendMessage = (content: string, file?: File) => {
    if (!selectedChat || !user) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId: selectedChat,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content,
      fileName: file?.name,
      fileType: file?.type,
      fileUrl: file ? URL.createObjectURL(file) : undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
  };

  if (chats.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">{t('common.chat')}</h1>
          <p className="text-neutral-600">{t('chat.withEmployee')}</p>
        </div>
        <Card variant="elevated" padding="large">
          <div className="text-center py-12">
            <p className="text-neutral-500">{t('chat.noChatAvailable')}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">{t('common.chat')}</h1>
        <p className="text-neutral-600">{t('chat.withEmployee')}</p>
      </div>

      {selectedChatData && assignedEmployee ? (
        <ChatWindow
          messages={messages.filter(m => m.chatId === selectedChat)}
          onSendMessage={handleSendMessage}
          title={assignedEmployee.name}
        />
      ) : (
        <Card variant="elevated" padding="large" className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-500">{t('chat.noChatAvailable')}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
