
import React, { useState } from 'react';
import type { EnrichedHelperProfile } from '../types'; 
import { GenderOption, HelperEducationLevelOption, View } from '../types'; 
import { Button } from './Button';
import { Modal } from './Modal';
import type { Timestamp } from 'firebase/firestore';

interface HelperCardProps {
  profile: EnrichedHelperProfile; 
  onNavigateToPublicProfile: (userId: string) => void; 
  navigateTo: (view: View) => void; 
  onLogHelperContact: (helperProfileId: string) => void; 
}

const FallbackAvatarDisplay: React.FC<{ name?: string, size?: string }> = ({ name, size = "w-16 h-16" }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '👤';
  return (
    <div className={`${size} rounded-full bg-neutral dark:bg-dark-inputBg flex items-center justify-center text-2xl text-white dark:text-dark-text shadow`}>
      {initial}
    </div>
  );
};

const calculateAge = (birthdateString?: string): number | null => {
  if (!birthdateString) return null;
  const birthDate = new Date(birthdateString); // Assumes YYYY-MM-DD
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  if (birthDate > today) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDateFromTimestamp = (timestamp?: Timestamp): string | null => {
  if (!timestamp) return null;
  try {
    const date = timestamp.toDate();
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return null; }
};

const formatDateDisplay = (dateString?: string): string | null => { // For YYYY-MM-DD strings
  if (!dateString) return null;
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) -1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateString;
  } catch (e) { return dateString; }
};

