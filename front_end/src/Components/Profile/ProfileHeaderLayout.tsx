import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { PATHS } from '../../routes/paths';

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
  return (
    <>
      <div className="h-48 bg-muted overflow-hidden">
        {coverImage && (
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between -mt-16 mb-4">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-2xl">
              {(username?.[0] ?? '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            {actionsSlot}
          </div>
        </div>

        <h1 className="text-2xl font-bold">{displayName}</h1>
        <p className="text-muted-foreground">@{username}</p>
        {bio && <p className="mt-3">{bio}</p>}
      </div>
    </>
  );
}
