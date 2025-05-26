
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { GenderOption, HelperEducationLevelOption } from '../types';
import { Button } from './Button';
import { isValidThaiMobileNumberUtil } from '../App'; 

interface UserProfilePageProps {
  currentUser: User;
  onUpdateProfile: (updatedData: Pick<User, 'mobile' | 'lineId' | 'facebook' | 'gender' | 'birthdate' | 'educationLevel'>) => boolean;
  onCancel: () => void;
}

type UserProfileFormErrorKeys = 'mobile' | 'gender' | 'birthdate' | 'educationLevel' | 'general';
type FeedbackType = { type: 'success' | 'error'; message: string };

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

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ currentUser, onUpdateProfile, onCancel }) => {
  const [mobile, setMobile] = useState(currentUser.mobile);
  const [lineId, setLineId] = useState(currentUser.lineId || '');
  const [facebook, setFacebook] = useState(currentUser.facebook || '');
  const [gender, setGender] = useState(currentUser.gender || GenderOption.NotSpecified);
  const [birthdate, setBirthdate] = useState(currentUser.birthdate || '');
  const [educationLevel, setEducationLevel] = useState(currentUser.educationLevel || HelperEducationLevelOption.NotStated);
  const [currentAge, setCurrentAge] = useState<number | null>(calculateAge(currentUser.birthdate));
  
  const [errors, setErrors] = useState<Partial<Record<UserProfileFormErrorKeys, string>>>({});
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);

  useEffect(() => {
    setMobile(currentUser.mobile);
    setLineId(currentUser.lineId || '');
    setFacebook(currentUser.facebook || '');
    setGender(currentUser.gender || GenderOption.NotSpecified);
    setBirthdate(currentUser.birthdate || '');
    setEducationLevel(currentUser.educationLevel || HelperEducationLevelOption.NotStated);
    setCurrentAge(calculateAge(currentUser.birthdate));
  }, [currentUser]);

  const inputBaseStyle = "w-full p-3 bg-white dark:bg-dark-inputBg border border-[#CCCCCC] dark:border-dark-border rounded-[10px] text-neutral-dark dark:text-dark-text font-normal focus:outline-none";
  const inputFocusStyle = "focus:border-secondary dark:focus:border-dark-secondary-DEFAULT focus:ring-1 focus:ring-secondary/50 dark:focus:ring-dark-secondary-DEFAULT/50";
  const inputErrorStyle = "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500/50 dark:focus:ring-red-400/50";
  const readOnlyStyle = "bg-neutral-light dark:bg-dark-inputBg/50 cursor-not-allowed";
  const selectBaseStyle = `${inputBaseStyle} appearance-none`;

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBirthdate = e.target.value;
    setBirthdate(newBirthdate);
    const age = calculateAge(newBirthdate);
    setCurrentAge(age);
    if (age !== null || newBirthdate === '') { // Clear error if valid or empty
        setErrors(prev => ({ ...prev, birthdate: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<UserProfileFormErrorKeys, string>> = {};
    if (!mobile.trim()) newErrors.mobile = 'กรุณากรอกเบอร์โทรศัพท์';
    else if (!isValidThaiMobileNumberUtil(mobile)) newErrors.mobile = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 08X-XXX-XXXX)';
    
    if (!gender || gender === GenderOption.NotSpecified) newErrors.gender = 'กรุณาเลือกเพศ'; // Assuming NotSpecified is not a valid choice for profile update
    if (!birthdate) newErrors.birthdate = 'กรุณาเลือกวันเกิด';
    else if (calculateAge(birthdate) === null) newErrors.birthdate = 'กรุณาเลือกวันเกิดที่ถูกต้อง (ต้องไม่ใช่วันในอนาคต)';
    if (!educationLevel || educationLevel === HelperEducationLevelOption.NotStated) newErrors.educationLevel = 'กรุณาเลือกระดับการศึกษา';


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFeedback(null); 

    if (!validateForm()) {
      setFeedback({ type: 'error', message: 'ข้อมูลไม่ถูกต้อง โปรดตรวจสอบข้อผิดพลาด' });
      return;
    }

    const success = onUpdateProfile({ mobile, lineId, facebook, gender, birthdate, educationLevel });
    if (success) {
      setFeedback({ type: 'success', message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว!' });
    } else {
      // App.tsx might show specific alerts, this is a fallback
      setFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดบางอย่าง ไม่สามารถบันทึกข้อมูลได้' });
    }
    setTimeout(() => {
        setFeedback(null);
    }, 4000);
  };

  return (
    <div className="bg-white dark:bg-dark-cardBg p-8 rounded-xl shadow-2xl w-full max-w-lg mx-auto my-10 border border-neutral-DEFAULT dark:border-dark-border">
      <h2 className="text-3xl font-semibold text-secondary-hover dark:text-dark-secondary-hover mb-3 text-center">👤 โปรไฟล์ของฉัน</h2>
      
      {feedback && (
        <div 
          className={`p-3 mb-4 rounded-md text-sm font-medium text-center
            ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-300' : ''}
            ${feedback.type === 'error' ? 'bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300' : ''}`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="profileDisplayName" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ชื่อที่แสดง</label>
          <input 
            type="text" 
            id="profileDisplayName" 
            value={currentUser.displayName} 
            readOnly
            className={`${inputBaseStyle} ${readOnlyStyle}`}
            aria-readonly="true"
          />
        </div>

        <div>
          <label htmlFor="profileUsername" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ชื่อผู้ใช้ (สำหรับเข้าระบบ)</label>
          <input 
            type="text" 
            id="profileUsername" 
            value={currentUser.username} 
            readOnly
            className={`${inputBaseStyle} ${readOnlyStyle}`}
            aria-readonly="true"
          />
        </div>

        <div>
          <label htmlFor="profileEmail" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">อีเมล</label>
          <input 
            type="email" 
            id="profileEmail" 
            value={currentUser.email} 
            readOnly
            className={`${inputBaseStyle} ${readOnlyStyle}`}
            aria-readonly="true"
          />
        </div>
        
        <div className="pt-4 border-t border-neutral-DEFAULT/50 dark:border-dark-border/30">
             <h3 className="text-lg font-medium text-neutral-dark dark:text-dark-text mb-3">ข้อมูลส่วนตัว (จะแสดงในโปรไฟล์ผู้ช่วยงาน)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">เพศ <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-1">
                        {Object.values(GenderOption).map(optionValue => (
                        <label key={optionValue} className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="profileGender" value={optionValue} checked={gender === optionValue} 
                                    onChange={() => setGender(optionValue)}
                                    className="form-radio h-4 w-4 text-secondary dark:text-dark-secondary-DEFAULT border-[#CCCCCC] dark:border-dark-border focus:ring-secondary dark:focus:ring-dark-secondary-DEFAULT"/>
                            <span className="text-neutral-dark dark:text-dark-text font-normal text-sm">{optionValue}</span>
                        </label>
                        ))}
                    </div>
                    {errors.gender && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.gender}</p>}
                </div>
                <div>
                    <label htmlFor="profileBirthdate" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">วันเกิด <span className="text-red-500 dark:text-red-400">*</span></label>
                    <input type="date" id="profileBirthdate" value={birthdate} onChange={handleBirthdateChange}
                            max={new Date().toISOString().split("T")[0]}
                            className={`${inputBaseStyle} ${errors.birthdate ? inputErrorStyle : inputFocusStyle}`} />
                    {currentAge !== null && <p className="text-xs text-neutral-dark dark:text-dark-textMuted mt-1">อายุ: {currentAge} ปี</p>}
                    {errors.birthdate && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.birthdate}</p>}
                </div>
            </div>
            <div>
                <label htmlFor="profileEducationLevel" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ระดับการศึกษา <span className="text-red-500 dark:text-red-400">*</span></label>
                <select id="profileEducationLevel" value={educationLevel} 
                        onChange={(e) => setEducationLevel(e.target.value as HelperEducationLevelOption)}
                        className={`${selectBaseStyle} ${errors.educationLevel ? inputErrorStyle : inputFocusStyle}`}>
                    {Object.values(HelperEducationLevelOption).map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
                 {errors.educationLevel && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.educationLevel}</p>}
            </div>
        </div>


        <div className="pt-4 border-t border-neutral-DEFAULT/50 dark:border-dark-border/30">
             <h3 className="text-lg font-medium text-neutral-dark dark:text-dark-text mb-3">ข้อมูลติดต่อ (จะแสดงในโพสต์ของคุณ)</h3>
            <div>
            <label htmlFor="profileMobile" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">เบอร์โทรศัพท์ <span className="text-red-500 dark:text-red-400">*</span></label>
            <input 
                type="tel" 
                id="profileMobile" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)}
                className={`${inputBaseStyle} ${errors.mobile ? inputErrorStyle : inputFocusStyle}`} 
                placeholder="เช่น 0812345678"
                aria-describedby={errors.mobile ? "mobile-error" : undefined}
                aria-invalid={!!errors.mobile}
            />
            {errors.mobile && <p id="mobile-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.mobile}</p>}
            </div>

            <div className="mt-4">
            <label htmlFor="profileLineId" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">LINE ID (ถ้ามี)</label>
            <input 
                type="text" 
                id="profileLineId" 
                value={lineId} 
                onChange={(e) => setLineId(e.target.value)}
                className={`${inputBaseStyle} ${inputFocusStyle}`} 
                placeholder="เช่น mylineid"
            />
            </div>

            <div className="mt-4">
            <label htmlFor="profileFacebook" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">Facebook (ถ้ามี)</label>
            <input 
                type="text" 
                id="profileFacebook" 
                value={facebook} 
                onChange={(e) => setFacebook(e.target.value)}
                className={`${inputBaseStyle} ${inputFocusStyle}`} 
                placeholder="ลิงก์โปรไฟล์ หรือชื่อผู้ใช้ Facebook"
            />
            </div>
        </div>

        {errors.general && <p className="text-red-500 dark:text-red-400 text-sm text-center">{errors.general}</p>}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto flex-grow">💾 บันทึกการเปลี่ยนแปลง</Button>
            <Button type="button" onClick={onCancel} variant="outline" colorScheme="secondary" size="lg" className="w-full sm:w-auto flex-grow">
                ยกเลิก
            </Button>
        </div>
      </form>
    </div>
  );
};