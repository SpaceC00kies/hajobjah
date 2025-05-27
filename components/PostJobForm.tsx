
import React, { useState, useCallback, useEffect } from 'react';
import type { Job, AIPromptDetails } from '../types'; 
import { JobDesiredEducationLevelOption } from '../types';
import { generateJobDescription } from '../services/geminiService'; // Gemini service remains
import { Button } from './Button';
import { Modal } from './Modal';

// FormDataType for fields managed by this form.
// Excludes: id, postedAt, userId, username, contact (derived), admin fields
type FormDataType = Omit<Job, 'id' | 'postedAt' | 'userId' | 'username' | 'contact' | 'isSuspicious' | 'isPinned' | 'isHired'>;

interface PostJobFormProps {
  onSubmitJob: (jobData: FormDataType & { id?: string }) => Promise<void>; 
  onCancel: () => void;
  initialData?: Job; 
  isEditing?: boolean;
}

const initialFormStateForCreate: FormDataType = {
  title: '',
  location: '',
  dateTime: '', 
  payment: '',
  description: '',
  desiredAgeStart: undefined,
  desiredAgeEnd: undefined,
  preferredGender: undefined,
  desiredEducationLevel: undefined,
  dateNeededFrom: '',
  dateNeededTo: '',
  timeNeededStart: '',
  timeNeededEnd: '',
};

type FormErrorsType = Partial<Record<keyof FormDataType, string>>;

