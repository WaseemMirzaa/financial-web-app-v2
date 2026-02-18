'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, ChatMessage } from '@/types';
import type { Employee } from '@/types';

export default function AdminChatPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatParticipants, setChatParticipants] = useState<Map<string, string[]>>(new Map());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchChats();
      fetchEmployees();
    }
  }, [user?.id]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (data.success) setEmployees(data.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`/api/chat?userId=${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setChats(data.data);
        if (data.data.length > 0) {
          setSelectedChat(data.data[0].id);
          fetchMessages(data.data[0].id);
          fetchParticipants(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/participants`);
      const data = await response.json();
      if (data.success) {
        setChatParticipants((prev) => {
          const next = new Map(prev);
          next.set(chatId, data.data || []);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/chat/${chatId}/messages?locale=${locale}&userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      fetchParticipants(selectedChat);
    }
  }, [selectedChat]);

  // Real-time: poll messages while a chat is open (pause when tab hidden)
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages(selectedChat);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedChat, locale]);

  const selectedChatData = chats.find(c => c.id === selectedChat);
  
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (chat.type === 'internal_room' && chat.roomName) {
      return chat.roomName.toLowerCase().includes(query);
    }
    return t('chat.customerChat').toLowerCase().includes(query);
  });

  const roomNameKey: Record<string, string> = {
    'Contracts': 'chat.room.contracts',
    'Follow Up': 'chat.room.followUp',
    'Receipts': 'chat.room.receipts',
  };
  const translateRoomName = (name: string | undefined) =>
    (name && roomNameKey[name] ? t(roomNameKey[name]) : name) || '';

  const handleCreateRoom = async () => {
    if (!roomName.trim() || selectedEmployeeIds.length === 0 || !user?.id) return;
    setCreatingRoom(true);
    try {
      const response = await fetch('/api/chat/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: roomName.trim(), employeeIds: selectedEmployeeIds, adminId: user.id }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        const newChat = data.data as Chat;
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat.id);
        fetchMessages(newChat.id);
        fetchParticipants(newChat.id);
        setIsCreateRoomModalOpen(false);
        setRoomName('');
        setSelectedEmployeeIds([]);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    );
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedChat || !user) return;

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: form });
        const uploadData = await uploadRes.json();
        if (!uploadData.success || !uploadData.data) {
          console.error('Upload failed:', uploadData.error);
          return;
        }
        fileUrl = uploadData.data.fileUrl;
        fileName = uploadData.data.fileName;
        fileType = uploadData.data.fileType;
      }

      const response = await fetch(`/api/chat/${selectedChat}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          content: content.trim() || (fileName ? '' : ' '),
          fileName,
          fileType,
          fileUrl,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchMessages(selectedChat);
      } else {
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-left rtl:text-right">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">{t('common.chat')}</h1>
        <p className="text-neutral-600">{t('chat.manageAllChats')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" padding="none" className="lg:col-span-1">
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-neutral-900">{t('chat.chats')}</h2>
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsCreateRoomModalOpen(true)}
              >
                {t('chat.createRoom')}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mb-2">{t('chat.adminMonitorOnly')}</p>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search') + '...'}
              className="text-sm"
            />
          </div>
          <div className="divide-y divide-neutral-100">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                <p>{searchQuery ? t('common.noResults') : t('chat.noChats')}</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`w-full p-4 text-left rtl:text-right hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                    selectedChat === chat.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <p className="font-semibold text-neutral-900">
                    {chat.type === 'internal_room' ? translateRoomName(chat.roomName) : t('chat.customerChat')}
                  </p>
                  {chat.lastMessage && (
                    <p className="text-sm text-neutral-600 mt-1 truncate">{chat.lastMessage.content}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="lg:col-span-2">
          {selectedChatData ? (
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              title={
                selectedChatData.type === 'internal_room'
                  ? translateRoomName(selectedChatData.roomName)
                  : t('chat.customerChat')
              }
              readOnly={selectedChatData.type === 'customer_employee'}
            />
          ) : (
            <Card variant="elevated" padding="large">
              <p className="text-center text-neutral-500">{t('chat.selectChat')}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Group Room Modal */}
      <Modal
        isOpen={isCreateRoomModalOpen}
        onClose={() => {
          setIsCreateRoomModalOpen(false);
          setRoomName('');
          setSelectedEmployeeIds([]);
        }}
        title={t('chat.createGroupRoom')}
      >
        <div className="space-y-4">
          <Input
            label={t('chat.roomName')}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('chat.roomNamePlaceholder')}
            required
          />
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              {t('chat.selectEmployees')}
            </label>
            <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg p-2 space-y-2">
              {employees.length === 0 ? (
                <p className="text-sm text-neutral-500 p-2">{t('chat.noEmployees')}</p>
              ) : (
                employees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm text-neutral-900">
                      {emp.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateRoomModalOpen(false);
                setRoomName('');
                setSelectedEmployeeIds([]);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || selectedEmployeeIds.length === 0 || creatingRoom}
            >
              {creatingRoom ? t('common.loading') + '...' : t('chat.createRoom')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
