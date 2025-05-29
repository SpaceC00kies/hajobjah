
import React, { useState, useEffect } from 'react';
import type { WebboardPost, WebboardComment, User, EnrichedWebboardPost, EnrichedWebboardComment, UserLevel, UserRole } from '../types';
import { View, USER_LEVELS } from '../types'; 
import { Button } from './Button';
import { WebboardPostCard } from './WebboardPostCard';
import { WebboardPostDetail } from './WebboardPostDetail';
import { WebboardPostCreateForm } from './WebboardPostCreateForm';

interface WebboardPageProps {
  currentUser: User | null;
  users: User[]; 
  posts: WebboardPost[];
  comments: WebboardComment[];
  onAddOrUpdatePost: (postData: { title: string; body: string; image?: string }, postIdToUpdate?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleLike: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onPinPost: (postId: string) => void;
  onEditPost: (post: EnrichedWebboardPost) => void; 
  selectedPostId: string | null; 
  setSelectedPostId: (postId: string | null) => void;
  navigateTo: (view: View, payload?: any) => void;
  editingPost?: WebboardPost | null; 
  onCancelEdit: () => void; 
  getUserDisplayBadge: (user: User | null | undefined, posts: WebboardPost[], comments: WebboardComment[]) => UserLevel;
  requestLoginForAction: (view: View, payload?: any) => void; // Added prop
}

export const WebboardPage: React.FC<WebboardPageProps> = ({
  currentUser,
  users,
  posts,
  comments,
  onAddOrUpdatePost,
  onAddComment,
  onToggleLike,
  onDeletePost,
  onPinPost,
  onEditPost,
  selectedPostId,
  setSelectedPostId,
  navigateTo,
  editingPost,
  onCancelEdit,
  getUserDisplayBadge,
  requestLoginForAction, // Destructure prop
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (selectedPostId === 'create' || editingPost) {
      setIsCreateModalOpen(true);
    } else {
      setIsCreateModalOpen(false);
    }
  }, [selectedPostId, editingPost]);

  const handleOpenCreateModal = () => {
    if (!currentUser) {
      requestLoginForAction(View.Webboard, { action: 'createPost' });
    } else {
      setSelectedPostId('create'); 
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    if (selectedPostId === 'create' || editingPost) { 
      setSelectedPostId(null); 
      onCancelEdit(); 
    }
  };
  
  const handleSubmitPostForm = (postData: { title: string; body: string; image?: string }, postIdToUpdate?: string) => {
    onAddOrUpdatePost(postData, postIdToUpdate);
    handleCloseCreateModal(); 
  };


  const enrichedPosts: EnrichedWebboardPost[] = posts
    .map(post => {
      const author = users.find(u => u.id === post.userId);
      return {
        ...post,
        commentCount: comments.filter(c => c.postId === post.id).length,
        authorLevel: getUserDisplayBadge(author, posts, comments),
        authorPhoto: author?.photo || post.authorPhoto,
        isAuthorAdmin: author?.role === 'Admin' as UserRole.Admin, 
      };
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const currentDetailedPost = selectedPostId && selectedPostId !== 'create'
    ? enrichedPosts.find(p => p.id === selectedPostId)
    : null;

  const commentsForDetailView: EnrichedWebboardComment[] = currentDetailedPost
    ? comments
        .filter(comment => comment.postId === currentDetailedPost.id)
        .map(comment => {
          const commenter = users.find(u => u.id === comment.userId);
          return {
            ...comment,
            authorLevel: getUserDisplayBadge(commenter, posts, comments),
            authorPhoto: commenter?.photo || comment.authorPhoto,
          };
        })
    : [];

  if (currentDetailedPost) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Button 
          onClick={() => setSelectedPostId(null)} 
          variant="outline" 
          colorScheme="neutral" 
          size="sm" 
          className="mb-4 rounded-full"
        >
          &larr; กลับไปหน้ารวมกระทู้
        </Button>
        <WebboardPostDetail
          post={currentDetailedPost}
          comments={commentsForDetailView}
          currentUser={currentUser}
          users={users}
          onToggleLike={onToggleLike}
          onAddComment={onAddComment}
          onDeletePost={onDeletePost}
          onPinPost={onPinPost}
          onEditPost={onEditPost}
          requestLoginForAction={requestLoginForAction} // Pass down
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-sans font-semibold text-neutral-700 dark:text-neutral-300 mb-3 sm:mb-0">
          💬 กระทู้พูดคุย ชุมชนหาจ๊อบจ้า
        </h2>
        
        <Button 
          onClick={handleOpenCreateModal} 
          variant="login" 
          size="sm" 
          className="rounded-full font-semibold"
        >
          + สร้างกระทู้ใหม่
        </Button>
        
      </div>

      {enrichedPosts.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-dark-cardBg p-6 rounded-lg shadow">
          <svg className="mx-auto h-16 w-16 text-neutral-DEFAULT dark:text-dark-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-xl font-serif text-neutral-dark dark:text-dark-textMuted mb-4 font-normal">ยังไม่มีกระทู้ในขณะนี้</p>
          {!currentUser && (
             <p className="text-md font-serif text-neutral-dark dark:text-dark-textMuted mb-4 font-normal">
                <button onClick={() => navigateTo(View.Login)} className="font-sans text-primary dark:text-dark-primary-DEFAULT hover:underline">เข้าสู่ระบบ</button> หรือ <button onClick={() => navigateTo(View.Register)} className="font-sans text-primary dark:text-dark-primary-DEFAULT hover:underline">ลงทะเบียน</button> เพื่อเริ่มสร้างกระทู้
            </p>
          )}
          {currentUser && (
            <Button 
              onClick={handleOpenCreateModal}
              variant="login" 
              size="sm" 
              className="rounded-full font-semibold"
            >
              เป็นคนแรกที่สร้างกระทู้!
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {enrichedPosts.map(post => (
            <WebboardPostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onViewPost={setSelectedPostId}
              onToggleLike={onToggleLike}
              onDeletePost={onDeletePost}
              onPinPost={onPinPost}
              onEditPost={onEditPost}
              requestLoginForAction={requestLoginForAction} // Pass down
            />
          ))}
        </div>
      )}
      <WebboardPostCreateForm
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitPostForm}
        editingPost={editingPost || null}
      />
    </div>
  );
};
