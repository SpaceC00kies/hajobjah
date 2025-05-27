
import React from 'react';
import type { Job, HelperProfile, User } from '../types';
import { View } from '../types'; 
import { Button } from './Button';
import type { Timestamp } from 'firebase/firestore';

interface MyPostsPageProps {
  currentUser: User;
  jobs: Job[];
  helperProfiles: HelperProfile[];
  onEditItem: (itemId: string, itemType: 'job' | 'profile') => void;
  onDeleteItem: (itemId: string, itemType: 'job' | 'profile') => void;
  onToggleHiredStatus: (itemId: string, itemType: 'job' | 'profile') => void;
  navigateTo: (view: View) => void;
}

interface UserPostItem {
  id: string;
  title: string;
  type: 'job' | 'profile';
  postedAt?: Timestamp; // Firestore Timestamp
  isHiredOrUnavailable?: boolean;
  isSuspicious?: boolean;
  originalItem: Job | HelperProfile;
}

const formatDateFromTimestamp = (timestamp?: Timestamp): string => {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate();
    return date.toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' น.';
  } catch (e) { return 'Error Formatting Date'; }
};

export const MyPostsPage: React.FC<MyPostsPageProps> = ({
  currentUser, jobs, helperProfiles,
  onEditItem, onDeleteItem, onToggleHiredStatus, navigateTo,
}) => {
  const userJobs = jobs.filter(job => job.userId === currentUser.id);
  const userHelperProfiles = helperProfiles.filter(profile => profile.userId === currentUser.id);

  const userItems: UserPostItem[] = [
    ...userJobs.map(job => ({
      id: job.id, title: job.title, type: 'job' as const,
      postedAt: job.postedAt, isHiredOrUnavailable: job.isHired,
      isSuspicious: job.isSuspicious, originalItem: job,
    })),
    ...userHelperProfiles.map(profile => ({
      id: profile.id, title: profile.profileTitle, type: 'profile' as const,
      postedAt: profile.postedAt, isHiredOrUnavailable: profile.isUnavailable,
      isSuspicious: profile.isSuspicious, originalItem: profile,
    })),
  ].sort((a, b) => {
    if (a.postedAt && b.postedAt) {
      return b.postedAt.toMillis() - a.postedAt.toMillis(); // Compare Firestore Timestamps
    }
    return 0;
  });

  const getStatusBadge = (item: UserPostItem) => {
    const postedAtDate = item.postedAt ? item.postedAt.toDate() : null;
    const isExpired = !item.isHiredOrUnavailable && postedAtDate ? (new Date().getTime() - postedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;
    if (item.isHiredOrUnavailable) return <span className={`inline-block text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${item.type === 'job' ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'}`}>{item.type === 'job' ? '✅ ได้งานแล้ว' : '🚫 ไม่ว่างแล้ว'}</span>;
    if (item.isSuspicious) return <span className="inline-block bg-yellow-200 text-yellow-800 dark:bg-yellow-600/40 dark:text-yellow-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">⚠️ น่าสงสัย (รอตรวจสอบ)</span>;
    if (isExpired) return <span className="inline-block bg-neutral-200 text-neutral-800 dark:bg-dark-border dark:text-dark-textMuted text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">⏳ หมดอายุ (ไม่แสดงในผลค้นหา)</span>;
    return <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">🟢 แสดงอยู่</span>;
  };
  
  const getToggleStatusButtonText = (item: UserPostItem) => {
    if (item.type === 'job') return item.isHiredOrUnavailable ? '🔄 แจ้งว่ายังหางาน' : '✅ แจ้งว่าได้งานแล้ว';
    return item.isHiredOrUnavailable ? '🟢 แจ้งว่ากลับมาว่าง' : '🔴 แจ้งว่าไม่ว่างแล้ว';
  };

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-8 text-center">📁 โพสต์ของฉัน</h2>
      {userItems.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-dark-cardBg p-6 rounded-lg shadow">
          <svg className="mx-auto h-16 w-16 text-neutral-DEFAULT dark:text-dark-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p className="text-xl text-neutral-dark dark:text-dark-textMuted mb-6 font-normal">คุณยังไม่มีประกาศงานหรือโปรไฟล์ผู้ช่วยเลยนะ</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => navigateTo(View.PostJob)} variant="primary" size="md">+ สร้างประกาศงาน</Button>
            <Button onClick={() => navigateTo(View.OfferHelp)} variant="secondary" size="md">+ สร้างโปรไฟล์ผู้ช่วย</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {userItems.map(item => (
            <div key={`${item.type}-${item.id}`} className="bg-white dark:bg-dark-cardBg p-4 sm:p-6 rounded-lg shadow-lg border dark:border-dark-border">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                <div>
                    <h4 className={`font-semibold text-xl mb-1 ${item.type === 'job' ? 'text-primary dark:text-dark-primary-DEFAULT' : 'text-secondary-hover dark:text-dark-secondary-hover'}`}>{item.title}</h4>
                    <span className="text-xs text-neutral-medium dark:text-dark-textMuted">{item.type === 'job' ? 'ประเภท: ประกาศงาน' : 'ประเภท: โปรไฟล์ผู้ช่วย'}</span>
                </div>
                <span className="text-xs text-neutral-medium dark:text-dark-textMuted mt-1 sm:mt-0">โพสต์เมื่อ: {formatDateFromTimestamp(item.postedAt)}</span>
              </div>
              <div className="my-3">สถานะ: {getStatusBadge(item)}</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Button onClick={() => onEditItem(item.id, item.type)} variant="outline" colorScheme="primary" size="sm" className="w-full">✏️ แก้ไขโพสต์</Button>
                <Button onClick={() => onToggleHiredStatus(item.id, item.type)} variant="outline" colorScheme={item.isHiredOrUnavailable ? "secondary" : "primary"} size="sm" className="w-full" disabled={item.isSuspicious}>{getToggleStatusButtonText(item)}</Button>
                <Button onClick={() => onDeleteItem(item.id, item.type)} variant="outline" colorScheme="accent" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-neutral-dark w-full" size="sm">🗑️ ลบโพสต์</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
