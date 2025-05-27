

import React from 'react';
import type { User } from '../types';
import { HelperEducationLevelOption, GenderOption } from '../types';
import { Button } from './Button';

interface PublicProfilePageProps {
  user: User;
  helperProfileDetails?: string; // Bio from HelperProfile
  onBack: () => void; // Function to navigate back
}

const FallbackAvatarPublic: React.FC<{ name?: string, size?: string }> = ({ name, size = "w-40 h-40" }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '👤';
  return (
    <div className={`${size} rounded-full bg-neutral dark:bg-dark-inputBg flex items-center justify-center text-6xl text-white dark:text-dark-text shadow-lg mx-auto`}>
      {initial}
    </div>
  );
};

const calculateAgePublic = (birthdateString?: string): number | null => {
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

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ user, helperProfileDetails, onBack }) => {
  const age = calculateAgePublic(user.birthdate);

  const renderInfoItem = (label: string, value?: string | number | null, highlight: boolean = false, isMultiline: boolean = false) => {
    if (!value && value !== 0) return null; // Allow 0 for age display
    return (
      <div className="mb-3">
        <span className="font-medium text-neutral-dark dark:text-dark-text">{label}: </span>
        {isMultiline ? (
            <p className={`whitespace-pre-wrap ${highlight ? 'text-lg text-primary dark:text-dark-primary-DEFAULT font-semibold' : 'text-neutral-medium dark:text-dark-textMuted'}`}>
             {value}
            </p>
        ) : (
            <span className={`${highlight ? 'text-lg text-primary dark:text-dark-primary-DEFAULT font-semibold' : 'text-neutral-medium dark:text-dark-textMuted'}`}>
            {value}
            </span>
        )}
      </div>
    );
  };
  
  const personalityItems = [
    { label: "🎧 เพลงที่ชอบ", value: user.favoriteMusic },
    { label: "📚 หนังสือที่ชอบ", value: user.favoriteBook },
    { label: "🎬 หนังที่ชอบ", value: user.favoriteMovie },
    { label: "🧶 งานอดิเรก", value: user.hobbies, isMultiline: true },
    { label: "🍜 อาหารที่ชอบ", value: user.favoriteFood },
    { label: "🚫 สิ่งที่ไม่ชอบที่สุด", value: user.dislikedThing },
    { label: "💬 เกี่ยวกับฉันสั้นๆ", value: user.introSentence, isMultiline: true },
  ].filter(item => item.value && item.value.trim() !== '');


  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl my-8">
      <div className="bg-white dark:bg-dark-cardBg shadow-xl rounded-xl p-6 md:p-10 border border-neutral-DEFAULT dark:border-dark-border">
        
        <div className="text-center mb-8">
          {user.photo ? (
            <img src={user.photo} alt={user.displayName} className="w-40 h-40 rounded-full object-cover shadow-lg mx-auto mb-4" />
          ) : (
            <FallbackAvatarPublic name={user.displayName} />
          )}
          <h2 className="text-3xl font-quicksand font-bold text-secondary-hover dark:text-dark-secondary-hover mt-4">
            {user.displayName}
          </h2>
          <p className="text-md text-neutral-medium dark:text-dark-textMuted">@{user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div>
            {renderInfoItem("อายุ", age ? `${age} ปี` : (user.birthdate ? 'ข้อมูลวันเกิดไม่ถูกต้อง' : null))}
            {renderInfoItem("เพศ", user.gender !== GenderOption.NotSpecified ? user.gender : null)}
            {renderInfoItem("ระดับการศึกษา", user.educationLevel !== HelperEducationLevelOption.NotStated ? user.educationLevel : null)}
          </div>
          <div>
            {user.address && (
                <div>
                    <span className="font-medium text-neutral-dark dark:text-dark-text">ที่อยู่: </span>
                    <p className="text-neutral-medium dark:text-dark-textMuted whitespace-pre-wrap">{user.address}</p>
                </div>
            )}
          </div>
        </div>
        
        {helperProfileDetails && (
          <div className="mb-6 pt-4 border-t border-neutral-DEFAULT/30 dark:border-dark-border/30">
            <h3 className="text-xl font-semibold text-neutral-dark dark:text-dark-text mb-2">ทักษะ / ประสบการณ์ (จากโปรไฟล์ผู้ช่วย):</h3>
            <p className="text-neutral-medium dark:text-dark-textMuted whitespace-pre-wrap p-3 bg-neutral-light dark:bg-dark-inputBg/50 rounded-md">
              {helperProfileDetails}
            </p>
          </div>
        )}
        
        {personalityItems.length > 0 && (
          <div className="mb-6 pt-4 border-t border-neutral-DEFAULT/30 dark:border-dark-border/30">
            <h3 className="text-xl font-semibold text-neutral-dark dark:text-dark-text mb-3">ข้อมูลบุคลิกภาพ:</h3>
            <div className="space-y-2 bg-neutral-light/50 dark:bg-dark-inputBg/30 p-4 rounded-lg">
                {personalityItems.map(item => renderInfoItem(item.label, item.value, false, item.isMultiline))}
            </div>
          </div>
        )}


        <div className="mb-6 pt-4 border-t border-neutral-DEFAULT/30 dark:border-dark-border/30">
          <h3 className="text-xl font-semibold text-neutral-dark dark:text-dark-text mb-3">ข้อมูลติดต่อ:</h3>
          {renderInfoItem("เบอร์โทรศัพท์", user.mobile, true)}
          {renderInfoItem("LINE ID", user.lineId)}
          {renderInfoItem("Facebook", user.facebook)}
          {!user.mobile && !user.lineId && !user.facebook && (
            <p className="text-neutral-medium dark:text-dark-textMuted">ผู้ใช้ไม่ได้ระบุข้อมูลติดต่อสาธารณะ</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={onBack} variant="outline" colorScheme="primary" size="md">
            กลับไปหน้ารายการ
          </Button>
        </div>
      </div>
    </div>
  );
};