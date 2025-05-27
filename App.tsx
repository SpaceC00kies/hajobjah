
import "./firebase";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Job, HelperProfile, User, EnrichedHelperProfile } from './types';
import type { AdminItem as AdminItemType } from './components/AdminDashboard';
import { View, GenderOption, HelperEducationLevelOption } from './types';
import { PostJobForm } from './components/PostJobForm';
import { JobCard } from './components/JobCard';
import { Button } from './components/Button';
import { OfferHelpForm } from './components/OfferHelpForm';
import { HelperCard } from './components/HelperCard';
import { RegistrationForm } from './components/RegistrationForm';
import { LoginForm } from './components/LoginForm';
import { AdminDashboard } from './components/AdminDashboard';
import { ConfirmModal } from './components/ConfirmModal';
import { MyPostsPage } from './components/MyPostsPage';
import { UserProfilePage } from './components/UserProfilePage';
import { AboutUsPage } from './components/AboutUsPage';
import { PublicProfilePage } from './components/PublicProfilePage';
import { SafetyPage } from './components/SafetyPage';
import { FeedbackForm } from './components/FeedbackForm'; // New Import

type Theme = 'light' | 'dark';
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@hajobjah.com";
const ADMIN_PASSWORD = "adminpass"; // DEMO ONLY - highly insecure

