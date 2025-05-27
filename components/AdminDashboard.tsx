
import React from 'react';
import type { Job, HelperProfile, User, Interaction } from '../types'; 
import { Button } from './Button';
import { checkProfileCompleteness, checkHasBeenContacted } from '../App'; 
import type { Timestamp } from 'firebase/firestore';

export interface AdminItem { 
  id: string;
  itemType: 'job' | 'profile';
  title: string;
  username?: string;
  userId?: string;
  postedAt?: Timestamp; // Updated to Firestore Timestamp
  isPinned?: boolean;
  isSuspicious?: boolean;
  isHiredOrUnavailable?: boolean;
  originalItem: Job | HelperProfile;

  adminVerifiedExperience?: boolean;
  profileComplete?: boolean;        
  hasBeenContacted?: boolean;       
}

interface AdminDashboardProps {
  jobs: Job[];
  helperProfiles: HelperProfile[];
  users: User[]; 
  interactions: Interaction[]; 
  onDeleteJob: (jobId: string) => void;
  onDeleteHelperProfile: (profileId: string) => void;
  onToggleSuspiciousJob: (jobId: string) => void;
  onToggleSuspiciousHelperProfile: (profileId: string) => void;
  onTogglePinnedJob: (jobId: string) => void;
  onTogglePinnedHelperProfile: (profileId: string) => void;
  onToggleHiredJob: (jobId: string) => void;
  onToggleUnavailableHelperProfile: (profileId: string) => void;
  onToggleVerifiedExperience: (profileId: string) => void;
  onStartEditItem: (item: AdminItem) => void; 
  currentUser: User | null;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  jobs, helperProfiles, users, interactions,
  onDeleteJob, onDeleteHelperProfile,
  onToggleSuspiciousJob, onToggleSuspiciousHelperProfile,
  onTogglePinnedJob, onTogglePinnedHelperProfile,
  onToggleHiredJob, onToggleUnavailableHelperProfile,
  onToggleVerifiedExperience, onStartEditItem, currentUser
}) => {

  if (!currentUser || !currentUser.isAdmin) {
    return <div className="p-8 text-center text-red-500 dark:text-red-400">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  const allItems: AdminItem[] = [
    ...jobs.map(job => ({
        id: job.id, itemType: 'job' as const, title: job.title,
        username: job.username, userId: job.userId, postedAt: job.postedAt,
        isPinned: job.isPinned, isSuspicious: job.isSuspicious,
        isHiredOrUnavailable: job.isHired, originalItem: job
    })),
    ...helperProfiles.map(profile => {
        const user = users.find(u => u.id === profile.userId);
        return {
            id: profile.id, itemType: 'profile' as const, title: profile.profileTitle,
            username: profile.username, userId: profile.userId, postedAt: profile.postedAt,
            isPinned: profile.isPinned, isSuspicious: profile.isSuspicious,
            isHiredOrUnavailable: profile.isUnavailable, originalItem: profile,
            adminVerifiedExperience: profile.adminVerifiedExperience || false,
            profileComplete: checkProfileCompleteness(user),
            hasBeenContacted: checkHasBeenContacted(profile.userId, interactions), // Check based on helper's main user ID
        };
    }),
  ];

  allItems.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.postedAt && b.postedAt) {
      return b.postedAt.toMillis() - a.postedAt.toMillis(); // Compare Firestore Timestamps
    }
    return 0;
  });

  const handleDeleteItemClick = (item: AdminItem) => {
    if (item.itemType === 'job') onDeleteJob(item.id);
    else onDeleteHelperProfile(item.id);
  };
  
  const renderTrustBadgesForItem = (item: AdminItem) => {
    if (item.itemType !== 'profile') return null;
    return (
      <div className="flex gap-1 flex-wrap my-1">
        {item.adminVerifiedExperience && <span className="bg-yellow-200 text-yellow-800 dark:bg-yellow-600/30 dark:text-yellow-200 text-xs px-2 py-0.5 rounded-full font-medium">⭐ ผ่านงาน</span>}
        {item.profileComplete && <span className="bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200 text-xs px-2 py-0.5 rounded-full font-medium">🟢 ครบถ้วน</span>}
        {item.hasBeenContacted && <span className="bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full font-medium">📌 ผู้ติดต่อ</span>}
        {item.isSuspicious && <span className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200 text-xs px-2 py-0.5 rounded-full font-medium">🔺 ระวัง</span>}
      </div>
    );
  };

  const renderStatusBadges = (item: AdminItem) => {
    const postedAtDate = item.postedAt ? item.postedAt.toDate() : null;
    const isExpired = !item.isHiredOrUnavailable && postedAtDate ? (new Date().getTime() - postedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;
    let statusElements = [];
    if (item.isPinned) statusElements.push(<span key="pinned" className="inline-block bg-yellow-100 text-yellow-800 dark:bg-dark-secondary-DEFAULT/30 dark:text-dark-secondary-hover text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">📌 ปักหมุด</span>);
    if (item.isHiredOrUnavailable) statusElements.push(<span key="hired_job" className={`inline-block text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${item.itemType === 'job' ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'}`}>{item.itemType === 'job' ? '✅ ถูกจ้างแล้ว' : '🚫 ไม่ว่างแล้ว'}</span>);
    if (item.itemType === 'job' && item.isSuspicious) statusElements.push(<span key="suspicious_job" className="inline-block bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">⚠️ งานน่าสงสัย</span>);
    if (isExpired) statusElements.push(<span key="expired" className="inline-block bg-neutral-200 text-neutral-800 dark:bg-dark-border dark:text-dark-textMuted text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">⏳ หมดอายุ</span>);
    if (statusElements.length === 0 && !(item.itemType === 'profile' && item.isSuspicious)) statusElements.push(<span key="active" className="inline-block bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">🟢 ใช้งานอยู่</span>);
    return <div className="mt-2 mb-3">{statusElements}</div>;
  };

  const renderAdminItemActions = (item: AdminItem) => {
    const isJob = item.itemType === 'job';
    return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
      <Button onClick={() => isJob ? onTogglePinnedJob(item.id) : onTogglePinnedHelperProfile(item.id)} variant={item.isPinned ? "secondary" : "outline"} colorScheme={item.isPinned ? "secondary" : "primary"} size="sm">{item.isPinned ? 'ยกเลิกปักหมุด' : '📌 ปักหมุด'}</Button>
      <Button onClick={() => isJob ? onToggleHiredJob(item.id) : onToggleUnavailableHelperProfile(item.id)} variant={item.isHiredOrUnavailable ? "secondary" : "outline"} colorScheme={item.isHiredOrUnavailable ? "secondary" : "primary"} size="sm">{item.isHiredOrUnavailable ? 'ยกเลิกสถานะ' : (isJob ? 'แจ้งว่ามีคนทำแล้ว' : 'แจ้งว่าไม่ว่างแล้ว')}</Button>
      <Button onClick={() => isJob ? onToggleSuspiciousJob(item.id) : onToggleSuspiciousHelperProfile(item.id)} variant={item.isSuspicious ? "accent" : "outline"} colorScheme={"accent"} size="sm">{item.isSuspicious ? (isJob ? 'ยกเลิกงานน่าสงสัย' : 'ยกเลิก User น่าสงสัย') : (isJob ? '⚠️ ตั้งเป็นงานน่าสงสัย' : '🔺 ตั้ง User น่าสงสัย')}</Button>
      {!isJob && (<Button onClick={() => onToggleVerifiedExperience(item.id)} variant={item.adminVerifiedExperience ? "secondary" : "outline"} colorScheme={item.adminVerifiedExperience ? "secondary" : "primary"} size="sm">{item.adminVerifiedExperience ? 'ยกเลิก Verified Exp.' : '⭐ Verified Exp.'}</Button>)}
      <Button onClick={() => onStartEditItem(item)} variant="outline" colorScheme="primary" size="sm">✏️ แก้ไขโพสต์</Button>
      <Button onClick={() => handleDeleteItemClick(item)} variant="outline" colorScheme="accent" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-neutral-dark" size="sm">{isJob ? '🗑️ ลบประกาศงาน' : '🗑️ ลบโปรไฟล์'}</Button>
    </div>
  )};

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-8 text-center">🔐 Admin Dashboard</h2>
      {allItems.length === 0 ? (<p className="text-center text-neutral-medium dark:text-dark-textMuted py-10">ไม่มีข้อมูลในระบบ</p>) : (
          <div className="space-y-6">
            {allItems.map(item => (
              <div key={`${item.itemType}-${item.id}`} className="bg-white dark:bg-dark-cardBg p-4 sm:p-6 rounded-lg shadow-lg border dark:border-dark-border">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                    <h4 className={`font-semibold text-xl ${item.itemType === 'job' ? 'text-primary dark:text-dark-primary-DEFAULT' : 'text-secondary-hover dark:text-dark-secondary-hover'}`}>{item.title}</h4>
                    <span className="text-sm text-neutral-medium dark:text-dark-textMuted mt-1 sm:mt-0">{item.itemType === 'job' ? 'ประกาศงาน' : 'โปรไฟล์ผู้ช่วย'}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted">โพสต์โดย: @{item.username || 'N/A'} (User ID: {item.userId})</p>
                <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mb-2">โพสต์เมื่อ: {formatDateFromTimestamp(item.postedAt)}</p>
                {renderStatusBadges(item)}
                {item.itemType === 'profile' && renderTrustBadgesForItem(item)}
                {item.itemType === 'job' && (item.originalItem as Job).description && (<p className="text-sm mt-2 text-neutral-dark dark:text-dark-textMuted whitespace-pre-wrap"><strong className="font-medium">รายละเอียด:</strong> {(item.originalItem as Job).description.substring(0,150)}{( (item.originalItem as Job).description.length > 150) ? '...' : ''}</p>)}
                {item.itemType === 'profile' && (item.originalItem as HelperProfile).details && (<p className="text-sm mt-2 text-neutral-dark dark:text-dark-textMuted whitespace-pre-wrap"><strong className="font-medium">เกี่ยวกับฉัน:</strong> {(item.originalItem as HelperProfile).details.substring(0,150)}{((item.originalItem as HelperProfile).details.length > 150) ? '...' : ''}</p>)}
                {renderAdminItemActions(item)}
              </div>
            ))}
          </div>
      )}
    </div>
  );
};
