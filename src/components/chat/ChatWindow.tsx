'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Edit2, Trash2, Search, CornerUpRight, Forward, Smile, Pin, X, ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ChatMessage, Chat } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import { useLocale } from '@/contexts/LocaleContext';
import { formatDate } from '@/lib/utils';
import { reloadIfStaleDeploy } from '@/lib/client-utils';
import { fetchApi } from '@/lib/fetchApi';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, file?: File, options?: { replyToMessageId?: string }) => void;
  title?: string;
  chatId?: string;
  /** When true, hide send input (e.g. admin monitoring customer chat) */
  readOnly?: boolean;
  /** Called when a message is edited or deleted. Pass an update to patch state without refetch, or call with no args to refetch. */
  onMessageUpdate?: (update?: { type: 'messageEdited'; message: Partial<ChatMessage> & { id: string }; } | { type: 'messageDeleted'; messageId: string }) => void;
  /** Available chats for forwarding (optional) */
  availableChats?: Chat[];
  /** Admin only: employees to forward to (creates room and sends) */
  availableEmployees?: { id: string; name: string }[];
  /** ID of the currently pinned message in this chat */
  pinnedMessageId?: string | null;
  /** Called when pinned message is updated */
  onPinnedMessageUpdate?: (messageId: string | null) => void;
  /** Called after forward so parent can refresh chat list (e.g. when new room created) */
  onForwardComplete?: () => void;
  /** When set, show a back button in the header (e.g. for mobile view) */
  onBack?: () => void;
}

