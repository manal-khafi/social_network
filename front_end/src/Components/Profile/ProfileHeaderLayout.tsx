import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { PATHS } from '../../routes/paths';
import { useTranslation } from 'react-i18next';

interface ProfileHeaderLayoutProps {
  coverImage: string | null;
  avatarUrl: string | null;
  displayName: string;
  username: string;
  bio: string | null;
  actionsSlot: React.ReactNode;
}

export default function ProfileHeaderLayout({
  coverImage,
  avatarUrl,
  displayName,
  username,
  bio,
  actionsSlot,
}: ProfileHeaderLayoutProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="h-48 bg-muted overflow-hidden">
        {coverImage && (
          <img
            src={coverImage}
            alt={t('profile.coverAlt')}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-4">
        {/* The action buttons drop below the avatar when they don't fit beside it. */}
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-3 -mt-16 mb-4">
          <Avatar className="w-24 h-24 shrink-0 border-4 border-background">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-2xl">
              {(username?.[0] ?? '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap justify-end gap-2 min-w-0 max-w-full">
            {actionsSlot}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold break-words [overflow-wrap:anywhere]">{displayName}</h1>
        <p className="text-muted-foreground truncate">@{username}</p>
        {bio && <p className="mt-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{bio}</p>}
      </div>
    </>
  );
}