export const PostJobForm: React.FC<PostJobFormProps> = ({ onSubmitJob, onCancel, initialData, isEditing }) => {
  const [formData, setFormData] = useState<FormDataType>(initialFormStateForCreate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiPromptData, setAiPromptData] = useState<AIPromptDetails>({
    taskType: '', locationDetails: '', schedule: '', compensationDetails: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrorsType>({});

  useEffect(() => {
    if (isEditing && initialData) {
      const { 
        id, postedAt, userId, username, contact, isSuspicious, isPinned, isHired,
        ...editableFields 
      } = initialData;
      setFormData(editableFields as FormDataType); 
    } else {
      setFormData(initialFormStateForCreate);
    }
  }, [isEditing, initialData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const currentKey = name as keyof FormDataType;

    setFormData(prev => {
      if (currentKey === 'desiredAgeStart' || currentKey === 'desiredAgeEnd') {
        let processedValue: number | undefined;
        if (value === '') {
          processedValue = undefined;
        } else {
          const parsedInt = parseInt(value, 10);
          processedValue = isNaN(parsedInt) ? undefined : parsedInt;
        }
        return { ...prev, [currentKey]: processedValue };
      } else if (currentKey === 'desiredEducationLevel') {
        return { ...prev, [currentKey]: value as JobDesiredEducationLevelOption || undefined };
      } else if (currentKey === 'preferredGender') {
         return { ...prev, [currentKey]: value as Job['preferredGender'] || undefined };
      }
      else {
        return { ...prev, [currentKey]: value };
      }
    });

    if (formErrors[currentKey]) {
      setFormErrors(prev => ({ ...prev, [currentKey]: undefined }));
    }
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as Job['preferredGender'] }));
     if (formErrors[name as keyof FormDataType]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAiPromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAiPromptData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: FormErrorsType = {};
    if (!formData.title.trim()) errors.title = 'กรุณากรอกชื่องาน';
    if (!formData.location.trim()) errors.location = 'กรุณากรอกสถานที่';
    if (!formData.payment.trim()) errors.payment = 'กรุณากรอกค่าจ้าง';
    if (!formData.description.trim()) errors.description = 'กรุณากรอกรายละเอียดงาน';

    if (formData.desiredAgeStart && formData.desiredAgeEnd && formData.desiredAgeStart > formData.desiredAgeEnd) {
      errors.desiredAgeEnd = 'อายุสิ้นสุดต้องไม่น้อยกว่าอายุเริ่มต้น';
    }
     if (formData.desiredAgeStart && (formData.desiredAgeStart < 15 || formData.desiredAgeStart > 80)) {
      errors.desiredAgeStart = 'อายุเริ่มต้นควรอยู่ระหว่าง 15 ถึง 80 ปี';
    }
    if (formData.desiredAgeEnd && (formData.desiredAgeEnd < 15 || formData.desiredAgeEnd > 80)) {
      errors.desiredAgeEnd = 'อายุสิ้นสุดควรอยู่ระหว่าง 15 ถึง 80 ปี';
    }
    if (formData.dateNeededFrom && formData.dateNeededTo && formData.dateNeededTo < formData.dateNeededFrom) {
      errors.dateNeededTo = 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น';
    }
    if (formData.timeNeededStart && formData.timeNeededEnd && formData.timeNeededEnd < formData.timeNeededStart) {
      errors.timeNeededEnd = 'เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่มต้น';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const dataToSubmit: FormDataType & { id?: string } = { ...formData }; 
    if (isEditing && initialData) {
      dataToSubmit.id = initialData.id;
    }
    await onSubmitJob(dataToSubmit);
    setIsSubmitting(false);

    if (!isEditing) { 
        setFormData(initialFormStateForCreate); 
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAiPromptData({ taskType: '', locationDetails: '', schedule: '', compensationDetails: '' }); 
  };

  const handleGenerateDescription = useCallback(async () => {
    if (!aiPromptData.taskType || !aiPromptData.locationDetails || !aiPromptData.schedule || !aiPromptData.compensationDetails) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนสำหรับ AI ช่วยเขียน");
      return;
    }
    setIsGenerating(true);
    try {
      const description = await generateJobDescription(aiPromptData);
      setFormData(prev => ({ ...prev, description }));
      if (formErrors.description) {
        setFormErrors(prev => ({ ...prev, description: undefined }));
      }
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setIsGenerating(false);
      handleCloseModal();
    }
  }, [aiPromptData, formErrors.description]);

  const baseFormFields = [
    { name: 'title', label: 'ชื่องาน', placeholder: 'เช่น พนักงานเสิร์ฟด่วน, ผู้ช่วยทำความสะอาด', required: true },
    { name: 'location', label: 'สถานที่', placeholder: 'เช่น ร้านกาแฟ Cafe Amazon สาขานิมมาน', required: true },
    { name: 'dateTime', label: 'วันที่และเวลา (แบบข้อความ ถ้ามี)', placeholder: 'เช่น 15 ส.ค. 67 (10:00-18:00) หรือ "เสาร์-อาทิตย์นี้"', required: false },
    { name: 'payment', label: 'ค่าจ้าง', placeholder: 'เช่น 400 บาท/วัน, 60 บาท/ชั่วโมง', required: true },
  ] as const; 

  const aiPromptFields = [
    { name: 'taskType', label: 'ต้องการคนช่วยอะไร?', placeholder: 'เช่น ช่วยขายของหน้าร้าน, แพ็คของส่งลูกค้า' },
    { name: 'locationDetails', label: 'ที่ไหน (บอกให้ละเอียดหน่อย)?', placeholder: 'เช่น ร้านเสื้อผ้ามือสอง โครงการ Think Park' },
    { name: 'schedule', label: 'วันและเวลาไหน?', placeholder: 'เช่น ทุกวันเสาร์-อาทิตย์ 13:00-17:00 น.' },
    { name: 'compensationDetails', label: 'ค่าจ้างเท่าไหร่?', placeholder: 'เช่น ชั่วโมงละ 80 บาท จ่ายรายวัน' },
  ];
  
  const inputBaseStyle = "w-full p-3 bg-white dark:bg-dark-inputBg border border-[#CCCCCC] dark:border-dark-border rounded-[10px] text-neutral-dark dark:text-dark-text font-normal focus:outline-none";
  const inputFocusStyle = "focus:border-primary dark:focus:border-dark-primary-DEFAULT focus:ring-1 focus:ring-primary/50 dark:focus:ring-dark-primary-DEFAULT/50";
  const inputErrorStyle = "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500/50 dark:focus:ring-red-400/50";
  const selectBaseStyle = `${inputBaseStyle} appearance-none`;
  const modalInputBaseStyle = "w-full p-2 bg-white dark:bg-dark-inputBg border border-[#CCCCCC] dark:border-dark-border rounded-[10px] text-neutral-dark dark:text-dark-text font-normal focus:outline-none";
  const ageOptions = ['', ...Array.from({ length: (80 - 15) + 1 }, (_, i) => 15 + i)];


  return (
    <div className="bg-white dark:bg-dark-cardBg p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto my-8 border border-neutral-DEFAULT dark:border-dark-border">
      <h2 className="text-3xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-2 text-center">
        {isEditing ? '📝 แก้ไขประกาศงาน' : '📢 มีงานด่วน? บอกให้คนในเชียงใหม่รู้เลย'}
      </h2>
      <p className="text-md text-neutral-dark dark:text-dark-textMuted mb-6 text-center font-normal">
        {isEditing ? 'แก้ไขรายละเอียดประกาศงานของคุณด้านล่าง (ข้อมูลติดต่อจะใช้จากโปรไฟล์ของคุณ)' : 'กรอกรายละเอียดงานที่ต้องการความช่วยเหลือ (ข้อมูลติดต่อจะดึงมาจากโปรไฟล์ของคุณโดยอัตโนมัติ)'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {baseFormFields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">
              {field.label} {field.required && <span className="text-red-500 dark:text-red-400">*</span>}
            </label>
            <input
              type="text" id={field.name} name={field.name}
              value={formData[field.name as keyof typeof formData] ?? ''} 
              onChange={handleChange} placeholder={field.placeholder} disabled={isSubmitting}
              className={`${inputBaseStyle} ${formErrors[field.name as keyof FormErrorsType] ? inputErrorStyle : inputFocusStyle}`}
            />
            {formErrors[field.name as keyof FormErrorsType] && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors[field.name as keyof FormErrorsType]}</p>}
          </div>
        ))}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="description" className="block text-sm font-medium text-neutral-dark dark:text-dark-text">
              รายละเอียดงาน <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            {!isEditing && ( 
              <Button type="button" onClick={handleOpenModal} variant="accent" size="sm" disabled={isSubmitting}>
                🪄 ให้ AI ช่วยเขียน
              </Button>
            )}
          </div>
          <textarea
            id="description" name="description" value={formData.description}
            onChange={handleChange} rows={5} disabled={isSubmitting}
            placeholder="อธิบายลักษณะงาน, คุณสมบัติที่ต้องการ, หรือข้อมูลอื่นๆ ที่สำคัญ..."
            className={`${inputBaseStyle} ${formErrors.description ? inputErrorStyle : inputFocusStyle}`}
          />
           {formErrors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.description}</p>}
        </div>

        <div className="pt-6 border-t border-neutral-DEFAULT dark:border-dark-border/50">
            <h3 className="text-xl font-semibold text-neutral-dark dark:text-dark-text mb-4">ข้อมูลผู้ช่วยที่ต้องการ (ถ้ามี)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
              <div>
                <label htmlFor="dateNeededFrom" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">วันที่ต้องการ: ตั้งแต่</label>
                <input type="date" id="dateNeededFrom" name="dateNeededFrom" value={formData.dateNeededFrom || ''} onChange={handleChange} disabled={isSubmitting}
                       className={`${inputBaseStyle} ${formErrors.dateNeededFrom ? inputErrorStyle : inputFocusStyle}`} />
                {formErrors.dateNeededFrom && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.dateNeededFrom}</p>}
              </div>
              <div>
                <label htmlFor="dateNeededTo" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ถึง (ถ้ามี)</label>
                <input type="date" id="dateNeededTo" name="dateNeededTo" value={formData.dateNeededTo || ''} onChange={handleChange} disabled={isSubmitting}
                       className={`${inputBaseStyle} ${formErrors.dateNeededTo ? inputErrorStyle : inputFocusStyle}`} min={formData.dateNeededFrom}/>
                {formErrors.dateNeededTo && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.dateNeededTo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
              <div>
                <label htmlFor="timeNeededStart" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">เวลาที่ต้องการ: เริ่ม</label>
                <input type="time" id="timeNeededStart" name="timeNeededStart" value={formData.timeNeededStart || ''} onChange={handleChange} disabled={isSubmitting}
                       className={`${inputBaseStyle} ${formErrors.timeNeededStart ? inputErrorStyle : inputFocusStyle}`} />
                {formErrors.timeNeededStart && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.timeNeededStart}</p>}
              </div>
              <div>
                <label htmlFor="timeNeededEnd" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">สิ้นสุด</label>
                <input type="time" id="timeNeededEnd" name="timeNeededEnd" value={formData.timeNeededEnd || ''} onChange={handleChange} disabled={isSubmitting}
                       className={`${inputBaseStyle} ${formErrors.timeNeededEnd ? inputErrorStyle : inputFocusStyle}`} />
                {formErrors.timeNeededEnd && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.timeNeededEnd}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                <div>
                    <label htmlFor="desiredAgeStart" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ช่วงอายุ: ตั้งแต่</label>
                    <select id="desiredAgeStart" name="desiredAgeStart" disabled={isSubmitting}
                        value={formData.desiredAgeStart === undefined ? '' : String(formData.desiredAgeStart)} onChange={handleChange}
                        className={`${selectBaseStyle} ${formErrors.desiredAgeStart ? inputErrorStyle : inputFocusStyle}`}>
                        {ageOptions.map(age => (<option key={`start-${age}`} value={age}>{age === '' ? 'ไม่ระบุ' : `${age} ปี`}</option>))}
                    </select>
                    {formErrors.desiredAgeStart && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.desiredAgeStart}</p>}
                </div>
                <div>
                    <label htmlFor="desiredAgeEnd" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ถึง</label>
                    <select id="desiredAgeEnd" name="desiredAgeEnd" disabled={isSubmitting}
                        value={formData.desiredAgeEnd === undefined ? '' : String(formData.desiredAgeEnd)} onChange={handleChange}
                        className={`${selectBaseStyle} ${formErrors.desiredAgeEnd ? inputErrorStyle : inputFocusStyle}`}>
                         {ageOptions.map(age => (
                            <option key={`end-${age}`} value={age} 
                                disabled={formData.desiredAgeStart !== undefined && age !== '' && typeof age === 'number' ? age < formData.desiredAgeStart : false}>
                                {age === '' ? 'ไม่ระบุ' : `${age} ปี`}
                            </option>
                        ))}
                    </select>
                     {formErrors.desiredAgeEnd && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.desiredAgeEnd}</p>}
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-2">เพศที่ต้องการ</label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {(['ชาย', 'หญิง', 'ไม่จำกัด'] as const).map(gender => (
                        <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="preferredGender" value={gender} checked={formData.preferredGender === gender}
                                onChange={handleRadioChange} disabled={isSubmitting}
                                className="form-radio h-4 w-4 text-primary dark:text-dark-primary-DEFAULT border-[#CCCCCC] dark:border-dark-border focus:ring-primary dark:focus:ring-dark-primary-DEFAULT"/>
                            <span className="text-neutral-dark dark:text-dark-text font-normal">{gender}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
              <label htmlFor="desiredEducationLevel" className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">ระดับการศึกษาที่ต้องการ</label>
              <select id="desiredEducationLevel" name="desiredEducationLevel" value={formData.desiredEducationLevel || ''}
                onChange={handleChange} disabled={isSubmitting}
                className={`${selectBaseStyle} ${formErrors.desiredEducationLevel ? inputErrorStyle : inputFocusStyle}`}>
                <option value="">-- ไม่จำกัด --</option>
                {Object.values(JobDesiredEducationLevelOption).filter(level => level !== JobDesiredEducationLevelOption.Any).map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {formErrors.desiredEducationLevel && <p className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">{formErrors.desiredEducationLevel}</p>}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto flex-grow" disabled={isSubmitting || isGenerating}>
            {isSubmitting ? (isEditing ? 'กำลังบันทึก...' : 'กำลังลงประกาศ...') : (isEditing ? '💾 บันทึกการแก้ไข' : 'ลงประกาศงาน')}
          </Button>
          <Button type="button" onClick={onCancel} variant="outline" colorScheme="primary" size="lg" className="w-full sm:w-auto flex-grow" disabled={isSubmitting}>
            ยกเลิก
          </Button>
        </div>
      </form>

      {!isEditing && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="🪄 ให้ AI ช่วยเขียนรายละเอียดงาน">
            <div className="space-y-4 font-normal">
            <p className="text-sm text-neutral-dark dark:text-dark-textMuted">กรอกข้อมูลคร่าวๆ เพื่อให้ AI ช่วยร่างรายละเอียดงานให้คุณ (ภาษาไทย สุภาพ เรียบง่าย)</p>
            {aiPromptFields.map(field => (
                <div key={field.name}>
                <label htmlFor={`ai-${field.name}`} className="block text-sm font-medium text-neutral-dark dark:text-dark-text mb-1">{field.label}</label>
                <input type="text" id={`ai-${field.name}`} name={field.name} value={aiPromptData[field.name as keyof AIPromptDetails]}
                       onChange={handleAiPromptChange} placeholder={field.placeholder}
                       className={`${modalInputBaseStyle} ${inputFocusStyle}`} />
            </div>
            ))}
            <Button onClick={handleGenerateDescription} disabled={isGenerating} variant="secondary" className="w-full">
                {isGenerating ? 'กำลังสร้าง...' : 'สร้างรายละเอียดงาน'}
            </Button>
            </div>
        </Modal>
      )}
    </div>
  );
};
