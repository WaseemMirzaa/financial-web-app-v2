'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockChats, mockChatMessages, mockCustomers, mockEmployees, mockInternalRooms } from '@/lib/mockData';
import { Chat, ChatMessage } from '@/types';

export default function AdminChatPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chats] = useState<Chat[]>([...mockChats]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);

  const selectedChatData = chats.find(c => c.id === selectedChat);

  const roomNameKey: Record<string, string> = {
    'Contracts': 'chat.room.contracts',
    'Follow Up': 'chat.room.followUp',
    'Receipts': 'chat.room.receipts',
  };
  const translateRoomName = (name: string | undefined) =>
    (name && roomNameKey[name] ? t(roomNameKey[name]) : name) || '';

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

  return (
    <div className="space-y-6">
      <div className="text-left rtl:text-right">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">{t('common.chat')}</h1>
        <p className="text-neutral-600">{t('chat.monitorAll')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card variant="elevated" padding="none">
            <div className="p-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900">{t('chat.allChats')}</h3>
            </div>
            <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
              {chats.map((chat) => {
                const isCustomerEmployee = chat.type === 'customer_employee';
                const otherParticipantId = chat.participantIds.find(id => id !== user?.id);
                const otherParticipant = isCustomerEmployee
                  ? mockCustomers.find(c => c.id === otherParticipantId) ||
                    mockEmployees.find(e => e.id === otherParticipantId)
                  : null;

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full p-4 text-left rtl:text-right hover:bg-neutral-50 transition-colors ${
                      selectedChat === chat.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between rtl:flex-row-reverse">
                      <div className="text-left rtl:text-right flex-1">
                        <p className="font-semibold text-sm text-neutral-900 text-left rtl:text-right">
                          {translateRoomName(chat.roomName) || otherParticipant?.name || t('chat.chat')}
                        </p>
                        {chat.lastMessage && (
                          <p className="text-xs text-neutral-600 mt-1 truncate text-left rtl:text-right">
                            {chat.lastMessage.contentKey ? t(chat.lastMessage.contentKey) : chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedChatData ? (
            <ChatWindow
              messages={messages.filter(m => m.chatId === selectedChat)}
              onSendMessage={handleSendMessage}
              title={
                selectedChatData.type === 'internal_room'
                  ? translateRoomName(selectedChatData.roomName)
                  : mockCustomers.find(c => c.id === selectedChatData.participantIds.find(id => id !== user?.id))?.name ||
                    mockEmployees.find(e => e.id === selectedChatData.participantIds.find(id => id !== user?.id))?.name ||
                    t('chat.chat')
              }
            />
          ) : (
            <Card variant="elevated" padding="large" className="h-[600px] flex items-center justify-center">
              <p className="text-neutral-500">{t('chat.selectChat')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
