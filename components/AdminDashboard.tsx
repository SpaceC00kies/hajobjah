
import React from 'react';
import type { Job, HelperProfile, User } from '../types';
import { Button } from './Button';

export interface AdminItem { // Exporting for App.tsx to use
  id: string;
  itemType: 'job' | 'profile';
  title: string;
  username?: string;
  userId?: string;
  postedAt?: string;
  isPinned?: boolean;
  isSuspicious?: boolean;
  isHiredOrUnavailable?: boolean;
  // Include original item for easier access to all fields if needed for editing
  originalItem: Job | HelperProfile;
}


interface AdminDashboardProps {
  jobs: Job[];
  helperProfiles: HelperProfile[];
  onDeleteJob: (jobId: string) => void;
  onDeleteHelperProfile: (profileId: string) => void;
  onToggleSuspiciousJob: (jobId: string) => void;
  onToggleSuspiciousHelperProfile: (profileId: string) => void;
  onTogglePinnedJob: (jobId: string) => void;
  onTogglePinnedHelperProfile: (profileId: string) => void;
  onToggleHiredJob: (jobId: string) => void;
  onToggleUnavailableHelperProfile: (profileId: string) => void;
  onStartEditItem: (item: AdminItem) => void; // New prop for starting edit
  currentUser: User | null;
}