const TrustBadgesDisplay: React.FC<{ profile: EnrichedHelperProfile }> = ({ profile }) => {
  return (
    <div className="flex gap-1 flex-wrap my-2">
      {profile.verifiedExperienceBadge && (<span className="bg-yellow-200 text-yellow-800 dark:bg-yellow-600/30 dark:text-yellow-200 text-xs px-2 py-0.5 rounded-full font-medium">⭐ ผ่านงานมาก่อน</span>)}
      {profile.profileCompleteBadge && (<span className="bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200 text-xs px-2 py-0.5 rounded-full font-medium">🟢 โปรไฟล์ครบถ้วน</span>)}
      {profile.hasBeenContactedBadge && (<span className="bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full font-medium">📌 มีผู้ติดต่อแล้ว</span>)}
      {(profile.interestedCount || 0) > 0 && (<span className="bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full font-medium">📌 มีผู้กดสนใจแล้ว {profile.interestedCount} ครั้ง</span>)}
      {profile.warningBadge && (<span className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200 text-xs px-2 py-0.5 rounded-full font-medium">🔺 ระวังผู้ใช้นี้</span>)}
    </div>
  );
};

export const HelperCard: React.FC<HelperCardProps> = ({ profile, onNavigateToPublicProfile, navigateTo, onLogHelperContact }) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  const handleContact = () => setIsWarningModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);
  const closeWarningModal = () => setIsWarningModalOpen(false);

  const handleProceedToContact = () => {
    onLogHelperContact(profile.id); // Pass HelperProfile ID
    setIsWarningModalOpen(false); 
    setIsContactModalOpen(true); 
  };
  
  const age = calculateAge(profile.birthdate);
  const availabilityDateFromText = formatDateDisplay(profile.availabilityDateFrom);
  const availabilityDateToText = formatDateDisplay(profile.availabilityDateTo);
  
  const postedAtDate = profile.postedAt ? profile.postedAt.toDate() : null;
  const formattedPostedAt = postedAtDate ? formatDateFromTimestamp(profile.postedAt) : null;
  
  const isExpired = !profile.isUnavailable && postedAtDate ? (new Date().getTime() - postedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;

  let availabilityDateDisplay = '';
  if (availabilityDateFromText && availabilityDateToText) availabilityDateDisplay = `${availabilityDateFromText} - ${availabilityDateToText}`;
  else if (availabilityDateFromText) availabilityDateDisplay = `ตั้งแต่ ${availabilityDateFromText}`;
  else if (availabilityDateToText) availabilityDateDisplay = `ถึง ${availabilityDateToText}`;

  const contactText = profile.contact;
  const useBoxStyleForContact = typeof contactText === 'string' && (contactText.includes('เบอร์โทร:') || contactText.includes('LINE ID:') || contactText.includes('Facebook:'));
  const shortAddress = profile.userAddress ? profile.userAddress.split(',')[0] : null;

  return (
    <>
      <div className="bg-white dark:bg-dark-cardBg shadow-lg rounded-xl p-6 mb-6 border border-neutral-DEFAULT dark:border-dark-border hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {profile.isPinned && (<div className="mb-3 p-2 bg-yellow-100 dark:bg-dark-secondary-DEFAULT/30 border border-yellow-300 dark:border-dark-secondary-DEFAULT/50 rounded-md text-center"><p className="text-sm font-medium text-yellow-700 dark:text-dark-secondary-hover">📌 ปักหมุดโดยแอดมิน</p></div>)}
        {profile.isUnavailable && (<div className="mb-3 p-2 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-500/50 rounded-md text-center"><p className="text-sm font-medium text-red-700 dark:text-red-300">🚫 ผู้ช่วยคนนี้ไม่ว่างแล้ว</p></div>)}
        {profile.isSuspicious && !profile.warningBadge && (<div className="mb-3 p-2 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-500/50 rounded-md text-center"><p className="text-sm font-medium text-red-700 dark:text-red-300">⚠️ โปรไฟล์นี้น่าสงสัย โปรดใช้ความระมัดระวังเป็นพิเศษ</p></div>)}

        <div className="flex items-start mb-1">
          {profile.userPhotoURL ? (<img src={profile.userPhotoURL} alt={profile.userDisplayName} className="w-16 h-16 rounded-full object-cover mr-4 shadow" />) : (<FallbackAvatarDisplay name={profile.userDisplayName} />)}
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-secondary-hover dark:text-dark-secondary-hover">{profile.profileTitle}</h3>
            <p className="text-sm text-neutral-medium dark:text-dark-textMuted">โดย: @{profile.username}</p>
          </div>
        </div>
        <TrustBadgesDisplay profile={profile} />
        <div className="space-y-2 text-neutral-dark dark:text-dark-textMuted mb-4 flex-grow font-normal">
          {profile.gender && profile.gender !== GenderOption.NotSpecified && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">เพศ:</strong> {profile.gender}</p>)}
          {age !== null && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">อายุ:</strong> {age} ปี</p>)}
          {profile.educationLevel && profile.educationLevel !== HelperEducationLevelOption.NotStated && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">ระดับการศึกษา:</strong> {profile.educationLevel}</p>)}
          <p><strong className="font-medium text-neutral-dark dark:text-dark-text">📍 พื้นที่สะดวก:</strong> {profile.area}{shortAddress && `, ${shortAddress}`}</p>
          {availabilityDateDisplay && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">🗓️ ช่วงวันที่สะดวก:</strong> {availabilityDateDisplay}</p>)}
          {profile.availabilityTimeDetails && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">⏰ เวลาที่สะดวก (เพิ่มเติม):</strong> {profile.availabilityTimeDetails}</p>)}
          {profile.availability && (!availabilityDateDisplay || !profile.availabilityTimeDetails) && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">🕒 วันเวลาที่ว่าง (หมายเหตุ):</strong> {profile.availability}</p>)}
          {useBoxStyleForContact ? (
            <div className="mt-2"><strong className="font-medium text-neutral-dark dark:text-dark-text">📞 ช่องทางติดต่อ:</strong><div className="mt-1 text-sm bg-neutral-light dark:bg-dark-inputBg dark:text-dark-text p-3 rounded-md whitespace-pre-wrap border border-neutral-DEFAULT/50 dark:border-dark-border/50">{contactText}</div></div>
          ) : (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">📞 ติดต่อ:</strong> {contactText}</p>)}
           <div className="mt-2"><strong className="font-medium text-neutral-dark dark:text-dark-text">📝 เกี่ยวกับฉัน:</strong><div className="mt-1 text-sm bg-neutral-light dark:bg-dark-inputBg dark:text-dark-text p-3 rounded-md whitespace-pre-wrap h-24 overflow-y-auto font-normal border border-neutral-DEFAULT/50 dark:border-dark-border/50">{profile.details || 'ไม่มีรายละเอียดเพิ่มเติม'}</div></div>
          {formattedPostedAt && (<p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mt-1 pt-2 border-t border-neutral-DEFAULT/30 dark:border-dark-border/20">📅 โปรไฟล์โพสต์เมื่อ: {formattedPostedAt}</p>)}
        </div>
         {isExpired && (<div className="text-center mt-3 mb-2"><span className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium inline-block">⛔ โปรไฟล์นี้เกิน 1 เดือนแล้ว</span></div>)}
        <div className="mt-auto space-y-2">
            <Button onClick={() => onNavigateToPublicProfile(profile.userId)} variant="outline" colorScheme="secondary" size="md" className="w-full">👁️ ดูโปรไฟล์เต็ม</Button>
            <Button onClick={handleContact} variant="secondary" size="md" className="w-full" disabled={profile.isUnavailable}>{profile.isUnavailable ? '🚫 ไม่ว่างแล้ว' : '📞 ติดต่อคนนี้'}</Button>
        </div>
      </div>
      
      <Modal isOpen={isWarningModalOpen} onClose={closeWarningModal} title="⚠️ โปรดระวังมิจฉาชีพ">
        <div className="bg-accent/10 dark:bg-dark-accent-DEFAULT/10 border border-accent/30 dark:border-dark-accent-DEFAULT/30 p-4 rounded-md my-2 text-neutral-dark dark:text-dark-textMuted">
          <p className="mb-2">⚠️ โปรดใช้ความระมัดระวัง <strong className="text-red-600 dark:text-red-400">ห้ามโอนเงินก่อนเริ่มงาน</strong> และควรนัดเจอในที่ปลอดภัย</p>
          <p>หาจ๊อบจ้าเป็นเพียงพื้นที่ให้คนเจอกัน โปรดใช้วิจารณญาณในการติดต่อ ฉบับเต็มโปรดอ่านที่หน้า <button onClick={() => { closeWarningModal(); navigateTo(View.Safety);}} className="text-accent dark:text-dark-accent-DEFAULT hover:underline font-semibold">"โปรดอ่านเพื่อความปลอดภัย"</button></p>
        </div>
        <Button onClick={handleProceedToContact} variant="accent" className="w-full mt-4">เข้าใจแล้ว ดำเนินการต่อ</Button>
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={closeContactModal} title="ติดต่อผู้ช่วย">
        <div className="text-neutral-dark dark:text-dark-textMuted font-normal">
          <p className="mb-4">กรุณาติดต่อผู้ช่วยโดยตรงตามข้อมูลด้านล่าง:</p>
          <div className="bg-neutral-light dark:bg-dark-inputBg p-4 rounded-md border border-neutral-DEFAULT dark:border-dark-border whitespace-pre-wrap">
            <p className="font-semibold text-neutral-dark dark:text-dark-text">ข้อมูลติดต่อ:</p>
            <p>{profile.contact}</p>
          </div>
          <Button onClick={closeContactModal} variant="primary" className="w-full mt-6">ปิดหน้าต่างนี้</Button>
        </div>
      </Modal>
    </>
  );
};
