
import React from 'react';
import type { EnrichedWebboardComment, User, UserLevel } from '../types';
import { UserRole } from '../types';
import { UserLevelBadge } from './UserLevelBadge';
// No need to import getUserDisplayBadge here, as authorLevel is already enriched

interface WebboardCommentItemProps {
  comment: EnrichedWebboardComment;
  currentUser: User | null;
  onDeleteComment?: (commentId: string) => void; 
}

const FallbackAvatarComment: React.FC<{ name?: string, photo?: string, size?: string, className?: string }> = ({ name, photo, size = "w-10 h-10", className = "" }) => {
  if (photo) {
    return <img src={photo} alt={name || 'avatar'} className={`${size} rounded-full object-cover ${className}`} />;
  }
  const initial = name ? name.charAt(0).toUpperCase() : '💬';
  return (
    <div className={`${size} rounded-full bg-neutral-light dark:bg-dark-inputBg flex items-center justify-center text-md text-neutral-dark dark:text-dark-text ${className}`}>
      {initial}
    </div>
  );
};

export const WebboardCommentItem: React.FC<WebboardCommentItemProps> = ({ comment, currentUser, onDeleteComment }) => {
  const isAuthor = currentUser?.id === comment.userId;
  const isAdmin = currentUser?.role === UserRole.Admin;
  const isModerator = currentUser?.role === UserRole.Moderator;


  const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " ปีก่อน";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " เดือนก่อน";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " วันก่อน";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ชม.ก่อน";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
    return Math.floor(seconds) + " วินาทีที่แล้ว";
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-neutral-DEFAULT/50 dark:border-dark-border/50 last:border-b-0">
      <FallbackAvatarComment name={comment.username} photo={comment.authorPhoto} className="mt-1" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <div>
                <span className="text-sm font-semibold text-neutral-dark dark:text-dark-text">@{comment.username}</span>
                <UserLevelBadge level={comment.authorLevel} size="sm" />
            </div>
            {(isAuthor || isAdmin || isModerator) && onDeleteComment && ( // Moderators can delete comments too
                <button 
                    onClick={() => onDeleteComment(comment.id)} 
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    aria-label="ลบคอมเมนต์"
                >
                    🗑️
                </button>
            )}
        </div>
        <p className="text-sm text-neutral-dark dark:text-dark-textMuted whitespace-pre-wrap font-normal py-1">{comment.text}</p>
        <p className="text-xs font-mono text-neutral-medium dark:text-dark-textMuted">{timeSince(comment.createdAt)}</p>
      </div>
    </div>
  );
};