const formatDateDisplay = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' น.';
  } catch (e) {
    return 'Error Formatting Date';
  }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  jobs,
  helperProfiles,
  onDeleteJob,
  onDeleteHelperProfile,
  onToggleSuspiciousJob,
  onToggleSuspiciousHelperProfile,
  onTogglePinnedJob,
  onTogglePinnedHelperProfile,
  onToggleHiredJob,
  onToggleUnavailableHelperProfile,
  onStartEditItem, // Receive new prop
  currentUser
}) => {

  if (!currentUser || !currentUser.isAdmin) {
    return <div className="p-8 text-center text-red-500 dark:text-red-400">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  const allItems: AdminItem[] = [
    ...jobs.map(job => ({
        ...job,
        itemType: 'job' as const,
        title: job.title,
        isHiredOrUnavailable: job.isHired,
        originalItem: job
    })),
    ...helperProfiles.map(profile => ({
        ...profile,
        itemType: 'profile' as const,
        title: profile.profileTitle,
        isHiredOrUnavailable: profile.isUnavailable,
        originalItem: profile
    })),
  ];

  allItems.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.postedAt && b.postedAt) {
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    }
    return 0;
  });

  const handleDeleteItemClick = (item: AdminItem) => {
    console.log(`[AdminDashboard] handleDeleteItemClick: Triggered for ${item.itemType} ID: ${item.id}, Title: "${item.title}"`);
    if (item.itemType === 'job') {
      console.log(`[AdminDashboard] handleDeleteItemClick: Calling onDeleteJob (prop) for Job ID: ${item.id}`);
      onDeleteJob(item.id);
    } else {
      console.log(`[AdminDashboard] handleDeleteItemClick: Calling onDeleteHelperProfile (prop) for Profile ID: ${item.id}`);
      onDeleteHelperProfile(item.id);
    }
  };

  const renderStatusBadges = (item: AdminItem) => {
    const postedAtDate = item.postedAt ? new Date(item.postedAt) : null;
    const isExpired = !item.isHiredOrUnavailable && postedAtDate ? (new Date().getTime() - postedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;

    let statusElements = [];

    if (item.isPinned) {
      statusElements.push(
        <span key="pinned" className="inline-block bg-yellow-100 text-yellow-800 dark:bg-dark-secondary-DEFAULT/30 dark:text-dark-secondary-hover text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          📌 ปักหมุด
        </span>
      );
    }
    if (item.isHiredOrUnavailable) {
      statusElements.push(
        <span key="hired" className="inline-block bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          ✅ {item.itemType === 'job' ? 'ถูกจ้างแล้ว' : 'ไม่ว่างแล้ว'}
        </span>
      );
    }
    if (item.isSuspicious) {
      statusElements.push(
        <span key="suspicious" className="inline-block bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          ⚠️ น่าสงสัย
        </span>
      );
    }
    if (isExpired) {
      statusElements.push(
        <span key="expired" className="inline-block bg-neutral-200 text-neutral-800 dark:bg-dark-border dark:text-dark-textMuted text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          ⏳ หมดอายุ
        </span>
      );
    }

    if (statusElements.length === 0) {
       statusElements.push(
        <span key="active" className="inline-block bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          🟢 ใช้งานอยู่
        </span>
      );
    }
    return <div className="mt-2 mb-3">{statusElements}</div>;
  };


  const renderAdminItemActions = (item: AdminItem) => {
    const isJob = item.itemType === 'job';
    const deleteButtonText = isJob ? '🗑️ ลบประกาศงาน' : '🗑️ ลบโปรไฟล์';
    return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      <Button
        onClick={() => isJob ? onTogglePinnedJob(item.id) : onTogglePinnedHelperProfile(item.id)}
        variant={item.isPinned ? "secondary" : "outline"}
        colorScheme={item.isPinned ? "secondary" : "primary"}
        size="sm"
      >
        {item.isPinned ? 'ยกเลิกปักหมุด' : '📌 ปักหมุด'}
      </Button>

      <Button
        onClick={() => isJob ? onToggleHiredJob(item.id) : onToggleUnavailableHelperProfile(item.id)}
        variant={item.isHiredOrUnavailable ? "secondary" : "outline"}
        colorScheme={item.isHiredOrUnavailable ? "secondary" : "primary"}
        size="sm"
      >
        {item.isHiredOrUnavailable ? (isJob ? 'ยกเลิกสถานะ' : 'ยกเลิกสถานะ') : (isJob ? 'แจ้งว่ามีคนทำแล้ว' : 'แจ้งว่าไม่ว่างแล้ว')}
      </Button>

      <Button
        onClick={() => isJob ? onToggleSuspiciousJob(item.id) : onToggleSuspiciousHelperProfile(item.id)}
        variant={item.isSuspicious ? "accent" : "outline"}
        colorScheme={"accent"}
        size="sm"
      >
        {item.isSuspicious ? 'ยกเลิกน่าสงสัย' : '⚠️ ตั้งเป็นน่าสงสัย'}
      </Button>

      <Button
        onClick={() => onStartEditItem(item)} // Call onStartEditItem
        variant="outline"
        colorScheme="primary"
        size="sm"
      >
        ✏️ แก้ไขโพสต์
      </Button>

      <Button
        onClick={() => handleDeleteItemClick(item)}
        variant="outline"
        colorScheme="accent"
        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-neutral-dark"
        size="sm"
      >
        {deleteButtonText}
      </Button>
    </div>
  )};


  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-8 text-center">
        🔐 Admin Dashboard
      </h2>

      {allItems.length === 0 ? (
          <p className="text-center text-neutral-medium dark:text-dark-textMuted py-10">ไม่มีข้อมูลในระบบ</p>
        ) : (
          <div className="space-y-6">
            {allItems.map(item => (
              <div key={`${item.itemType}-${item.id}`} className="bg-white dark:bg-dark-cardBg p-4 sm:p-6 rounded-lg shadow-lg border dark:border-dark-border">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                    <h4 className={`font-semibold text-xl ${item.itemType === 'job' ? 'text-primary dark:text-dark-primary-DEFAULT' : 'text-secondary-hover dark:text-dark-secondary-hover'}`}>
                    {item.title}
                    </h4>
                    <span className="text-sm text-neutral-medium dark:text-dark-textMuted mt-1 sm:mt-0">
                    {item.itemType === 'job' ? 'ประกาศงาน' : 'โปรไฟล์ผู้ช่วย'}
                    </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted">
                  โพสต์โดย: @{item.username || 'N/A'} (User ID: {item.userId})
                </p>
                <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mb-2">
                  โพสต์เมื่อ: {formatDateDisplay(item.postedAt)}
                </p>

                {renderStatusBadges(item)}

                {item.itemType === 'job' && (item.originalItem as Job).description && (
                     <p className="text-sm mt-2 text-neutral-dark dark:text-dark-textMuted whitespace-pre-wrap">
                        <strong className="font-medium">รายละเอียด:</strong> {(item.originalItem as Job).description.substring(0,150)}{( (item.originalItem as Job).description.length > 150) ? '...' : ''}
                    </p>
                )}
                {item.itemType === 'profile' && (item.originalItem as HelperProfile).details && (
                     <p className="text-sm mt-2 text-neutral-dark dark:text-dark-textMuted whitespace-pre-wrap">
                        <strong className="font-medium">เกี่ยวกับฉัน:</strong> {(item.originalItem as HelperProfile).details.substring(0,150)}{((item.originalItem as HelperProfile).details.length > 150) ? '...' : ''}
                    </p>
                )}

                {renderAdminItemActions(item)}
              </div>
            ))}
          </div>
        )}
    </div>
  );
};
