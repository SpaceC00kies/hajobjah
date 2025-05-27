
import React, { useState } from 'react';
import type { Job } from '../types';
import { View } from '../types'; // Import View
import { Button } from './Button';
import { Modal } from './Modal';
import type { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp

interface JobCardProps {
  job: Job;
  navigateTo: (view: View) => void;
}

const formatDateFromTimestamp = (timestamp?: Timestamp): string | null => {
  if (!timestamp) return null;
  try {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to Date
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return null; 
  }
};

const formatDateDisplay = (dateString?: string): string | null => { // For YYYY-MM-DD strings
  if (!dateString) return null;
  try {
    // Assuming dateString is YYYY-MM-DD, split and reorder for Date constructor
    // to avoid timezone issues with new Date(string)
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) -1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return dateString; // Fallback to original if parsing failed
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateString; // Fallback for unexpected format
  } catch (e) {
    return dateString; // Fallback if any error
  }
};


export const JobCard: React.FC<JobCardProps> = ({ job, navigateTo }) => {
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  const handleInterest = () => {
    setIsWarningModalOpen(true); 
  };

  const closeInterestModal = () => setIsInterestModalOpen(false);
  const closeWarningModal = () => setIsWarningModalOpen(false);

  const handleProceedToContact = () => {
    setIsWarningModalOpen(false); 
    setIsInterestModalOpen(true); 
  };

  const formatAgeRange = () => {
    const { desiredAgeStart, desiredAgeEnd } = job;
    if (desiredAgeStart && desiredAgeEnd) {
      return desiredAgeStart === desiredAgeEnd ? `${desiredAgeStart} ปี` : `${desiredAgeStart} - ${desiredAgeEnd} ปี`;
    }
    if (desiredAgeStart) return `ตั้งแต่ ${desiredAgeStart} ปี`;
    if (desiredAgeEnd) return `ถึง ${desiredAgeEnd} ปี`;
    return null;
  };

  const ageRangeText = formatAgeRange();
  const dateNeededFromText = formatDateDisplay(job.dateNeededFrom);
  const dateNeededToText = formatDateDisplay(job.dateNeededTo);
  
  const postedAtDate = job.postedAt ? job.postedAt.toDate() : null; // Convert Timestamp to Date
  const formattedPostedAt = postedAtDate ? formatDateFromTimestamp(job.postedAt) : null;
  
  const isExpired = !job.isHired && postedAtDate ? (new Date().getTime() - postedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;

  let dateNeededDisplay = '';
  if (dateNeededFromText && dateNeededToText) {
    dateNeededDisplay = `${dateNeededFromText} - ${dateNeededToText}`;
  } else if (dateNeededFromText) {
    dateNeededDisplay = dateNeededFromText;
  }

  let timeNeededDisplay = '';
  if (job.timeNeededStart && job.timeNeededEnd) {
    timeNeededDisplay = `${job.timeNeededStart} - ${job.timeNeededEnd} น.`;
  } else if (job.timeNeededStart) {
    timeNeededDisplay = `${job.timeNeededStart} น.`;
  }

  const contactText = job.contact;
  const useBoxStyleForContact = typeof contactText === 'string' && 
                                (contactText.includes('เบอร์โทร:') || contactText.includes('LINE ID:') || contactText.includes('Facebook:'));

  return (
    <>
      <div className="bg-white dark:bg-dark-cardBg shadow-lg rounded-xl p-6 mb-6 border border-neutral-DEFAULT dark:border-dark-border hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        {job.isPinned && (
           <div className="mb-3 p-2 bg-yellow-100 dark:bg-dark-secondary-DEFAULT/30 border border-yellow-300 dark:border-dark-secondary-DEFAULT/50 rounded-md text-center">
            <p className="text-sm font-medium text-yellow-700 dark:text-dark-secondary-hover">📌 ปักหมุดโดยแอดมิน</p>
          </div>
        )}
         {job.isHired && (
           <div className="mb-3 p-2 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-500/50 rounded-md text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ งานนี้มีคนทำแล้ว</p>
          </div>
        )}
        {job.isSuspicious && (
          <div className="mb-3 p-2 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-500/50 rounded-md text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">⚠️ โพสต์นี้น่าสงสัย โปรดใช้ความระมัดระวังเป็นพิเศษ</p>
          </div>
        )}
        <h3 className="text-2xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-2">{job.title}</h3>
        <div className="space-y-2 text-neutral-dark dark:text-dark-textMuted mb-4 flex-grow font-normal">
          <p><strong className="font-medium text-neutral-dark dark:text-dark-text">📍 สถานที่:</strong> {job.location}</p>
          {dateNeededDisplay && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">🗓️ วันที่ต้องการ:</strong> {dateNeededDisplay}</p>)}
          {timeNeededDisplay && (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">⏰ เวลา:</strong> {timeNeededDisplay}</p>)}
          {job.dateTime && (!dateNeededDisplay || !timeNeededDisplay) && ( 
             <p><strong className="font-medium text-neutral-dark dark:text-dark-text">📅 วันที่/เวลา (เพิ่มเติม):</strong> {job.dateTime}</p>
          )}
          <p><strong className="font-medium text-neutral-dark dark:text-dark-text">💰 ค่าจ้าง:</strong> {job.payment}</p>
          {useBoxStyleForContact ? (
            <div className="mt-2">
              <strong className="font-medium text-neutral-dark dark:text-dark-text">📞 ช่องทางติดต่อ:</strong>
              <div className="mt-1 text-sm bg-neutral-light dark:bg-dark-inputBg dark:text-dark-text p-3 rounded-md whitespace-pre-wrap border border-neutral-DEFAULT/50 dark:border-dark-border/50">{contactText}</div>
            </div>
          ) : (<p><strong className="font-medium text-neutral-dark dark:text-dark-text">📞 ติดต่อ:</strong> {contactText}</p>)}
          
          {(ageRangeText || job.preferredGender || job.desiredEducationLevel) && (
            <div className="pt-2 mt-2 border-t border-neutral-DEFAULT/50 dark:border-dark-border/30">
              <p className="text-sm font-semibold text-neutral-dark dark:text-dark-text mb-1">คุณสมบัติผู้ช่วยที่ต้องการ:</p>
              {ageRangeText && (<p className="text-sm"><strong className="font-medium">ช่วงอายุ:</strong> {ageRangeText}</p>)}
              {job.preferredGender && (<p className="text-sm"><strong className="font-medium">เพศ:</strong> {job.preferredGender}</p>)}
              {job.desiredEducationLevel && (<p className="text-sm"><strong className="font-medium">ระดับการศึกษา:</strong> {job.desiredEducationLevel}</p>)}
            </div>
          )}
          <div className="mt-2">
            <strong className="font-medium text-neutral-dark dark:text-dark-text">📝 รายละเอียดงาน:</strong>
            <div className="mt-1 text-sm bg-neutral-light dark:bg-dark-inputBg dark:text-dark-text p-3 rounded-md whitespace-pre-wrap h-24 overflow-y-auto font-normal border border-neutral-DEFAULT/50 dark:border-dark-border/50">{job.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
          </div>
          {job.username && (<p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mt-3 ml-2">📎 โพสต์โดย: @{job.username}</p>)}
          {formattedPostedAt && (
            <p className="text-xs sm:text-sm text-neutral-medium dark:text-dark-textMuted mt-1 pt-2 border-t border-neutral-DEFAULT/30 dark:border-dark-border/20">📅 โพสต์เมื่อ: {formattedPostedAt}</p>
          )}
        </div>
        {isExpired && ( 
          <div className="text-center mt-3 mb-2">
            <span className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium inline-block">⛔ โพสต์นี้เกิน 1 เดือนแล้ว</span>
          </div>
        )}
        <Button onClick={handleInterest} variant="primary" size="md" className="w-full mt-auto" disabled={job.isHired}>
          {job.isHired ? '✅ มีคนทำแล้ว' : '📨 สนใจงานนี้'}
        </Button>
      </div>

      <Modal isOpen={isWarningModalOpen} onClose={closeWarningModal} title="⚠️ โปรดระวังมิจฉาชีพ">
        <div className="bg-accent/10 dark:bg-dark-accent-DEFAULT/10 border border-accent/30 dark:border-dark-accent-DEFAULT/30 p-4 rounded-md my-2 text-neutral-dark dark:text-dark-textMuted">
          <p className="mb-2">⚠️ โปรดใช้ความระมัดระวัง <strong className="text-red-600 dark:text-red-400">ห้ามโอนเงินก่อนเริ่มงาน</strong> และควรนัดเจอในที่ปลอดภัย</p>
          <p>หาจ๊อบจ้าเป็นเพียงพื้นที่ให้คนเจอกัน โปรดใช้วิจารณญาณในการติดต่อ ฉบับเต็มโปรดอ่านที่หน้า <button onClick={() => { closeWarningModal(); navigateTo(View.Safety);}} className="text-accent dark:text-dark-accent-DEFAULT hover:underline font-semibold">"โปรดอ่านเพื่อความปลอดภัย"</button></p>
        </div>
        <Button onClick={handleProceedToContact} variant="accent" className="w-full mt-4">เข้าใจแล้ว ดำเนินการต่อ</Button>
      </Modal>

      <Modal isOpen={isInterestModalOpen} onClose={closeInterestModal} title="ขอบคุณที่สนใจงานนี้!">
        <div className="text-neutral-dark dark:text-dark-textMuted font-normal">
          <p className="mb-4">กรุณาติดต่อผู้ประกาศโดยตรงตามข้อมูลด้านล่างเพื่อสอบถามรายละเอียดเพิ่มเติม หรือนัดสัมภาษณ์</p>
          <div className="bg-neutral-light dark:bg-dark-inputBg p-4 rounded-md border border-neutral-DEFAULT dark:border-dark-border whitespace-pre-wrap">
            <p className="font-semibold text-neutral-dark dark:text-dark-text">ข้อมูลติดต่อ:</p>
            <p>{job.contact}</p>
          </div>
          <Button onClick={closeInterestModal} variant="primary" className="w-full mt-6">ปิดหน้าต่างนี้</Button>
        </div>
      </Modal>
    </>
  );
};