export const isValidThaiMobileNumberUtil = (mobile: string): boolean => {
  if (!mobile) return false;
  const cleaned = mobile.replace(/[\s-]/g, '');
  return /^0[689]\d{8}$/.test(cleaned);
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const [theme, setTheme] = useState<Theme>('light');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null); 

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // Feedback Form State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackSubmissionStatus, setFeedbackSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackSubmissionMessage, setFeedbackSubmissionMessage] = useState<string | null>(null);


  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('chiangMaiQuickUsers');
    const adminUser: User = {
      id: 'admin-user-001',
      displayName: 'Admin User',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      hashedPassword: ADMIN_PASSWORD,
      isAdmin: true,
      mobile: '088-888-8888',
      lineId: 'admin_line_id',
      facebook: 'admin_facebook_profile',
      gender: GenderOption.NotSpecified,
      birthdate: '1990-01-01',
      educationLevel: HelperEducationLevelOption.Bachelor,
      photo: undefined,
      address: undefined,
      favoriteMusic: 'Classical',
      hobbies: 'Reading, Coding',
    };
    const testUser: User = {
      id: 'test-user-002',
      displayName: 'Test User',
      username: 'test',
      email: 'test@user.com',
      hashedPassword: 'testpass',
      isAdmin: false,
      mobile: '081-234-5678',
      lineId: 'test_user_line',
      facebook: 'test_user_facebook',
      gender: GenderOption.Male,
      birthdate: '1995-05-15',
      educationLevel: HelperEducationLevelOption.HighSchool,
      photo: undefined,
      address: '123 Mymoo Road, Chiang Mai',
      favoriteMovie: 'Inception',
      introSentence: 'I am a friendly and hardworking individual.',
    };

    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers) as User[];
        if (Array.isArray(parsedUsers)) {
           let adminExists = false;
           let regularTestUserExists = false;
           const updatedUsers = parsedUsers.map(u => {
            const baseUser: User = {
                ...u,
                mobile: u.mobile || '',
                lineId: u.lineId || undefined,
                facebook: u.facebook || undefined,
                gender: u.gender || GenderOption.NotSpecified,
                birthdate: u.birthdate || undefined,
                educationLevel: u.educationLevel || HelperEducationLevelOption.NotStated,
                photo: u.photo || undefined,
                address: u.address || undefined,
                favoriteMusic: u.favoriteMusic || undefined,
                favoriteBook: u.favoriteBook || undefined,
                favoriteMovie: u.favoriteMovie || undefined,
                hobbies: u.hobbies || undefined,
                favoriteFood: u.favoriteFood || undefined,
                dislikedThing: u.dislikedThing || undefined,
                introSentence: u.introSentence || undefined,
            };
            if (u.username === ADMIN_USERNAME && u.email === ADMIN_EMAIL) {
              adminExists = true;
              return { ...baseUser, ...adminUser, photo: u.photo || adminUser.photo, address: u.address || adminUser.address, favoriteMusic: u.favoriteMusic || adminUser.favoriteMusic, hobbies: u.hobbies || adminUser.hobbies };
            }
            if (u.username === 'test' && u.email === 'test@user.com') {
              regularTestUserExists = true;
              return { ...baseUser, ...testUser, photo: u.photo || testUser.photo, address: u.address || testUser.address, favoriteMovie: u.favoriteMovie || testUser.favoriteMovie, introSentence: u.introSentence || testUser.introSentence };
            }
            return baseUser;
          });

          if (!adminExists) updatedUsers.unshift(adminUser);
          if (!regularTestUserExists) {
            const insertIndex = adminExists ? 1 : 0;
            updatedUsers.splice(insertIndex, 0, testUser);
          }
          return updatedUsers;
        }
      } catch (e) {
        console.error("Error parsing users from localStorage, re-initializing.", e);
      }
    }
    return [adminUser, testUser];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('chiangMaiQuickCurrentUser');
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser) as User;
            const fullUserFromList = users.find(u => u.id === parsedUser.id);

            if (fullUserFromList && fullUserFromList.hashedPassword === parsedUser.hashedPassword) {
                const isAdminLogin = (fullUserFromList.username.toLowerCase() === ADMIN_USERNAME || fullUserFromList.email.toLowerCase() === ADMIN_EMAIL) && fullUserFromList.hashedPassword === ADMIN_PASSWORD;
                return {
                    ...fullUserFromList,
                    isAdmin: isAdminLogin || fullUserFromList.isAdmin || false
                };
            }
            return null;
        } catch (e) {
            console.error("Error parsing current user from localStorage", e);
            return null;
        }
    }
    return null;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    const savedJobs = localStorage.getItem('chiangMaiQuickJobs');
    if (savedJobs) {
        try {
            return JSON.parse(savedJobs);
        } catch (e) {
            console.error("Error parsing jobs from localStorage", e);
        }
    }
    return [];
  });

  const [helperProfiles, setHelperProfiles] = useState<HelperProfile[]>(() => {
    const savedHelpers = localStorage.getItem('chiangMaiQuickHelpers');
     if (savedHelpers) {
        try {
            return JSON.parse(savedHelpers);
        } catch (e) {
            console.error("Error parsing helper profiles from localStorage", e);
        }
    }
    return [];
  });

  const [itemToEdit, setItemToEdit] = useState<Job | HelperProfile | null>(null);
  const [editingItemType, setEditingItemType] = useState<'job' | 'profile' | null>(null);
  const [sourceViewForForm, setSourceViewForForm] = useState<View | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('chiangMaiQuickUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      const liveUser = users.find(u => u.id === currentUser.id);
      if (liveUser) {
        localStorage.setItem('chiangMaiQuickCurrentUser', JSON.stringify(liveUser));
      } else {
        localStorage.removeItem('chiangMaiQuickCurrentUser');
        setCurrentUser(null); 
      }
    } else {
      localStorage.removeItem('chiangMaiQuickCurrentUser');
    }
  }, [currentUser, users]);


  useEffect(() => {
    localStorage.setItem('chiangMaiQuickJobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('chiangMaiQuickHelpers', JSON.stringify(helperProfiles));
  }, [helperProfiles]);


  const navigateTo = (view: View, payload?: any) => {
    if (view === View.PublicProfile && typeof payload === 'string') {
      setViewingProfileId(payload);
    } else {
      setViewingProfileId(null); 
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };
  
  const handleNavigateToPublicProfile = (userId: string) => {
    navigateTo(View.PublicProfile, userId);
  };

  const handleRegister = (userData: Omit<User, 'id' | 'hashedPassword' | 'isAdmin' | 'photo' | 'address' | 'favoriteMusic' | 'favoriteBook' | 'favoriteMovie' | 'hobbies' | 'favoriteFood' | 'dislikedThing' | 'introSentence'> & { password: string }) => {
    if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      alert('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว โปรดเลือกชื่ออื่น');
      return false;
    }
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      alert('อีเมลนี้ถูกใช้ไปแล้ว โปรดใช้อีเมลอื่น');
      return false;
    }
    if (!isValidThaiMobileNumberUtil(userData.mobile)) {
      alert('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
      return false;
    }
    if (!userData.gender || !userData.birthdate || !userData.educationLevel) {
        alert('กรุณากรอกข้อมูลส่วนตัว (เพศ, วันเกิด, ระดับการศึกษา) ให้ครบถ้วน');
        return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      displayName: userData.displayName,
      username: userData.username,
      email: userData.email,
      hashedPassword: userData.password, 
      isAdmin: (userData.username.toLowerCase() === ADMIN_USERNAME || userData.email.toLowerCase() === ADMIN_EMAIL) && userData.password === ADMIN_PASSWORD,
      mobile: userData.mobile,
      lineId: userData.lineId || undefined,
      facebook: userData.facebook || undefined,
      gender: userData.gender,
      birthdate: userData.birthdate,
      educationLevel: userData.educationLevel,
      photo: undefined, 
      address: undefined, 
      favoriteMusic: undefined,
      favoriteBook: undefined,
      favoriteMovie: undefined,
      hobbies: undefined,
      favoriteFood: undefined,
      dislikedThing: undefined,
      introSentence: undefined,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    alert('ลงทะเบียนสำเร็จแล้ว!');
    navigateTo(View.Home);
    return true;
  };

  const handleLogin = (loginIdentifier: string, passwordAttempt: string) => {
    const userFromList = users.find(
      u => (u.username.toLowerCase() === loginIdentifier.toLowerCase() || u.email.toLowerCase() === loginIdentifier.toLowerCase()) &&
           u.hashedPassword === passwordAttempt
    );
    if (userFromList) {
      const isAdminLogin = (userFromList.username.toLowerCase() === ADMIN_USERNAME || userFromList.email.toLowerCase() === ADMIN_EMAIL) && userFromList.hashedPassword === ADMIN_PASSWORD;
      setCurrentUser({ ...userFromList, isAdmin: isAdminLogin || userFromList.isAdmin || false });
      alert(`ยินดีต้อนรับ @${userFromList.displayName}!`);
      navigateTo(View.Home);
      return true;
    } else {
      alert('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
      return false;
    }
  };

  const handleUpdateUserProfile = (
    updatedProfileData: Pick<User, 'mobile' | 'lineId' | 'facebook' | 'gender' | 'birthdate' | 'educationLevel' | 'photo' | 'address' | 'favoriteMusic' | 'favoriteBook' | 'favoriteMovie' | 'hobbies' | 'favoriteFood' | 'dislikedThing' | 'introSentence'>
  ) => {
    if (!currentUser) {
      alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้ปัจจุบัน');
      return false;
    }
    if (!isValidThaiMobileNumberUtil(updatedProfileData.mobile)) {
      alert('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 08X-XXX-XXXX)');
      return false;
    }
    if (!updatedProfileData.gender || updatedProfileData.gender === GenderOption.NotSpecified) {
      alert('กรุณาเลือกเพศ');
      return false;
    }
    if (!updatedProfileData.birthdate) { 
      alert('กรุณาเลือกวันเกิด');
      return false;
    }
    if (!updatedProfileData.educationLevel || updatedProfileData.educationLevel === HelperEducationLevelOption.NotStated) {
      alert('กรุณาเลือกระดับการศึกษา');
      return false;
    }

    const updatedUser: User = {
      ...currentUser,
      mobile: updatedProfileData.mobile,
      lineId: updatedProfileData.lineId || undefined,
      facebook: updatedProfileData.facebook || undefined,
      gender: updatedProfileData.gender,
      birthdate: updatedProfileData.birthdate,
      educationLevel: updatedProfileData.educationLevel,
      photo: updatedProfileData.photo,
      address: updatedProfileData.address || undefined,
      favoriteMusic: updatedProfileData.favoriteMusic || undefined,
      favoriteBook: updatedProfileData.favoriteBook || undefined,
      favoriteMovie: updatedProfileData.favoriteMovie || undefined,
      hobbies: updatedProfileData.hobbies || undefined,
      favoriteFood: updatedProfileData.favoriteFood || undefined,
      dislikedThing: updatedProfileData.dislikedThing || undefined,
      introSentence: updatedProfileData.introSentence || undefined,
    };

    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    return true; 
  };


  const handleLogout = () => {
    setCurrentUser(null);
    setItemToEdit(null);
    setEditingItemType(null);
    setSourceViewForForm(null);
    setViewingProfileId(null);
    alert('ออกจากระบบเรียบร้อยแล้ว');
    navigateTo(View.Home);
  };

  const handleStartEditItemFromAdmin = (item: AdminItemType) => {
    const originalItem = item.itemType === 'job'
      ? jobs.find(j => j.id === item.id)
      : helperProfiles.find(p => p.id === item.id);

    if (originalItem) {
      setItemToEdit(originalItem);
      setEditingItemType(item.itemType);
      setSourceViewForForm(View.AdminDashboard);
      navigateTo(item.itemType === 'job' ? View.PostJob : View.OfferHelp);
    } else {
      console.error("Item not found for editing from Admin:", item);
      alert("เกิดข้อผิดพลาด: ไม่พบรายการที่ต้องการแก้ไข");
    }
  };

  const handleStartEditMyItem = (itemId: string, itemType: 'job' | 'profile') => {
    const originalItem = itemType === 'job'
        ? jobs.find(j => j.id === itemId)
        : helperProfiles.find(p => p.id === itemId);

    if (originalItem && originalItem.userId === currentUser?.id) {
        setItemToEdit(originalItem);
        setEditingItemType(itemType);
        setSourceViewForForm(View.MyPosts);
        navigateTo(itemType === 'job' ? View.PostJob : View.OfferHelp);
    } else {
        console.error("Item not found or not owned by user for editing:", itemId, itemType);
        alert("เกิดข้อผิดพลาด: ไม่พบรายการที่ต้องการแก้ไข หรือคุณไม่ใช่เจ้าของโพสต์นี้");
    }
  };

  type JobFormData = Omit<Job, 'id' | 'postedAt' | 'userId' | 'username' | 'isSuspicious' | 'isPinned' | 'isHired' | 'contact'>;
  type HelperProfileFormData = Omit<HelperProfile, 'id' | 'postedAt' | 'userId' | 'username' | 'isSuspicious' | 'isPinned' | 'isUnavailable' | 'contact' | 'gender' | 'birthdate' | 'educationLevel'>;


  const handleUpdateJob = (updatedJobDataFromForm: JobFormData & { id: string }) => {
    const originalJob = jobs.find(j => j.id === updatedJobDataFromForm.id);
    if (!originalJob) {
      alert('เกิดข้อผิดพลาด: ไม่พบประกาศงานเดิม');
      return;
    }
    if (originalJob.userId !== currentUser?.id && !currentUser?.isAdmin) {
        alert('คุณไม่มีสิทธิ์แก้ไขประกาศงานนี้');
        return;
    }
    const contactInfo = currentUser ? generateContactString(currentUser) : 'ข้อมูลติดต่อไม่พร้อมใช้งาน';
    const updatedJob: Job = {
      ...originalJob,
      ...updatedJobDataFromForm,
      contact: contactInfo,
    };
    setJobs(prevJobs => prevJobs.map(j => (j.id === updatedJob.id ? updatedJob : j)));
    setItemToEdit(null);
    setEditingItemType(null);
    navigateTo(sourceViewForForm || View.Home);
    setSourceViewForForm(null);
    alert('แก้ไขประกาศงานเรียบร้อยแล้ว');
  };

  const handleUpdateHelperProfile = (updatedProfileDataFromForm: HelperProfileFormData & { id: string }) => {
    const originalProfile = helperProfiles.find(p => p.id === updatedProfileDataFromForm.id);
    if (!originalProfile) {
      alert('เกิดข้อผิดพลาด: ไม่พบโปรไฟล์เดิม');
      return;
    }
    if (originalProfile.userId !== currentUser?.id && !currentUser?.isAdmin) {
        alert('คุณไม่มีสิทธิ์แก้ไขโปรไฟล์นี้');
        return;
    }
    const contactInfo = currentUser ? generateContactString(currentUser) : 'ข้อมูลติดต่อไม่พร้อมใช้งาน';
    const updatedProfile: HelperProfile = {
      ...originalProfile, 
      ...updatedProfileDataFromForm,
      contact: contactInfo,
    };
    setHelperProfiles(prevProfiles => prevProfiles.map(p => (p.id === updatedProfile.id ? updatedProfile : p)));
    setItemToEdit(null);
    setEditingItemType(null);
    navigateTo(sourceViewForForm || View.Home);
    setSourceViewForForm(null);
    alert('แก้ไขโปรไฟล์ผู้ช่วยเรียบร้อยแล้ว');
  };

  const handleSubmitJobForm = (formDataFromForm: JobFormData & { id?: string }) => {
    if (formDataFromForm.id && itemToEdit && editingItemType === 'job') {
      handleUpdateJob(formDataFromForm as JobFormData & { id: string });
    } else {
      handleAddJob(formDataFromForm);
    }
  };

  const handleSubmitHelperProfileForm = (formDataFromForm: HelperProfileFormData & { id?: string }) => {
    if (formDataFromForm.id && itemToEdit && editingItemType === 'profile') {
      handleUpdateHelperProfile(formDataFromForm as HelperProfileFormData & { id: string });
    } else {
      handleAddHelperProfile(formDataFromForm);
    }
  };

  const handleCancelEditOrPost = () => {
    const targetView = sourceViewForForm || View.Home;
    setItemToEdit(null);
    setEditingItemType(null);
    setSourceViewForForm(null);
    navigateTo(targetView);
  };

  const generateContactString = (user: User): string => {
    let contactParts: string[] = [];
    if (user.mobile) contactParts.push(`เบอร์โทร: ${user.mobile}`);
    if (user.lineId) contactParts.push(`LINE ID: ${user.lineId}`);
    if (user.facebook) contactParts.push(`Facebook: ${user.facebook}`);
    return contactParts.join('\n') || 'ไม่ระบุช่องทางติดต่อ';
  };

  const handleAddJob = useCallback((newJobData: JobFormData) => {
    if (!currentUser) {
      alert('คุณต้องเข้าสู่ระบบก่อนจึงจะลงประกาศงานได้');
      navigateTo(View.Login);
      return;
    }
    const contactInfo = generateContactString(currentUser);
    const newJobWithUser: Job = {
      ...(newJobData as Omit<Job, 'id' | 'postedAt' | 'userId' | 'username' | 'isSuspicious' | 'isPinned' | 'isHired' | 'contact'>),
      id: Date.now().toString(),
      postedAt: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      contact: contactInfo,
      isSuspicious: false,
      isPinned: false,
      isHired: false,
    };
    setJobs(prevJobs => [newJobWithUser, ...prevJobs]);
    navigateTo(sourceViewForForm === View.MyPosts ? View.MyPosts : View.FindJobs);
    setSourceViewForForm(null);
    alert('ประกาศงานของคุณถูกเพิ่มเรียบร้อยแล้ว!');
  }, [currentUser, sourceViewForForm, navigateTo]); 

  const handleAddHelperProfile = useCallback((newProfileData: HelperProfileFormData) => {
    if (!currentUser) {
      alert('คุณต้องเข้าสู่ระบบก่อนจึงจะฝากโปรไฟล์ได้');
      navigateTo(View.Login);
      return;
    }
    if (!currentUser.gender || !currentUser.birthdate || !currentUser.educationLevel ||
        currentUser.gender === GenderOption.NotSpecified || currentUser.educationLevel === HelperEducationLevelOption.NotStated) {
        alert('กรุณาอัปเดตข้อมูลส่วนตัว (เพศ, วันเกิด, ระดับการศึกษา) ในหน้าโปรไฟล์ของคุณก่อนสร้างโปรไฟล์ผู้ช่วย');
        navigateTo(View.UserProfile);
        return;
    }

    const contactInfo = generateContactString(currentUser);
    const newProfileWithUser: HelperProfile = {
      ...(newProfileData as Omit<HelperProfile, 'id' | 'postedAt' | 'userId' | 'username' | 'isSuspicious' | 'isPinned' | 'isUnavailable' | 'contact' | 'gender' | 'birthdate' | 'educationLevel'>),
      id: Date.now().toString(),
      postedAt: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      contact: contactInfo,
      gender: currentUser.gender,
      birthdate: currentUser.birthdate,
      educationLevel: currentUser.educationLevel,
      isSuspicious: false,
      isPinned: false,
      isUnavailable: false,
    };
    setHelperProfiles(prevProfiles => [newProfileWithUser, ...prevProfiles]);
    navigateTo(sourceViewForForm === View.MyPosts ? View.MyPosts : View.FindHelpers);
    setSourceViewForForm(null);
    alert('โปรไฟล์ของคุณถูกเพิ่มเรียบร้อยแล้ว!');
  }, [currentUser, sourceViewForForm, navigateTo]); 


  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setOnConfirmAction(() => onConfirm);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmModalMessage('');
    setConfirmModalTitle('');
    setOnConfirmAction(null);
  };

  const handleConfirmDeletion = () => {
    if (onConfirmAction) {
      onConfirmAction();
    }
    closeConfirmModal();
  };

  const handleDeleteItemFromMyPosts = (itemId: string, itemType: 'job' | 'profile') => {
    if (itemType === 'job') {
        handleDeleteJob(itemId);
    } else {
        handleDeleteHelperProfile(itemId);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    const jobToDelete = jobs.find(job => job.id === jobId);
    if (!jobToDelete) {
      alert('เกิดข้อผิดพลาด: ไม่พบประกาศงานที่ต้องการลบในระบบ');
      return;
    }
    if (jobToDelete.userId !== currentUser?.id && !currentUser?.isAdmin) {
      alert('คุณไม่มีสิทธิ์ลบประกาศงานนี้');
      return;
    }

    openConfirmModal(
      'ยืนยันการลบประกาศงาน',
      `คุณแน่ใจหรือไม่ว่าต้องการลบประกาศงาน "${jobToDelete.title}" (ID: ${jobId})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      () => {
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        alert(`ลบประกาศงาน "${jobToDelete.title}" เรียบร้อยแล้ว`);
      }
    );
  };

  const handleDeleteHelperProfile = (profileId: string) => {
    const profileToDelete = helperProfiles.find(profile => profile.id === profileId);
     if (!profileToDelete) {
      alert('เกิดข้อผิดพลาด: ไม่พบโปรไฟล์ที่ต้องการลบในระบบ');
      return;
    }
    if (profileToDelete.userId !== currentUser?.id && !currentUser?.isAdmin) {
      alert('คุณไม่มีสิทธิ์ลบโปรไฟล์นี้');
      return;
    }

    openConfirmModal(
      'ยืนยันการลบโปรไฟล์',
      `คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ "${profileToDelete.profileTitle}" (ID: ${profileId})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      () => {
        setHelperProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== profileId));
        alert(`ลบโปรไฟล์ "${profileToDelete.profileTitle}" เรียบร้อยแล้ว`);
      }
    );
  };

  const handleToggleSuspiciousJob = (jobId: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, isSuspicious: !job.isSuspicious } : job
      )
    );
  };

  const handleToggleSuspiciousHelperProfile = (profileId: string) => {
    setHelperProfiles(prevProfiles =>
      prevProfiles.map(profile =>
        profile.id === profileId ? { ...profile, isSuspicious: !profile.isSuspicious } : profile
      )
    );
  };

  const handleTogglePinnedJob = (jobId: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, isPinned: !job.isPinned } : job
      )
    );
  };

  const handleTogglePinnedHelperProfile = (profileId: string) => {
    setHelperProfiles(prevProfiles =>
      prevProfiles.map(profile =>
        profile.id === profileId ? { ...profile, isPinned: !profile.isPinned } : profile
      )
    );
  };

  const handleToggleHiredJobForUserOrAdmin = (jobId: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.id === jobId) {
          if (job.userId === currentUser?.id || currentUser?.isAdmin) {
            return { ...job, isHired: !job.isHired };
          }
        }
        return job;
      })
    );
  };

  const handleToggleUnavailableHelperProfileForUserOrAdmin = (profileId: string) => {
    setHelperProfiles(prevProfiles =>
      prevProfiles.map(profile => {
        if (profile.id === profileId) {
          if (profile.userId === currentUser?.id || currentUser?.isAdmin) {
            return { ...profile, isUnavailable: !profile.isUnavailable };
          }
        }
        return profile;
      })
    );
  };

  const handleToggleItemStatusFromMyPosts = (itemId: string, itemType: 'job' | 'profile') => {
    if (itemType === 'job') {
        handleToggleHiredJobForUserOrAdmin(itemId);
    } else {
        handleToggleUnavailableHelperProfileForUserOrAdmin(itemId);
    }
  };

  const handleFeedbackSubmit = async (feedbackText: string): Promise<boolean> => {
    if (!feedbackText.trim()) {
        setFeedbackSubmissionStatus('error');
        setFeedbackSubmissionMessage('กรุณาใส่ความคิดเห็นของคุณ');
        return false; 
    }

    setFeedbackSubmissionStatus('submitting');
    setFeedbackSubmissionMessage(null);

    try {
        const response = await fetch('https://formspree.io/f/xvgaepzq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                feedback: feedbackText,
                page: currentView,
                timestamp: new Date().toISOString(),
                userId: currentUser?.id || 'anonymous',
                username: currentUser?.username || 'anonymous',
                userAgent: navigator.userAgent,
            })
        });

        if (response.ok) {
            setFeedbackSubmissionStatus('success');
            setFeedbackSubmissionMessage('ขอบคุณสำหรับความคิดเห็นของคุณ!');
            setIsFeedbackModalOpen(false); 

            setTimeout(() => { 
                setFeedbackSubmissionStatus('idle');
                setFeedbackSubmissionMessage(null);
            }, 4000);
            return true;
        } else {
            const errorData = await response.json();
            console.error('Formspree error:', errorData);
            const errorMessage = errorData.errors?.map((e: { message: string }) => e.message).join(', ') || 'เกิดข้อผิดพลาดในการส่งความคิดเห็น โปรดลองอีกครั้ง';
            setFeedbackSubmissionStatus('error');
            setFeedbackSubmissionMessage(errorMessage);
            return false;
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        setFeedbackSubmissionStatus('error');
        setFeedbackSubmissionMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้ง');
        return false;
    }
  };


  const renderHeader = () => (
    <header
      className="sticky top-0 z-50 w-full bg-headerBlue-DEFAULT dark:bg-dark-headerBg text-neutral-dark dark:text-dark-text p-3 sm:p-6 shadow-md"
    >
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <h1
          className="text-xl sm:text-3xl font-quicksand font-bold tracking-tight cursor-pointer hover:text-opacity-80 dark:hover:text-opacity-80 transition-opacity"
          onClick={() => navigateTo(View.Home)}
          aria-label="ไปหน้าแรก"
        >
          {/* ✨ หาจ๊อบจ้า ✨ (Removed) */}
        </h1>
        <nav className="mt-2 sm:mt-0 flex items-center justify-center sm:justify-end gap-1 sm:gap-2 overflow-x-auto whitespace-nowrap sm:flex-wrap sm:whitespace-normal sm:overflow-x-visible pb-1 sm:pb-0 w-full sm:w-auto">
          {currentUser ? (
            <>
              <span className="text-xs sm:text-sm font-medium mr-1 flex-shrink-0">สวัสดี, @{currentUser.displayName}!</span>
              {currentUser.isAdmin && (
                <Button onClick={() => navigateTo(View.AdminDashboard)} variant="accent" size="sm" className="flex-shrink-0">
                  🔐 Admin
                </Button>
              )}
              {currentView !== View.UserProfile && (
                <Button onClick={() => navigateTo(View.UserProfile)} variant="outline" colorScheme="secondary" size="sm" className="flex-shrink-0">
                  👤 โปรไฟล์ของฉัน
                </Button>
              )}
              {!currentUser.isAdmin && currentView !== View.MyPosts && (
                 <Button onClick={() => navigateTo(View.MyPosts)} variant="outline" colorScheme="primary" size="sm" className="flex-shrink-0">
                    📁 โพสต์ของฉัน
                  </Button>
              )}
              <Button onClick={handleLogout} variant="outline" colorScheme="accent" size="sm" className="flex-shrink-0">ออกจากระบบ</Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigateTo(View.Login)} variant="primary" size="sm" className="flex-shrink-0">เข้าสู่ระบบ</Button>
              <Button onClick={() => navigateTo(View.Register)} variant="outline" colorScheme="primary" size="sm" className="flex-shrink-0">ลงทะเบียน</Button>
            </>
          )}
           {currentView !== View.Home && (
            <Button onClick={() => navigateTo(View.Home)} variant="secondary" size="sm" className="ml-auto sm:ml-2 flex-shrink-0">
              🏠 หน้าแรก
            </Button>
          )}
          {currentUser && currentView !== View.FindJobs && currentView !== View.PostJob && (
            <Button onClick={() => navigateTo(View.FindJobs)} variant="secondary" size="sm" className="flex-shrink-0">
              👀 หางาน
            </Button>
          )}
           {currentUser && currentView === View.FindJobs && (
             <Button onClick={() => { setSourceViewForForm(View.FindJobs); navigateTo(View.PostJob);}} variant="accent" size="sm" className="flex-shrink-0">
              + ลงประกาศงาน
            </Button>
          )}
           {currentUser && currentView === View.PostJob && !itemToEdit && (
             <Button onClick={() => navigateTo(View.FindJobs)} variant="secondary" size="sm" className="flex-shrink-0">
              👀 หางาน
            </Button>
          )}
          {currentUser && currentView !== View.FindHelpers && currentView !== View.OfferHelp && (
            <Button onClick={() => navigateTo(View.FindHelpers)} variant="secondary" size="sm" className="flex-shrink-0">
              🫂 ค้นหาผู้ช่วย
            </Button>
          )}
          {currentUser && currentView === View.FindHelpers && (
             <Button onClick={() => { setSourceViewForForm(View.FindHelpers); navigateTo(View.OfferHelp);}} variant="accent" size="sm" className="flex-shrink-0">
              + เสนอตัวช่วยงาน
            </Button>
          )}
           {currentUser && currentView === View.OfferHelp && !itemToEdit && (
             <Button onClick={() => navigateTo(View.FindHelpers)} variant="secondary" size="sm" className="flex-shrink-0">
              🫂 ค้นหาผู้ช่วย
            </Button>
          )}
        </nav>
      </div>
    </header>
  );

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-6 sm:p-8 text-center">
      <h2 className="text-4xl sm:text-5xl font-quicksand font-bold text-neutral-dark dark:text-dark-text mb-3">
        ✨ หาจ๊อบจ้า ✨
      </h2>
      <p className="text-lg text-neutral-dark dark:text-dark-textMuted mb-4 font-normal">
        จุดรวมงานจิปาถะ งานพาร์ทไทม์ งานโชว์ทักษะด้านอื่นในชีวิต
      </p>
      <p className="text-md sm:text-lg text-neutral-dark dark:text-dark-textMuted max-w-xl leading-relaxed mb-10 font-normal">
        คนเราทุกคนอาจมีทักษะนอกเหนือจากงานหลักและเวลาเหลือ ลองงัดมาใช้หาเงินดู!
      </p>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-dark-cardBg p-6 rounded-xl shadow-lg border border-primary/30 dark:border-dark-primary-DEFAULT/30">
          <h3 className="text-2xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-4">หาคนทำงาน</h3>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setSourceViewForForm(View.Home);
                if (currentUser) navigateTo(View.PostJob);
                else navigateTo(View.Login);
              }}
              variant="primary"
              size="lg"
              className="w-full text-lg"
            >
              📢 มีงานด่วน? ฝากไว้ตรงนี้
            </Button>
            <Button
              onClick={() => navigateTo(View.FindHelpers)}
              variant="outline"
              colorScheme="primary"
              size="lg"
              className="w-full text-lg"
            >
              🔍 กำลังหาคนช่วย? ดูโปรไฟล์เลย
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-cardBg p-6 rounded-xl shadow-lg border border-secondary/30 dark:border-dark-secondary-DEFAULT/30">
          <h3 className="text-2xl font-semibold text-secondary-hover dark:text-dark-secondary-hover mb-4">คนอยากหางาน</h3>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setSourceViewForForm(View.Home);
                if (currentUser) navigateTo(View.OfferHelp);
                else navigateTo(View.Login);
              }}
              variant="secondary"
              size="lg"
              className="w-full text-lg"
            >
              🙋‍♀️ ว่างอยู่! พร้อมรับงาน
            </Button>
            <Button
              onClick={() => navigateTo(View.FindJobs)}
              variant="outline"
              colorScheme="secondary"
              size="lg"
              className="w-full text-lg"
            >
              👀 อยากหางาน? ดูโพสต์งานเลย
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPostJob = () => {
    if (!currentUser) {
      setTimeout(() => navigateTo(View.Login), 0);
      return <p className="text-center p-8">กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...</p>;
    }
    return (
      <PostJobForm
        onSubmitJob={handleSubmitJobForm}
        onCancel={handleCancelEditOrPost}
        initialData={editingItemType === 'job' ? itemToEdit as Job : undefined}
        isEditing={!!itemToEdit && editingItemType === 'job'}
      />
    );
  };

  const renderOfferHelpForm = () => {
    if (!currentUser) {
      setTimeout(() => navigateTo(View.Login), 0);
      return <p className="text-center p-8">กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...</p>;
    }
     if (!currentUser.gender || !currentUser.birthdate || !currentUser.educationLevel || currentUser.gender === GenderOption.NotSpecified || currentUser.educationLevel === HelperEducationLevelOption.NotStated) {
        if (!itemToEdit) { 
            setTimeout(() => {
                alert('กรุณาอัปเดตข้อมูลส่วนตัว (เพศ, วันเกิด, ระดับการศึกษา) ในหน้า "โปรไฟล์ของฉัน" ก่อน จึงจะสามารถสร้างโปรไฟล์ผู้ช่วยงานได้');
                navigateTo(View.UserProfile);
            }, 0);
            return <p className="text-center p-8">ข้อมูลส่วนตัวยังไม่ครบถ้วน กำลังเปลี่ยนเส้นทางไปหน้าโปรไฟล์...</p>;
        }
    }
    return (
      <OfferHelpForm
        onSubmitProfile={handleSubmitHelperProfileForm}
        onCancel={handleCancelEditOrPost}
        initialData={editingItemType === 'profile' ? itemToEdit as HelperProfile : undefined}
        isEditing={!!itemToEdit && editingItemType === 'profile'}
      />
    );
  };

  const renderFindJobs = () => (
    <div className="container mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-semibold text-primary dark:text-dark-primary-DEFAULT mb-8 text-center">👀 รายการงานด่วนทั้งหมด</h2>
      {jobs.length === 0 ? (
        <div className="text-center py-10">
          <svg className="mx-auto h-24 w-24 text-neutral-DEFAULT dark:text-dark-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-3 text-xl text-neutral-dark dark:text-dark-textMuted font-normal">ยังไม่มีงานประกาศในขณะนี้ ลองแวะมาใหม่นะ</p>
          {currentUser && (
            <Button onClick={() => { setSourceViewForForm(View.FindJobs); navigateTo(View.PostJob);}} variant="primary" size="md" className="mt-6">
              เป็นคนแรกที่ลงประกาศงาน!
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime()).map(job => (
            <JobCard key={job.id} job={job} navigateTo={navigateTo} />
          ))}
        </div>
      )}
    </div>
  );

  const renderFindHelpers = () => {
    const enrichedHelperProfiles: EnrichedHelperProfile[] = helperProfiles.map(hp => {
      const user = users.find(u => u.id === hp.userId);
      return {
        ...hp,
        userPhoto: user?.photo,
        userAddress: user?.address, 
        userDisplayName: user?.displayName || user?.username || 'User',
      };
    }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime());

    return (
    <div className="container mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-semibold text-secondary-hover dark:text-dark-secondary-hover mb-3 text-center">🧑‍🔧 คนขยันพร้อมช่วย อยู่ตรงนี้แล้ว</h2>
      <p className="text-md text-neutral-dark dark:text-dark-textMuted mb-8 text-center max-w-xl mx-auto font-normal">
        ลองดูโปรไฟล์ของผู้ที่พร้อมช่วยงานช่วงสั้น ๆ ในเชียงใหม่<br/>
        เลือกคนที่ตรงกับความต้องการ แล้วติดต่อได้เลย
      </p>
      {enrichedHelperProfiles.length === 0 ? (
         <div className="text-center py-10">
           <svg className="mx-auto h-24 w-24 text-neutral-DEFAULT dark:text-dark-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-2.144M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-3 text-xl text-neutral-dark dark:text-dark-textMuted font-normal">ยังไม่มีผู้เสนอตัวช่วยงานในขณะนี้</p>
          {currentUser && (
            <Button onClick={() => { setSourceViewForForm(View.FindHelpers); navigateTo(View.OfferHelp);}} variant="secondary" size="md" className="mt-6">
              เป็นคนแรกที่เสนอตัวช่วยงาน!
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrichedHelperProfiles.map(profile => (
            <HelperCard key={profile.id} profile={profile} onNavigateToPublicProfile={handleNavigateToPublicProfile} navigateTo={navigateTo} />
          ))}
        </div>
      )}
    </div>
    );
  };

  const renderRegister = () => (
    <RegistrationForm onRegister={handleRegister} onSwitchToLogin={() => navigateTo(View.Login)} />
  );

  const renderLogin = () => (
    <LoginForm onLogin={handleLogin} onSwitchToRegister={() => navigateTo(View.Register)} />
  );

  const renderUserProfile = () => {
    if (!currentUser) {
      setTimeout(() => navigateTo(View.Login), 0);
      return <p className="text-center p-8">กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...</p>;
    }
    return (
      <UserProfilePage
        currentUser={currentUser}
        onUpdateProfile={handleUpdateUserProfile}
        onCancel={() => navigateTo(View.Home)}
      />
    );
  };

  const renderAdminDashboard = () => {
    if (!currentUser || !currentUser.isAdmin) {
      setTimeout(() => navigateTo(View.Home), 0);
      return <p className="text-center p-8">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังเปลี่ยนเส้นทาง...</p>;
    }
    return (
      <AdminDashboard
        jobs={jobs}
        helperProfiles={helperProfiles}
        onDeleteJob={handleDeleteJob}
        onDeleteHelperProfile={handleDeleteHelperProfile}
        onToggleSuspiciousJob={handleToggleSuspiciousJob}
        onToggleSuspiciousHelperProfile={handleToggleSuspiciousHelperProfile}
        onTogglePinnedJob={handleTogglePinnedJob}
        onTogglePinnedHelperProfile={handleTogglePinnedHelperProfile}
        onToggleHiredJob={handleToggleHiredJobForUserOrAdmin}
        onToggleUnavailableHelperProfile={handleToggleUnavailableHelperProfileForUserOrAdmin}
        currentUser={currentUser}
        onStartEditItem={handleStartEditItemFromAdmin}
      />
    );
  };

  const renderMyPostsPage = () => {
    if (!currentUser || currentUser.isAdmin) {
        setTimeout(() => navigateTo(View.Home), 0);
        return <p className="text-center p-8">กำลังเปลี่ยนเส้นทาง...</p>;
    }
    return (
        <MyPostsPage
            currentUser={currentUser}
            jobs={jobs}
            helperProfiles={helperProfiles}
            onEditItem={handleStartEditMyItem}
            onDeleteItem={handleDeleteItemFromMyPosts}
            onToggleHiredStatus={handleToggleItemStatusFromMyPosts}
            navigateTo={navigateTo}
        />
    );
  };

  const renderAboutUsPage = () => <AboutUsPage />;
  const renderSafetyPage = () => <SafetyPage />; 

  const renderPublicProfile = () => {
    if (!viewingProfileId) {
      navigateTo(View.Home); 
      return <p className="text-center p-8">Loading profile...</p>;
    }
    const profileUser = users.find(u => u.id === viewingProfileId);
    if (!profileUser) {
      return <p className="text-center p-8 text-red-500">ไม่พบโปรไฟล์ผู้ใช้</p>;
    }
    const helperProfileForBio = helperProfiles.find(hp => hp.userId === viewingProfileId);
    return <PublicProfilePage user={profileUser} helperProfileDetails={helperProfileForBio?.details} onBack={() => navigateTo(View.FindHelpers)} />;
  };


  let currentViewContent;
  switch (currentView) {
    case View.Home:
      currentViewContent = renderHome();
      break;
    case View.PostJob:
      currentViewContent = renderPostJob();
      break;
    case View.FindJobs:
      currentViewContent = renderFindJobs();
      break;
    case View.OfferHelp:
      currentViewContent = renderOfferHelpForm();
      break;
    case View.FindHelpers:
      currentViewContent = renderFindHelpers();
      break;
    case View.Register:
      currentViewContent = renderRegister();
      break;
    case View.Login:
      currentViewContent = renderLogin();
      break;
    case View.AdminDashboard:
      currentViewContent = renderAdminDashboard();
      break;
    case View.MyPosts:
      currentViewContent = renderMyPostsPage();
      break;
    case View.UserProfile:
      currentViewContent = renderUserProfile();
      break;
    case View.AboutUs:
      currentViewContent = renderAboutUsPage();
      break;
    case View.PublicProfile:
      currentViewContent = renderPublicProfile();
      break;
    case View.Safety: 
      currentViewContent = renderSafetyPage();
      break;
    default:
      currentViewContent = renderHome();
  }

  return (
    <div className="flex flex-col flex-1 bg-neutral-light dark:bg-dark-pageBg">
      {renderHeader()}
      <main className="flex-1 overflow-y-auto pt-20 sm:pt-24"> 
        {currentViewContent}
      </main>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmDeletion}
        title={confirmModalTitle}
        message={confirmModalMessage}
      />
      <FeedbackForm
          isOpen={isFeedbackModalOpen}
          onClose={() => {
              setIsFeedbackModalOpen(false);
              // Reset status only if it wasn't a success that closed it
              if (feedbackSubmissionStatus !== 'success') {
                setFeedbackSubmissionStatus('idle');
                setFeedbackSubmissionMessage(null);
              }
          }}
          onSubmit={handleFeedbackSubmit}
          submissionStatus={feedbackSubmissionStatus}
          submissionMessage={feedbackSubmissionMessage}
      />
      {/* Global Success Toast for Feedback */}
      {feedbackSubmissionStatus === 'success' && feedbackSubmissionMessage && !isFeedbackModalOpen && (
          <div
              className="fixed bottom-24 sm:bottom-5 right-5 p-3 rounded-md shadow-lg text-sm font-medium z-[60] transition-opacity duration-300 ease-in-out bg-green-100 dark:bg-green-700/80 border border-green-300 dark:border-green-500 text-green-700 dark:text-green-200"
              role="alert"
          >
              {feedbackSubmissionMessage}
          </div>
      )}
      <footer className="bg-headerBlue-DEFAULT dark:bg-dark-headerBg text-neutral-dark dark:text-dark-text p-4 mt-auto font-normal flex flex-col items-center">
        <div className="container mx-auto flex flex-row flex-wrap justify-center items-center gap-x-1 sm:gap-x-2 gap-y-1 text-xs sm:text-sm">
            <button
                onClick={() => navigateTo(View.AboutUs)}
                className="px-1.5 py-0.5 sm:px-2 sm:py-1 hover:text-primary dark:hover:text-dark-primary-hover transition-colors"
            >
                เกี่ยวกับเรา
            </button>
            <span className="text-neutral-medium dark:text-dark-textMuted inline">|</span>
            <button
                onClick={() => navigateTo(View.Safety)}
                className="px-1.5 py-0.5 sm:px-2 sm:py-1 hover:text-primary dark:hover:text-dark-primary-hover transition-colors"
            >
                โปรดอ่านเพื่อความปลอดภัย
            </button>
            <span className="text-neutral-medium dark:text-dark-textMuted inline">|</span>
            <button
                onClick={() => {
                    setIsFeedbackModalOpen(true);
                    // Reset message from previous attempt if user reopens
                    if(feedbackSubmissionStatus === 'error') {
                        setFeedbackSubmissionStatus('idle');
                        setFeedbackSubmissionMessage(null);
                    }
                }}
                className="px-1.5 py-0.5 sm:px-2 sm:py-1 hover:text-primary dark:hover:text-dark-primary-hover transition-colors"
            >
                อยากให้เราปรับปรุงอะไร?
            </button>
        </div>
      </footer>
      {/* Theme Toggle FAB */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-40 p-3 rounded-full text-lg shadow-xl hover:scale-105 transform transition-all duration-150 ease-in-out bg-primary text-neutral-dark hover:bg-primary-hover dark:bg-dark-primary-DEFAULT dark:text-dark-textOnPrimaryDark dark:hover:bg-dark-primary-hover"
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
};

export default App;
