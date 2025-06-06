
import React from 'react';
import type { EnrichedWebboardPost, User, UserLevel } from '../types';
import { UserRole, View } // Import UserRole and View
from '../types';
import { Button } from './Button';

interface WebboardPostCardProps {
  post: EnrichedWebboardPost;
  currentUser: User | null;
  onViewPost: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onPinPost?: (postId: string) => void;
  onEditPost?: (post: EnrichedWebboardPost) => void;
  requestLoginForAction: (view: View, payload?: any) => void; // Added prop
}

export const WebboardPostCard: React.FC<WebboardPostCardProps> = ({
  post,
  currentUser,
  onViewPost,
  onToggleLike,
  onDeletePost,
  onPinPost,
  onEditPost,
  requestLoginForAction, // Destructure prop
}) => {
  const isAuthor = currentUser?.id === post.userId;
  const isAdmin = currentUser?.role === UserRole.Admin;
  const isModerator = currentUser?.role === UserRole.Moderator;
  const hasLiked = currentUser && post.likes.includes(currentUser.id);

  const canModeratorDelete = isModerator && !post.isAuthorAdmin;
  const canEdit = isAuthor || isAdmin || (isModerator && !post.isAuthorAdmin);
  const canDelete = isAuthor || isAdmin || canModeratorDelete;

  const questionKeywords = ['ใคร', 'ทำไม', 'อย่างไร', 'ยังไง', 'ที่ไหน', 'เมื่อไหร่', 'อะไร', 'ไหม', 'มั้ย', 'แก้ยังไง', 'ขอถาม', 'สอบถาม'];
  const isQuestion = post.title.includes('?') || questionKeywords.some(keyword => post.title.toLowerCase().includes(keyword.toLowerCase()));


  const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + " ปีก่อน";
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + " เดือนก่อน";
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + " วันก่อน";
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + " ชม.ก่อน";
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
    return Math.floor(seconds) + " วินาทีที่แล้ว";
  };

  const handleLikeClick = () => {
    if (!currentUser) {
      requestLoginForAction(View.Webboard, { action: 'like', postId: post.id });
    } else {
      onToggleLike(post.id);
    }
  };

  return (
    <div className="font-sans bg-white dark:bg-dark-cardBg shadow rounded-lg p-3 sm:p-4 mb-4 border border-neutral-DEFAULT/50 dark:border-dark-border/50 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      {post.isPinned && (
        <div className="mb-2 px-2.5 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 rounded-full text-center">
          <p className="text-xs font-normal text-yellow-800 dark:text-yellow-300">📌 ปักหมุด</p>
        </div>
      )}
      <div className="flex items-center mb-2">
        <div className="flex-grow flex items-center">
          <span className="text-xs sm:text-sm font-semibold text-neutral-dark dark:text-dark-textMuted">@{post.username}</span>
          <span className="mx-1 text-xs text-neutral-500 dark:text-neutral-400">·</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400" title={post.authorLevel.name}>{post.authorLevel.name}</span>
        </div>
        <span className="text-xs text-neutral-medium dark:text-dark-textMuted ml-auto flex-shrink-0">{timeSince(post.createdAt)}</span>
      </div>
      
      <div className="flex items-start">
        {isQuestion && <span className="text-red-600 dark:text-red-500 mr-1.5 mt-0.5 text-sm sm:text-base">❓</span>}
        <h3
          className="text-md sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 cursor-pointer hover:underline line-clamp-2 flex-grow"
          onClick={() => onViewPost(post.id)}
          role="link"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && onViewPost(post.id)}
        >
          {post.title}
        </h3>
      </div>


      <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mt-auto pt-2 border-t border-neutral-DEFAULT/20 dark:border-dark-border/20">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleLikeClick}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs rounded-lg border hover:scale-110 transform transition-transform duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-opacity-50
              ${hasLiked 
                ? 'text-red-500 dark:text-red-400 border-red-500 dark:border-red-400 focus:ring-red-300' 
                : 'text-neutral-500 dark:text-neutral-400 border-neutral-400 dark:border-neutral-500 hover:border-neutral-500 dark:hover:border-neutral-400 focus:ring-neutral-300'
              }`}
            aria-pressed={hasLiked}
            aria-label={hasLiked ? "Unlike post" : "Like post"}
          >
            {hasLiked ? '❤️' : '🤍'} {post.likes.length}
          </button>
          <span
            className="cursor-pointer hover:underline flex items-center"
            onClick={() => onViewPost(post.id)}
            role="link"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onViewPost(post.id)}
            >
            💬 {post.commentCount}
          </span>
        </div>
        {(isAdmin || isModerator || isAuthor) && (onEditPost || onDeletePost || onPinPost) && (
          <div className="flex items-center gap-1">
            {isAdmin && onPinPost && (
              <Button 
                onClick={() => onPinPost(post.id)} 
                variant={post.isPinned ? "secondary" : "outline"} 
                colorScheme="secondary"
                size="sm" 
                className="text-xs p-1"
              >
                {post.isPinned ? 'เลิกปัก' : 'ปัก'}
              </Button>
            )}
            {canEdit && onEditPost && (
                <Button onClick={() => onEditPost(post)} variant="outline" colorScheme="neutral" size="sm" className="text-xs p-1">✏️</Button>
            )}
            {canDelete && onDeletePost && (
              <Button onClick={() => onDeletePost(post.id)} variant="outline" colorScheme="accent" size="sm" className="text-xs p-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-neutral-dark">🗑️</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