export function ChatWindow({ messages, onSendMessage, title, chatId, readOnly, onMessageUpdate, availableChats, availableEmployees, pinnedMessageId, onPinnedMessageUpdate, onForwardComplete, onBack }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const pasteCursorRef = useRef<number | null>(null);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { t, locale } = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [forwardMode, setForwardMode] = useState<'copy' | 'move'>('copy');
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardChatSearch, setForwardChatSearch] = useState('');
  const [forwardEmployeeSearch, setForwardEmployeeSearch] = useState('');
  const isAdmin = user?.role === 'admin';
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [pinningMessageId, setPinningMessageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Keep cursor at end after type; after paste use paste position. Scroll input to show cursor.
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    const pos = pasteCursorRef.current !== null ? pasteCursorRef.current : inputValue.length;
    if (pasteCursorRef.current !== null) pasteCursorRef.current = null;
    requestAnimationFrame(() => {
      el.setSelectionRange(pos, pos);
      el.scrollTop = el.scrollHeight;
    });
  }, [inputValue]);

  // Track user scroll to prevent auto-scroll when user scrolls up
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 150; // pixels from bottom
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < threshold;
      
      // Update scroll state: user has scrolled up if not near bottom
      isUserScrollingRef.current = !isNearBottom;

      // Clear any pending auto-scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Reset when switching chats
  useEffect(() => {
    prevLastMessageIdRef.current = null;
    isUserScrollingRef.current = false;
    setSearchResults(null);
    setSearchQuery('');
    setHighlightedMessageId(null);
  }, [chatId]);

  // Auto-scroll only on first load or when a real new message appears (last message id changed)
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1]?.id ?? null : null;
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isInitialLoad = prevLastMessageIdRef.current === null && messages.length > 0;
    const lastMessageIdChanged = lastMessageId !== null && lastMessageId !== prevLastMessageIdRef.current;
    prevLastMessageIdRef.current = lastMessageId;

    if (!isInitialLoad && !lastMessageIdChanged) return;

    // Scroll to bottom on initial load or when a new message is added
    const shouldScroll = isInitialLoad || lastMessageIdChanged;
    if (shouldScroll) {
      el.scrollTop = el.scrollHeight;
      if (isInitialLoad) isUserScrollingRef.current = false;
    }
  }, [lastMessageId, messages.length]);

  // Handle image load - scroll only once per image if user is near bottom
  const handleImageLoad = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    // Debounce scroll to avoid multiple scrolls during image loading
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      if (!el) return;
      const threshold = 150;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < threshold;
      
      // Only scroll if user is near bottom and hasn't manually scrolled up
      if (isNearBottom && !isUserScrollingRef.current) {
        el.scrollTop = el.scrollHeight;
      }
      scrollTimeoutRef.current = null;
    }, 100);
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    if (inputValue.trim() || selectedFile) {
      onSendMessage(inputValue, selectedFile || undefined, replyingTo ? { replyToMessageId: replyingTo.id } : undefined);
      setInputValue('');
      setSelectedFile(null);
      setReplyingTo(null);
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

  const canEditDelete = (message: ChatMessage): boolean => {
    if (!user || message.senderId !== user.id) return false;
    if (user.role !== 'admin' && user.role !== 'employee') return false;
    if (message.isDeleted) return false;
    if (!message.timestamp) return false;
    try {
      const messageTime = new Date(message.timestamp).getTime();
      if (isNaN(messageTime)) return false;
      const ageSeconds = (Date.now() - messageTime) / 1000;
      // 24 hours
      return ageSeconds <= 24 * 60 * 60;
    } catch {
      return false;
    }
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !chatId || !user?.id || !editContent.trim()) return;
    setSavingEdit(true);
    try {
      const response = await fetchApi(`/api/chat/${chatId}/messages/${editingMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim(), userId: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        const updatedMessage = {
          id: editingMessageId,
          content: editContent.trim(),
          isEdited: true,
          editedAt: new Date().toISOString(),
        };
        setEditingMessageId(null);
        setEditContent('');
        if (onMessageUpdate) {
          onMessageUpdate({ type: 'messageEdited', message: updatedMessage });
        }
      } else {
        console.error('Failed to edit message:', data.error);
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to edit message:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmMessageId || !chatId || !user?.id) return;
    try {
      const response = await fetchApi(`/api/chat/${chatId}/messages/${deleteConfirmMessageId}?userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        const id = deleteConfirmMessageId;
        setDeleteConfirmMessageId(null);
        if (onMessageUpdate) {
          onMessageUpdate({ type: 'messageDeleted', messageId: id });
        }
      } else {
        console.error('Failed to delete message:', data.error);
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to delete message:', error);
    }
  };

  const handleForward = async (targetChatId: string) => {
    if (!chatId || !user?.id || !forwardingMessage) return;
    setForwardLoading(true);
    try {
      const response = await fetchApi(`/api/chat/${chatId}/messages/${forwardingMessage.id}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          targetChatId,
          mode: forwardMode,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.errorKey || 'Forward failed');
      }

      setForwardingMessage(null);
      setForwardChatSearch('');
      setForwardEmployeeSearch('');
      if (forwardMode === 'move' && onMessageUpdate) {
        onMessageUpdate({ type: 'messageDeleted', messageId: forwardingMessage.id });
      }
      onForwardComplete?.();
    } catch (error: any) {
      console.error(error);
      alert(t('error.genericError'));
    } finally {
      setForwardLoading(false);
    }
  };

  const handleForwardToEmployee = async (employeeId: string) => {
    if (!user?.id || user.role !== 'admin' || !forwardingMessage) return;
    setForwardLoading(true);
    try {
      const res = await fetchApi('/api/chat/get-or-create-admin-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, employeeId }),
      });
      const data = await res.json();
      if (!data.success || !data.data?.chatId) throw new Error('Failed to get or create chat');
      await handleForward(data.data.chatId);
    } catch (error: any) {
      console.error(error);
      alert(t('error.genericError'));
    } finally {
      setForwardLoading(false);
    }
  };

  const handlePinToggle = async (messageId: string | null) => {
    if (!chatId || !user?.id) return;
    setPinningMessageId(messageId);
    try {
      const response = await fetchApi(`/api/chat/${chatId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          messageId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.errorKey || 'Pin failed');
      }

      if (onPinnedMessageUpdate) {
        onPinnedMessageUpdate(messageId);
      }
    } catch (error: any) {
      console.error(error);
      alert(t('error.genericError'));
    } finally {
      setPinningMessageId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (readOnly) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(messageId);
    setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
    }, 2000);
  };

  const handleSearch = async () => {
    if (!chatId || !user?.id || !searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({
        userId: user.id,
        locale,
        query: searchQuery.trim(),
      });
      const res = await fetchApi(`/api/chat/${chatId}/messages/search?${params.toString()}`);
      const data = await res.json();
      if (!data.success) {
        setSearchError(data.error || t('error.genericError'));
        setSearchResults(null);
        return;
      }
      setSearchResults(data.data || []);
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Search messages error:', error);
      setSearchError(t('error.genericError'));
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Card
      variant="elevated"
      padding="none"
      className="flex flex-col min-h-[280px] h-[55vh] sm:h-[60vh] md:h-[600px] max-h-[calc(100dvh-10rem)] relative"
      onDragOver={!readOnly ? handleDragOver : undefined}
      onDragLeave={!readOnly ? handleDragLeave : undefined}
      onDrop={!readOnly ? handleDrop : undefined}
    >
      {isDragging && !readOnly && (
        <div className="absolute inset-0 z-50 bg-primary-50/90 backdrop-blur-sm border-2 border-dashed border-primary-500 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Paperclip className="w-12 h-12 mx-auto mb-3 text-primary-600" />
            <p className="text-lg font-semibold text-primary-900">{t('chat.dropFileHere')}</p>
            <p className="text-sm text-primary-700">{t('chat.releaseToUpload')}</p>
          </div>
        </div>
      )}
      {(title || onBack || (!readOnly && chatId)) && (
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2 border-b border-neutral-100 shrink-0 space-y-2">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 flex items-center justify-center min-w-[40px] min-h-[40px] -ml-1 rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors rtl:ml-0 rtl:mr-[-4px]"
                aria-label={t('common.back')}
              >
                <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
              </button>
            )}
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate flex-1 min-w-0">{title}</h3>
            )}
          </div>
          {!readOnly && chatId && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder={t('chat.searchMessages')}
                  className="w-full rounded-full border border-neutral-200 bg-white pl-10 pr-10 py-1.5 text-xs sm:text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {(searchQuery || (searchResults !== null && (searchResults.length > 0 || !searchLoading))) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(null);
                      setSearchError(null);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={handleSearch}
                disabled={searchLoading || !searchQuery.trim()}
                className="text-xs sm:text-sm"
              >
                {searchLoading ? t('common.loading') + '...' : t('common.search')}
              </Button>
            </div>
          )}
          {searchResults && searchResults.length > 0 && (
            <div className="max-h-32 overflow-y-auto -mx-1 px-1 pb-1 space-y-1">
              {searchResults.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => scrollToMessage(msg.id)}
                  className="w-full text-left text-xs sm:text-[13px] px-2 py-1 rounded-md hover:bg-neutral-100 flex items-center justify-between gap-2"
                >
                  <span className="truncate flex-1">
                    {msg.content || msg.fileName || t('chat.file')}
                  </span>
                  <span className="shrink-0 text-[10px] text-neutral-500">
                    {formatDate(msg.timestamp, locale)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchResults && searchResults.length === 0 && !searchLoading && (
            <p className="text-[11px] text-neutral-500">{t('chat.noSearchResults')}</p>
          )}
          {searchError && (
            <p className="text-[11px] text-error">{searchError}</p>
          )}
        </div>
      )}
      {pinnedMessageId && (() => {
        const pinnedMsg = messages.find((m) => m.id === pinnedMessageId);
        if (!pinnedMsg || pinnedMsg.isDeleted) return null;
        return (
          <div className="px-3 sm:px-6 py-2 bg-primary-50 border-b border-primary-100 flex items-start gap-2 shrink-0">
            <Pin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
            <button
              type="button"
              onClick={() => scrollToMessage(pinnedMessageId)}
              className="flex-1 text-left min-w-0"
            >
              <p className="text-xs font-semibold text-primary-900 mb-0.5">
                {t('chat.pinnedMessage')}
              </p>
              <p className="text-xs text-primary-700 line-clamp-2 break-words">
                {pinnedMsg.content || pinnedMsg.fileName || t('chat.file')}
              </p>
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handlePinToggle(null)}
                disabled={pinningMessageId !== null}
                className="text-primary-600 hover:text-primary-800 disabled:opacity-50"
                title={t('chat.unpinMessage')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })()}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500">
            {t('chat.noMessages')}
          </div>
        ) : (
          messages.map((message) => {
            if (!message || !message.id) return null;
            const isOwn = message.senderId === user?.id;
            const canEdit = canEditDelete(message);
            const isEditing = editingMessageId === message.id;

            if (message.isDeleted) {
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-xl sm:rounded-lg px-3 py-2.5 sm:px-4 sm:py-2 bg-neutral-100 text-neutral-400 italic">
                    <p className="text-sm">{t('chat.messageDeletedPlaceholder')}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                data-message-id={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-xl sm:rounded-lg px-3 py-2.5 sm:px-4 sm:py-2 ${
                  isOwn
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-900'
                } ${highlightedMessageId === message.id ? 'ring-2 ring-primary-300' : ''}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full min-h-[80px] rounded-xl border border-neutral-200 px-4 py-3 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 whitespace-pre-wrap resize-y"
                        autoFocus
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={handleSaveEdit}
                          disabled={savingEdit}
                          className="flex-1"
                        >
                          {savingEdit ? t('common.loading') + '...' : t('common.save')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            if (!savingEdit) {
                              setEditingMessageId(null);
                              setEditContent('');
                            }
                          }}
                          disabled={savingEdit}
                          className="flex-1"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          isOwn ? 'text-white/80' : 'text-neutral-600'
                        }`}>
                          {message.senderNameKey ? t(message.senderNameKey) : message.senderName}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(message);
                                if (messageInputRef.current) {
                                  messageInputRef.current.focus();
                                }
                              }}
                              className="p-1 hover:bg-white/20 rounded"
                              title={t('chat.replyMessage')}
                            >
                              <CornerUpRight className="w-3 h-3" />
                            </button>
                          )}
                          {!readOnly && availableChats && availableChats.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setForwardingMessage(message);
                                setForwardMode('copy');
                              }}
                              className="p-1 hover:bg-white/20 rounded"
                              title={t('chat.forwardMessage')}
                            >
                              <Forward className="w-3 h-3" />
                            </button>
                          )}
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => handlePinToggle(pinnedMessageId === message.id ? null : message.id)}
                              disabled={pinningMessageId !== null}
                              className={`p-1 hover:bg-white/20 rounded disabled:opacity-50 ${
                                pinnedMessageId === message.id ? 'text-primary-400' : ''
                              }`}
                              title={pinnedMessageId === message.id ? t('chat.unpinMessage') : t('chat.pinMessage')}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleEdit(message)}
                              className="p-1 hover:bg-white/20 rounded"
                              title={t('chat.editMessage')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmMessageId(message.id)}
                              className="p-1 hover:bg-white/20 rounded"
                              title={t('chat.deleteMessage')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      {message.forwardedFrom && (
                        <div className={`mb-2 text-[10px] italic ${
                          isOwn ? 'text-white/60' : 'text-neutral-500'
                        }`}>
                          {t('chat.forwardedFrom')}{' '}{message.forwardedFrom.senderName}
                        </div>
                      )}
                      {message.replyTo && (
                        <button
                          type="button"
                          onClick={() => scrollToMessage(message.replyTo!.id)}
                          className={`mb-2 w-full text-left text-xs rounded-lg px-3 py-2 border ${
                            isOwn
                              ? 'border-white/40 bg-white/10 text-white/90'
                              : 'border-neutral-200 bg-white text-neutral-800'
                          }`}
                        >
                          <p className="font-semibold mb-0.5">
                            {t('chat.replyingTo')}{' '}{message.replyTo.senderName}
                          </p>
                          <p className="line-clamp-2 break-words">
                            {message.replyTo.content || message.replyTo.fileName || t('chat.file')}
                          </p>
                        </button>
                      )}
                      {message.fileUrl && (() => {
                        // Convert old /assets/ URLs to /api/assets/ for proper serving
                        const fileUrl = message.fileUrl.startsWith('/assets/')
                          ? message.fileUrl.replace('/assets/', '/api/assets/')
                          : message.fileUrl;
                        
                        return (
                          <div className="mb-2">
                            {message.fileType?.startsWith('image/') ? (
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                <img 
                                  src={fileUrl} 
                                  alt={message.fileName || ''} 
                                  className="max-w-full max-h-48 rounded object-contain" 
                                  onLoad={handleImageLoad}
                                />
                              </a>
                            ) : (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={message.fileName}
                                className="text-sm underline"
                              >
                                {message.fileName || t('chat.file')} ({message.fileType?.includes('pdf') ? 'Preview/Download' : 'Download'})
                              </a>
                            )}
                          </div>
                        );
                      })()}
                      {message.content ? <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p> : null}
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        isOwn ? 'text-white/70' : 'text-neutral-500'
                      }`}>
                        {formatDate(message.timestamp, locale)}
                        {message.isEdited && (
                          <span className="text-xs italic">({t('chat.edited')})</span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {!readOnly && (
      <div className="px-3 sm:px-6 py-4 sm:py-5 border-t border-neutral-200 shrink-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        {replyingTo && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-700 mb-0.5">
                {t('chat.replyingTo')}{' '}{replyingTo.senderName}
              </p>
              <p className="text-xs text-neutral-600 line-clamp-2 break-words">
                {replyingTo.content || replyingTo.fileName || t('chat.file')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-neutral-400 hover:text-neutral-600 text-xs px-1"
              aria-label={t('common.cancel')}
            >
              ×
            </button>
          </div>
        )}
        {selectedFile && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 min-w-0 mb-3">
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="truncate flex-1 min-w-0">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-error hover:text-red-700 shrink-0 rounded-xl touch-manipulation"
              aria-label={t('common.delete')}
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 sm:gap-3 min-w-0">
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
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-neutral-50 rounded-xl cursor-pointer transition-colors shrink-0 touch-manipulation border border-transparent hover:border-neutral-200 mb-1"
          >
            <Paperclip className="w-5 h-5 text-neutral-600" />
          </label>
          <textarea
            ref={messageInputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              const plain = e.clipboardData.getData('text/plain');
              const input = messageInputRef.current;
              if (!input) return;
              const start = input.selectionStart ?? input.value.length;
              const end = input.selectionEnd ?? input.value.length;
              const newVal = input.value.slice(0, start) + plain + input.value.slice(end);
              pasteCursorRef.current = start + plain.length;
              setInputValue(newVal);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chat.typeMessage')}
            rows={3}
            className="flex-1 min-w-0 min-h-[72px] max-h-[220px] py-3.5 px-4 rounded-2xl border border-neutral-200 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 resize-y whitespace-pre-wrap break-words shadow-sm"
          />
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-neutral-50 rounded-xl transition-colors mb-0.5 touch-manipulation border border-transparent hover:border-neutral-200"
              title={t('chat.addEmoji')}
            >
              <Smile className="w-5 h-5 text-neutral-600" />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className={`fixed mb-2 z-50 shadow-lg bottom-24 ${
                  locale === 'ar' ? 'left-4' : 'right-4'
                }`}
              >
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    const input = messageInputRef.current;
                    if (!input) return;
                    const start = input.selectionStart ?? input.value.length;
                    const end = input.selectionEnd ?? input.value.length;
                    const newVal = input.value.slice(0, start) + emojiData.emoji + input.value.slice(end);
                    setInputValue(newVal);
                    setShowEmojiPicker(false);
                    input.focus();
                    setTimeout(() => {
                      input.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
                    }, 0);
                  }}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
          <Button onClick={handleSend} variant="primary" size="medium" className="shrink-0 min-w-[48px] min-h-[48px] sm:min-h-[72px] self-end mb-0.5">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      )}

      {/* Delete Message Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmMessageId !== null}
        onClose={() => setDeleteConfirmMessageId(null)}
        title={t('chat.deleteMessage')}
      >
        <div className="space-y-4">
          <p className="text-neutral-700">{t('chat.deleteMessageConfirm')}</p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmMessageId(null)}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="w-full sm:w-auto bg-error hover:bg-error-dark"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Forward Message Modal */}
      <Modal
        isOpen={forwardingMessage !== null}
        onClose={() => {
          setForwardingMessage(null);
          setForwardChatSearch('');
          setForwardEmployeeSearch('');
        }}
        title={t('chat.forwardMessage')}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              {t('chat.selectChatToForward')}
            </label>
            {isAdmin && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={forwardChatSearch}
                  onChange={(e) => setForwardChatSearch(e.target.value)}
                  placeholder={t('chat.forwardSearchChats')}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
              </div>
            )}
            {(() => {
              const q = forwardChatSearch.trim().toLowerCase();
              const chatsToShow = availableChats && (isAdmin && q
                ? availableChats.filter((chat) => {
                    const name = (chat.type === 'internal_room' && chat.roomName ? chat.roomName : (chat.participantNames || []).join(' ')).toLowerCase();
                    return name.includes(q);
                  })
                : availableChats);
              return (
                <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-200">
                  {chatsToShow && chatsToShow.length > 0 ? chatsToShow.map((chat) => {
                    const chatName = chat.type === 'internal_room' && chat.roomName
                      ? chat.roomName
                      : chat.participantNames && chat.participantNames.length > 0
                      ? chat.participantNames.join(', ')
                      : chat.type;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => handleForward(chat.id)}
                        disabled={forwardLoading || chat.id === chatId}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <p className="font-medium text-sm text-neutral-800">{chatName}</p>
                        <p className="text-xs text-neutral-500">{chat.type}</p>
                      </button>
                    );
                  }) : (
                    <p className="px-4 py-3 text-sm text-neutral-500">{t('common.noResults')}</p>
                  )}
                </div>
              );
            })()}
          </div>
          {isAdmin && availableEmployees && availableEmployees.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                {t('chat.sendToEmployee')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={forwardEmployeeSearch}
                  onChange={(e) => setForwardEmployeeSearch(e.target.value)}
                  placeholder={t('chat.forwardSearchEmployees')}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-200">
                {(() => {
                  const eq = forwardEmployeeSearch.trim().toLowerCase();
                  const list = eq ? availableEmployees.filter((e) => e.name.toLowerCase().includes(eq)) : availableEmployees;
                  return list.length > 0 ? list.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleForwardToEmployee(emp.id)}
                      disabled={forwardLoading}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                    >
                      <p className="font-medium text-sm text-neutral-800">{emp.name}</p>
                      <p className="text-xs text-neutral-500">{t('chat.employee')}</p>
                    </button>
                  )) : <p className="px-4 py-3 text-sm text-neutral-500">{t('common.noResults')}</p>;
                })()}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                name="forwardMode"
                value="copy"
                checked={forwardMode === 'copy'}
                onChange={() => setForwardMode('copy')}
                className="w-4 h-4"
              />
              {t('chat.forwardCopy')}
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                name="forwardMode"
                value="move"
                checked={forwardMode === 'move'}
                onChange={() => setForwardMode('move')}
                className="w-4 h-4"
              />
              {t('chat.forwardMove')}
            </label>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
