import React, { useState } from 'react';
import type { HelperProfile } from '../types';
import { GenderOption, HelperEducationLevelOption } from '../types'; // Import for comparison if needed
import { Button } from './Button';
import { Modal } from './Modal';

interface HelperCardProps {
  profile: HelperProfile;
}

const calculateAge = (birthdateString?: string): number | null => {
  if (!birthdateString) return null;
  const birthDate = new Date(birthdateString);
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

const formatDateDisplay = (dateString?: string): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return null;
  }
};

export const HelperCard: React.FC<HelperCardProps> = ({ profile }) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  const handleContact = () => {
    setIsWarningModalOpen(true); 
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  const closeWarningModal = () => {
    setIsWarningModalOpen(false);
  };

  const handleProceedToContact = () => {
    setIsWarningModalOpen(false); 
    setIsContactModalOpen(true); 
  };
  
  const age = calculateAge(profile.birthdate);
  const availabilityDateFromText = formatDateDisplay(profile.availabilityDateFrom);
  const availabilityDateToText = formatDateDisplay(profile.availabilityDateTo);
  const postedAtDate = profile.postedAt ? new Date(profile.postedAt) : null;
  const formattedPostedAt = postedAtDate && !isNaN(postedAtDate.getTime()) ? formatDateDisplay(profile.postedAt) : null;
  
  const isExpired = !profile.isUnavailable && postedAtDate ? (new Date().getTime() - postedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;

  let availabilityDateDisplay = '';
  if (availabilityDateFromText && availabilityDateToText) {
    availabilityDateDisplay = `${availabilityDateFromText} - ${availabilityDateToText}`;
  } else if (availabilityDateFromText) {
    availabilityDateDisplay = `ตั้งแต่ ${availabilityDateFromText}`;
  } else if (availabilityDateToText) {
    availabilityDateDisplay = `ถึง ${availabilityDateToText}`;
  }

  const contactText = profile.contact;
  const useBoxStyleForContact = typeof contactText === 'string' && 
                                (contactText.includes('เบอร์โทร:') || contactText.includes('LINE ID:') || contactText.includes('Facebook:'));

  return (
    <>
      <div className="bg-white dark:bg-dark-cardBg shadow-lg rounded-xl p-6 mb-6 border border-neutral-DEFAULT dark:border-dark-border hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {profile.isPinned && (
           <div className="mb-3 p-2 bg-yellow-100 dark:bg-dark-secondary-DEFAULT/30 border border-yellow-300 dark:border-dark-secondary-DEFAULT/50 rounded-md text-center">
            <p className="text-sm font-medium text-yellow-700 dark:text-dark-secondary-hover">
              📌 ปักหมุดโดยแอดมิน
            </p>
          </div>
        )}
        {profile.isUnavailable && (
           <div className="mb-3 p-2 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-500/50 rounded-md text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              ✅ ผู้ช่วยคนนี้ไม่ว่างแล้ว
            </p>
          </div>
        )}
        {profile.isSuspicious && (
          <div className="mb-3 p-2 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-500/50 rounded-md text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              ⚠️ โปรไฟล์นี้น่าสงสัย โปรดใช้ความระมัดระวังเป็นพิเศษ
            </p>
          </div>
        )}
        <h3 className="text-2xl font-semibold text-secondary-hover dark:text-dark-secondary-hover mb-2">{profile.profileTitle}</h3>
        <div className="space-y-2 text-neutral-dark dark:text-dark-textMuted mb-4 flex-grow font-normal">
          {profile.gender && profile.gender !== GenderOption.NotSpecified && (
            <p><strong className="font-medium text-neutral-dark dark:text-dark-text">เพศ:</strong> {profile.gender}</p>
          )}
          {age !== null && (
            <p><strong className="font-medium text-neutral-dark dark:text-dark-text">อายุ:</strong> {age} ปี</p>
          )}
          {profile.educationLevel && profile.educationLevel !== HelperEducationLevelOption.NotStated && (
            <p><strong className="font-medium text-neutral-dark dark:text-dark-text">ระดับการศึกษา:</strong> {profile.educationLevel}</p>
          )}
          <p><strong className="font-medium text-neutral-dark dark:text-dark-text">📍 พื้นที่สะดวก:</strong> {profile.area}</p>
          
          {availabilityDateDisplay && (
             <p><strong className="font-medium text-neutral-dark dark:text-dark-text">🗓️ ช่วงวันที่สะดวก:</strong> {availabilityDateDisplay}</p>
          )}
          {profile.availabilityTimeDetails && (
             <p><strong className="font-medium text-neutral-dark dark:text-dark-text">⏰ เวลาที่สะดวก (เพิ่มเติม):</strong> {profile.availabilityTimeDetails}</p>
          )}
          {profile.availability && (!availabilityDateDisplay || !profile.availabilityTimeDetails) && ( 
            <p><strong className="font-medium text-neutral-dark dark:text-dark-text">🕒 วันเวลาที่ว่าง (หมายเหตุ):</strong> {profile.availability}</p>
          )}

          {useBoxStyleForContact ? (
            <div className="mt-2">
              <strong className="font-medium text-neutral-dark dark:text-dark-text">📞 ช่องทางติดต่อ:</strong>
              <div className="mt-1 text-sm bg-neutral-light dark:bg-dark-inputBg dark:text-dark-text p-3 rounded-md whitespace-pre-wrap border border-neutral-DEFAULT/50 dark:border-dark-border/50">
                {contactText}
              </div>
            </div>
          ) : (
            <p><strong className="font-medium text-neutral-dark dark:text-dark-text">📞 ติดต่อ:</strong> {contactText}</p>
          )}

           <div className="mt-2">
            <strong className="font-medium text-neutral-dark dark:text-dark-text">📝 เกี่ยวกับฉัน:</strong>
            <div className="mt-1 text-sm bg-neutral-light dark:bg-dark-inputBg dark:text-dark-text p-3 rounded-md whitespace-pre-wrap h-24 overflow-y-auto font-normal border border-neutral-DEFAULT/50 dark:border-dark-border/50">{profile.details || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
          </div>

          {profile.username && (
             <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mt-3">
              📎 โพสต์โดย: @{profile.username}
            </p>
          )}

          {formattedPostedAt && (
            <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mt-1 pt-2 border-t border-neutral-DEFAULT/30 dark:border-dark-border/20">
              📅 โปรไฟล์โพสต์เมื่อ: {formattedPostedAt}
            </p>
          )}
        </div>
         {isExpired && ( 
          <div className="text-center mt-3 mb-2">
            <span className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium inline-block">
              ⛔ โปรไฟล์นี้เกิน 1 เดือนแล้ว
            </span>
          </div>
        )}
        <Button 
          onClick={handleContact} 
          variant="secondary" 
          size="md" 
          className="w-full mt-auto"
          disabled={profile.isUnavailable} 
        >
          {profile.isUnavailable ? '✅ ไม่ว่างแล้ว' : '📞 ติดต่อคนนี้'}
        </Button>
      </div>
      
      <Modal isOpen={isWarningModalOpen} onClose={closeWarningModal} title="⚠️ โปรดระวังมิจฉาชีพ">
        <div className="bg-accent/10 dark:bg-dark-accent-DEFAULT/10 border border-accent/30 dark:border-dark-accent-DEFAULT/30 p-4 rounded-md my-2 text-neutral-dark dark:text-dark-textMuted">
          <p className="mb-2">หาจ๊อบจ้าเป็นเพียงสื่อกลางในการเชื่อมต่อผู้ว่าจ้างและผู้สมัคร</p>
          <p className="mb-2 font-semibold text-red-600 dark:text-red-400">โปรดอย่าโอนเงินล่วงหน้าโดยเด็ดขาด</p>
          <p>หากเกิดความเสียหาย ทางเว็บจะไม่รับผิดชอบใด ๆ ทั้งสิ้น</p>
        </div>
        <Button onClick={handleProceedToContact} variant="accent" className="w-full mt-4">
          เข้าใจแล้ว
        </Button>
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={closeContactModal} title="ติดต่อผู้ช่วย">
        <div className="text-neutral-dark dark:text-dark-textMuted font-normal">
          <p className="mb-4">กรุณาติดต่อผู้ช่วยโดยตรงตามข้อมูลด้านล่าง:</p>
          <div className="bg-neutral-light dark:bg-dark-inputBg p-4 rounded-md border border-neutral-DEFAULT dark:border-dark-border whitespace-pre-wrap">
            <p className="font-semibold text-neutral-dark dark:text-dark-text">ข้อมูลติดต่อ:</p>
            <p>{profile.contact}</p>
          </div>
          <Button onClick={closeContactModal} variant="primary" className="w-full mt-6">
            ปิดหน้าต่างนี้
          </Button>
        </div>
      </Modal>
    </>
  );
};