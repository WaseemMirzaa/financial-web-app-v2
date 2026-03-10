'use client';

import React from 'react';
import { Chat } from '@/types';
import { formatLastSeenDateTime } from '@/lib/utils';

const MAX_INLINE = 4;

interface ChatPresenceListProps {
  chat: Chat;
  t: (k: string) => string;
  locale: string;
  showGreenDot?: boolean;
  onViewAllOnline?: (chat: Chat) => void;
  onViewAllLastSeen?: (chat: Chat) => void;
}

export function ChatPresenceList({
  chat,
  t,
  locale,
  showGreenDot = false,
  onViewAllOnline,
  onViewAllLastSeen,
}: ChatPresenceListProps) {
  const pres = chat.participantPresence ?? [];
  if (!pres.length) return null;

  const online = pres.filter((p) => p.isOnline);
  const offline = pres.filter((p) => !p.isOnline);
  const showTruncateOnline = online.length > MAX_INLINE;
  const showTruncateOffline = offline.length > MAX_INLINE;

  if (pres.length === 1) {
    const p = pres[0];
    const line = p.isOnline
      ? `${p.name} – ${t('chat.online')}`
      : `${p.name} – ${t('chat.lastSeen')} ${formatLastSeenDateTime(p.lastSeenAt, locale)}`;
    return (
      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
        {showGreenDot && p.isOnline && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" title={t('chat.online')} aria-hidden />
        )}
        {line}
      </p>
    );
  }

  const lines: React.ReactNode[] = [];

  // When <= 4 online and <= 4 offline: show full list as before (no "View all" button)
  if (online.length > 0) {
    const showViewAll = showTruncateOnline && onViewAllOnline;
    const displayNames = showViewAll ? online.slice(0, MAX_INLINE).map((p) => p.name) : online.map((p) => p.name);
    const text = showViewAll
      ? `${t('chat.online')}: ${displayNames.join(', ')} +${online.length - MAX_INLINE}`
      : `${t('chat.online')}: ${displayNames.join(', ')}`;
    lines.push(
      <p key="online" className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
        {showGreenDot && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" title={t('chat.online')} aria-hidden />
        )}
        {text}
        {showViewAll && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewAllOnline?.(chat);
            }}
            className="text-primary-600 hover:text-primary-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded px-0.5"
          >
            {t('chat.viewAll')}
          </button>
        )}
      </p>
    );
  }

  if (offline.length > 0) {
    const showViewAll = showTruncateOffline && onViewAllLastSeen;
    const displayList = showViewAll ? offline.slice(0, MAX_INLINE) : offline;
    const text = showViewAll
      ? `${t('chat.lastSeen')}: ${displayList.map((p) => `${p.name} (${formatLastSeenDateTime(p.lastSeenAt, locale)})`).join(', ')} +${offline.length - MAX_INLINE}`
      : `${t('chat.lastSeen')}: ${offline.map((p) => `${p.name} (${formatLastSeenDateTime(p.lastSeenAt, locale)})`).join(', ')}`;
    lines.push(
      <p key="offline" className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
        {text}
        {showViewAll && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewAllLastSeen?.(chat);
            }}
            className="text-primary-600 hover:text-primary-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded px-0.5"
          >
            {t('chat.viewAll')}
          </button>
        )}
      </p>
    );
  }

  return <>{lines}</>;
}
