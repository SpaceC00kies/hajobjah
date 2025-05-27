
import React, { useState, useCallback, useEffect, useRef } from 'react';
// import firebase from 'firebase/compat/app'; // Removed unused V8 compat import
import { auth, db, storage } from "../firebase"; // Existing Firebase setup
import type { User as FirebaseUser } from 'firebase/auth'; // Firebase Auth User type
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

import type { Job, HelperProfile, User, EnrichedHelperProfile, Interaction } from './types';
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
import { FeedbackForm } from './components/FeedbackForm';

type Theme = 'light' | 'dark';
const ADMIN_EMAIL_CONFIG = "admin@hajobjah.com"; // For identifying admin role

export const isValidThaiMobileNumberUtil = (mobile: string): boolean => {
  if (!mobile) return false;
  const cleaned = mobile.replace(/[\s-]/g, '');
  return /^0[689]\d{8}$/.test(cleaned);
};

export const checkProfileCompleteness = (user?: User | null): boolean => {
  if (!user) return false;
  const hasRequiredContact = !!user.mobile;
  const hasPhoto = !!user.photoURL;
  const hasAddress = !!user.address && user.address.trim() !== '';
  const hasPersonalityInfo = !!(
    user.favoriteMusic?.trim() ||
    user.favoriteBook?.trim() ||
    user.favoriteMovie?.trim() ||
    user.hobbies?.trim() ||
    user.favoriteFood?.trim() ||
    user.dislikedThing?.trim() ||
    user.introSentence?.trim()
  );
  return hasRequiredContact && hasPhoto && hasAddress && hasPersonalityInfo;
};

export const checkHasBeenContacted = (userId: string, allInteractions: Interaction[]): boolean => {
  if (!userId || !allInteractions) return false;
  // Check if there's any interaction where this userId was the helper and the type was 'contact_helper'.
  return allInteractions.some(interaction => interaction.helperUserId === userId && interaction.type === 'contact_helper');
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const [theme, setTheme] = useState<Theme>('light');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackSubmissionStatus, setFeedbackSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackSubmissionMessage, setFeedbackSubmissionMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [helperProfiles, setHelperProfiles] = useState<HelperProfile[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

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
    setIsLoading(true);
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          const fullUser: User = {
            ...userData,
            id: firebaseUser.uid,
            email: firebaseUser.email || userData.email, // Prefer auth email
            displayName: firebaseUser.displayName || userData.displayName, // Prefer auth displayName
            photoURL: firebaseUser.photoURL || userData.photoURL, // Prefer auth photoURL
            isAdmin: userData.email === ADMIN_EMAIL_CONFIG || userData.isAdmin || false,
            // Recalculate badges based on potentially other data sources (like interactions)
            // profileComplete and hasBeenContacted will be updated by their respective effects
          };
          setCurrentUser(fullUser);
        } else {
          // This case implies an auth user exists but no Firestore record,
          // which might happen if Firestore doc creation failed during registration.
          // For now, treat as logged out, or prompt to complete profile.
           console.warn("User authenticated but no Firestore record found. Logging out.");
           await signOut(auth);
           setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    const usersUnsubscribe = onSnapshot(query(collection(db, "users")), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });
    
    const jobsUnsubscribe = onSnapshot(query(collection(db, "jobs"), orderBy("postedAt", "desc")), (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
    });

    const helpersUnsubscribe = onSnapshot(query(collection(db, "helperProfiles"), orderBy("postedAt", "desc")), (snapshot) => {
      const helpersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelperProfile));
      setHelperProfiles(helpersData);
    });

    const interactionsUnsubscribe = onSnapshot(query(collection(db, "interactions"), orderBy("timestamp", "desc")), (snapshot) => {
      const interactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction));
      setInteractions(interactionsData);
    });

    return () => {
      authUnsubscribe();
      usersUnsubscribe();
      jobsUnsubscribe();
      helpersUnsubscribe();
      interactionsUnsubscribe();
    };
  }, []);

  // Effect to update currentUser's badge status when interactions or their own data changes
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const liveCurrentUserData = users.find(u => u.id === currentUser.id);
      if (liveCurrentUserData) {
        setCurrentUser(prevUser => ({
          ...prevUser!,
          ...liveCurrentUserData, // get latest from users collection
          profileComplete: checkProfileCompleteness(liveCurrentUserData),
          hasBeenContacted: checkHasBeenContacted(liveCurrentUserData.id, interactions),
        }));
      }
    }
  }, [currentUser?.id, users, interactions]);


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

  const handleRegister = async (
    userData: Omit<User, 'id' | 'isAdmin' | 'photoURL' | 'address' | 'createdAt' | 'profileComplete' | 'hasBeenContacted' | 'favoriteMusic' | 'favoriteBook' | 'favoriteMovie' | 'hobbies' | 'favoriteFood' | 'dislikedThing' | 'introSentence'> & { password: string }
  ): Promise<boolean> => {
    try {
      // Check for existing username (optional, but good for uniqueness beyond email)
      const usernameQuery = query(collection(db, "users"), where("username", "==", userData.username.toLowerCase()));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        alert('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว โปรดเลือกชื่ออื่น');
        return false;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      await updateAuthProfile(firebaseUser, { displayName: userData.displayName });
      
      const newUserDoc: Omit<User, 'id' | 'profileComplete' | 'hasBeenContacted'> = {
        displayName: userData.displayName,
        username: userData.username.toLowerCase(),
        email: firebaseUser.email!,
        isAdmin: firebaseUser.email === ADMIN_EMAIL_CONFIG, // Basic admin check
        mobile: userData.mobile,
        lineId: userData.lineId || '',
        facebook: userData.facebook || '',
        gender: userData.gender,
        birthdate: userData.birthdate,
        educationLevel: userData.educationLevel,
        photoURL: firebaseUser.photoURL || '', // Initially empty or default from auth
        address: '',
        // Personality fields empty initially
        favoriteMusic: '', favoriteBook: '', favoriteMovie: '', hobbies: '', favoriteFood: '', dislikedThing: '', introSentence: '',
        createdAt: serverTimestamp() as Timestamp,
      };

      await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
      // setCurrentUser will be set by onAuthStateChanged listener picking up the new user data from Firestore.
      alert('ลงทะเบียนสำเร็จแล้ว!');
      navigateTo(View.Home);
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert('อีเมลนี้ถูกใช้ไปแล้ว โปรดใช้อีเมลอื่น');
      } else {
        alert(`เกิดข้อผิดพลาดในการลงทะเบียน: ${error.message}`);
      }
      return false;
    }
  };

  const handleLogin = async (loginIdentifier: string, passwordAttempt: string): Promise<boolean> => {
    try {
      // Try login with email first
      await signInWithEmailAndPassword(auth, loginIdentifier, passwordAttempt);
      // onAuthStateChanged will handle setting currentUser
      alert(`ยินดีต้อนรับ!`); // DisplayName will be updated by listener
      navigateTo(View.Home);
      return true;
    } catch (error: any) {
      // If email login fails, try to find user by username then attempt login with their email
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password') {
        const usernameQuery = query(collection(db, "users"), where("username", "==", loginIdentifier.toLowerCase()));
        const usernameSnap = await getDocs(usernameQuery);
        if (!usernameSnap.empty) {
          const foundUser = usernameSnap.docs[0].data() as User;
          try {
            await signInWithEmailAndPassword(auth, foundUser.email, passwordAttempt);
            alert(`ยินดีต้อนรับ!`);
            navigateTo(View.Home);
            return true;
          } catch (usernameLoginError: any) {
            alert('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
            console.error("Login error (after username lookup):", usernameLoginError);
            return false;
          }
        }
      }
      alert('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
      console.error("Login error:", error);
      return false;
    }
  };

  const handleUpdateUserProfile = async (
    updatedProfileData: Pick<User, 'mobile' | 'lineId' | 'facebook' | 'gender' | 'birthdate' | 'educationLevel' | 'photoURL' | 'address' | 'favoriteMusic' | 'favoriteBook' | 'favoriteMovie' | 'hobbies' | 'favoriteFood' | 'dislikedThing' | 'introSentence'> & {newPhotoFile?: File}
  ): Promise<boolean> => {
    if (!currentUser || !auth.currentUser) {
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

    try {
      const userDocRef = doc(db, "users", currentUser.id);
      let finalPhotoURL = currentUser.photoURL || '';

      if (updatedProfileData.newPhotoFile) {
        const photoFile = updatedProfileData.newPhotoFile;
        const storageRef = ref(storage, `profilePictures/${currentUser.id}/${photoFile.name}`);
        
        // Convert File to base64 string for uploadString
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
            reader.onload = async (event) => {
                try {
                    const base64String = event.target?.result as string;
                    await uploadString(storageRef, base64String, 'data_url');
                    finalPhotoURL = await getDownloadURL(storageRef);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(photoFile);
        });

        await updateAuthProfile(auth.currentUser, { photoURL: finalPhotoURL });
      }
      
      const { newPhotoFile, ...firestoreData } = updatedProfileData;

      await updateDoc(userDocRef, {
        ...firestoreData,
        photoURL: finalPhotoURL, // Ensure photoURL from User type is used
        displayName: currentUser.displayName, // Assuming display name doesn't change here, or get from auth
      });
      // The onSnapshot listener for 'users' will update the local `users` state,
      // and the effect for `currentUser` will pick up these changes.
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์: " + (error as Error).message);
      return false;
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      // setCurrentUser will be set to null by onAuthStateChanged
      setItemToEdit(null);
      setEditingItemType(null);
      setSourceViewForForm(null);
      setViewingProfileId(null);
      alert('ออกจากระบบเรียบร้อยแล้ว');
      navigateTo(View.Home);
    } catch (error) {
      console.error("Logout error:", error);
      alert('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
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
        alert("เกิดข้อผิดพลาด: ไม่พบรายการที่ต้องการแก้ไข หรือคุณไม่ใช่เจ้าของโพสต์นี้");
    }
  };

  type JobFormData = Omit<Job, 'id' | 'postedAt' | 'userId' | 'username' | 'contact' | 'isSuspicious' | 'isPinned' | 'isHired'>;
  type HelperProfileFormData = Omit<HelperProfile, 'id' | 'postedAt' | 'userId' | 'username' | 'contact' | 'gender' | 'birthdate' | 'educationLevel' | 'isSuspicious' | 'isPinned' | 'isUnavailable' | 'adminVerifiedExperience' | 'interestedCount' | 'interestedUserIds'>;

  const generateContactString = (user: User): string => {
    let contactParts: string[] = [];
    if (user.mobile) contactParts.push(`เบอร์โทร: ${user.mobile}`);
    if (user.lineId) contactParts.push(`LINE ID: ${user.lineId}`);
    if (user.facebook) contactParts.push(`Facebook: ${user.facebook}`);
    return contactParts.join('\n') || 'ไม่ระบุช่องทางติดต่อ (โปรดอัปเดตโปรไฟล์)';
  };
  
  const handleSubmitJobForm = async (formDataFromForm: JobFormData & { id?: string }) => {
    if (!currentUser) {
      alert("คุณต้องเข้าสู่ระบบก่อน");
      navigateTo(View.Login);
      return;
    }
    const contactInfo = generateContactString(currentUser);

    if (formDataFromForm.id && itemToEdit && editingItemType === 'job') { // Editing existing job
      const jobDocRef = doc(db, "jobs", formDataFromForm.id);
      const jobToUpdate = { ...formDataFromForm, contact: contactInfo, userId: currentUser.id, username: currentUser.username };
      delete jobToUpdate.id; // Don't store 'id' field in Firestore document
      try {
        await updateDoc(jobDocRef, jobToUpdate);
        alert('แก้ไขประกาศงานเรียบร้อยแล้ว');
      } catch (error) {
        console.error("Error updating job: ", error);
        alert("เกิดข้อผิดพลาดในการแก้ไขประกาศงาน");
      }
    } else { // Adding new job
      const newJobData = {
        ...formDataFromForm,
        contact: contactInfo,
        userId: currentUser.id,
        username: currentUser.username,
        postedAt: serverTimestamp() as Timestamp,
        isSuspicious: false,
        isPinned: false,
        isHired: false,
      };
      try {
        await addDoc(collection(db, "jobs"), newJobData);
        alert('ประกาศงานของคุณถูกเพิ่มเรียบร้อยแล้ว!');
      } catch (error) {
        console.error("Error adding job: ", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มประกาศงาน");
      }
    }
    setItemToEdit(null);
    setEditingItemType(null);
    navigateTo(sourceViewForForm || View.FindJobs);
    setSourceViewForForm(null);
  };

  const handleSubmitHelperProfileForm = async (formDataFromForm: HelperProfileFormData & { id?: string }) => {
     if (!currentUser) {
      alert("คุณต้องเข้าสู่ระบบก่อน");
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

    if (formDataFromForm.id && itemToEdit && editingItemType === 'profile') { // Editing
      const profileDocRef = doc(db, "helperProfiles", formDataFromForm.id);
      const profileToUpdate = {
        ...formDataFromForm,
        contact: contactInfo,
        userId: currentUser.id,
        username: currentUser.username,
        gender: currentUser.gender,
        birthdate: currentUser.birthdate,
        educationLevel: currentUser.educationLevel,
      };
      delete profileToUpdate.id;
      try {
        await updateDoc(profileDocRef, profileToUpdate);
        alert('แก้ไขโปรไฟล์ผู้ช่วยเรียบร้อยแล้ว');
      } catch (error) {
        console.error("Error updating helper profile: ", error);
        alert("เกิดข้อผิดพลาดในการแก้ไขโปรไฟล์ผู้ช่วย");
      }
    } else { // Adding new
      const newProfileData = {
        ...formDataFromForm,
        contact: contactInfo,
        userId: currentUser.id,
        username: currentUser.username,
        gender: currentUser.gender,
        birthdate: currentUser.birthdate,
        educationLevel: currentUser.educationLevel,
        postedAt: serverTimestamp() as Timestamp,
        isSuspicious: false,
        isPinned: false,
        isUnavailable: false,
        adminVerifiedExperience: false,
        interestedCount: 0,
        interestedUserIds: [],
      };
      try {
        await addDoc(collection(db, "helperProfiles"), newProfileData);
        alert('โปรไฟล์ของคุณถูกเพิ่มเรียบร้อยแล้ว!');
      } catch (error) {
        console.error("Error adding helper profile: ", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มโปรไฟล์ผู้ช่วย");
      }
    }
    setItemToEdit(null);
    setEditingItemType(null);
    navigateTo(sourceViewForForm || View.FindHelpers);
    setSourceViewForForm(null);
  };
  
  const handleCancelEditOrPost = () => {
    const targetView = sourceViewForForm || View.Home;
    setItemToEdit(null);
    setEditingItemType(null);
    setSourceViewForForm(null);
    navigateTo(targetView);
  };

  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setOnConfirmAction(() => onConfirm); // Store the function itself
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

  const handleDeleteJob = async (jobId: string) => {
    const jobToDelete = jobs.find(job => job.id === jobId);
    if (!jobToDelete) return alert('ไม่พบประกาศงาน');
    if (jobToDelete.userId !== currentUser?.id && !currentUser?.isAdmin) return alert('คุณไม่มีสิทธิ์ลบ');

    openConfirmModal('ยืนยันการลบประกาศงาน', `ต้องการลบ "${jobToDelete.title}"?`, async () => {
      try {
        await deleteDoc(doc(db, "jobs", jobId));
        alert(`ลบประกาศงาน "${jobToDelete.title}" เรียบร้อยแล้ว`);
      } catch (error) {
        console.error("Error deleting job: ", error);
        alert("เกิดข้อผิดพลาดในการลบประกาศงาน");
      }
    });
  };

  const handleDeleteHelperProfile = async (profileId: string) => {
    const profileToDelete = helperProfiles.find(profile => profile.id === profileId);
    if (!profileToDelete) return alert('ไม่พบโปรไฟล์');
    if (profileToDelete.userId !== currentUser?.id && !currentUser?.isAdmin) return alert('คุณไม่มีสิทธิ์ลบ');
    
    openConfirmModal('ยืนยันการลบโปรไฟล์', `ต้องการลบโปรไฟล์ "${profileToDelete.profileTitle}"?`, async () => {
      try {
        await deleteDoc(doc(db, "helperProfiles", profileId));
        alert(`ลบโปรไฟล์ "${profileToDelete.profileTitle}" เรียบร้อยแล้ว`);
      } catch (error) {
        console.error("Error deleting helper profile: ", error);
        alert("เกิดข้อผิดพลาดในการลบโปรไฟล์");
      }
    });
  };
  
  const handleDeleteItemFromMyPosts = (itemId: string, itemType: 'job' | 'profile') => {
    if (itemType === 'job') handleDeleteJob(itemId);
    else handleDeleteHelperProfile(itemId);
  };

  const handleToggleFirestoreFlag = async (collectionName: string, docId: string, fieldName: string) => {
    const docRef = doc(db, collectionName, docId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { [fieldName]: !docSnap.data()?.[fieldName] });
      }
    } catch (error) {
      console.error(`Error toggling ${fieldName} for ${docId} in ${collectionName}: `, error);
      alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะ`);
    }
  };

  const handleToggleSuspiciousJob = (jobId: string) => handleToggleFirestoreFlag("jobs", jobId, "isSuspicious");
  const handleToggleSuspiciousHelperProfile = (profileId: string) => handleToggleFirestoreFlag("helperProfiles", profileId, "isSuspicious");
  const handleTogglePinnedJob = (jobId: string) => handleToggleFirestoreFlag("jobs", jobId, "isPinned");
  const handleTogglePinnedHelperProfile = (profileId: string) => handleToggleFirestoreFlag("helperProfiles", profileId, "isPinned");
  const handleToggleVerifiedExperience = (profileId: string) => handleToggleFirestoreFlag("helperProfiles", profileId, "adminVerifiedExperience");
  const handleToggleHiredJobForUserOrAdmin = (jobId: string) => handleToggleFirestoreFlag("jobs", jobId, "isHired");
  const handleToggleUnavailableHelperProfileForUserOrAdmin = (profileId: string) => handleToggleFirestoreFlag("helperProfiles", profileId, "isUnavailable");

  const handleToggleItemStatusFromMyPosts = (itemId: string, itemType: 'job' | 'profile') => {
    if (itemType === 'job') handleToggleHiredJobForUserOrAdmin(itemId);
    else handleToggleUnavailableHelperProfileForUserOrAdmin(itemId);
  };
  
  const handleLogHelperContactInteraction = async (helperProfileId: string) => {
    if (!currentUser) return console.warn("Attempted to log interaction without current user.");

    const helperProfileRef = doc(db, "helperProfiles", helperProfileId);
    const helperProfileSnap = await getDoc(helperProfileRef);

    if (!helperProfileSnap.exists()) return alert("ไม่พบโปรไฟล์ผู้ช่วย");
    const helperProfileData = helperProfileSnap.data() as HelperProfile;

    // Check if already interested to avoid duplicate count increment and array add
    if (helperProfileData.interestedUserIds?.includes(currentUser.id)) {
      // alert("คุณเคยกดสนใจผู้ช่วยคนนี้แล้ว"); // Alerting might be too intrusive if they just want contact info again
      // No need to re-log the "interest" part of the interaction if already done.
      // However, we should still log a general "contact_helper" interaction if that's a separate concept.
      // For now, we assume "interested" click IS the contact interaction for badge purposes.
    } else {
      // Atomically update interested count and add user to interestedUserIds
      await updateDoc(helperProfileRef, {
        interestedCount: increment(1),
        interestedUserIds: arrayUnion(currentUser.id)
      });
    }

    // Log the interaction for "hasBeenContacted" badge, regardless of whether it was a first-time interest.
    // This assumes any click on "Contact this helper" is an interaction attempt.
    const newInteraction: Omit<Interaction, 'id'> = {
      helperUserId: helperProfileData.userId, // The actual User ID of the helper
      helperProfileId: helperProfileId, // The ID of the HelperProfile document
      employerUserId: currentUser.id,
      timestamp: serverTimestamp() as Timestamp,
      type: 'contact_helper',
    };
    await addDoc(collection(db, "interactions"), newInteraction);
    // State for interactions and helperProfiles will update via their onSnapshot listeners
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
        const response = await fetch('https://formspree.io/f/xvgaepzq', { // Keep Formspree for feedback
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                feedback: feedbackText, page: currentView, timestamp: new Date().toISOString(),
                userId: currentUser?.id || 'anonymous', username: currentUser?.username || 'anonymous',
                userAgent: navigator.userAgent,
            })
        });
        if (response.ok) {
            setFeedbackSubmissionStatus('success');
            setFeedbackSubmissionMessage('ขอบคุณสำหรับความคิดเห็นของคุณ!');
            setIsFeedbackModalOpen(false);
            setTimeout(() => { setFeedbackSubmissionStatus('idle'); setFeedbackSubmissionMessage(null); }, 4000);
            return true;
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.errors?.map((e: { message: string }) => e.message).join(', ') || 'เกิดข้อผิดพลาดในการส่งความคิดเห็น';
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-light dark:bg-dark-pageBg">
        <div className="text-xl font-semibold text-primary dark:text-dark-primary-DEFAULT">✨ กำลังโหลด หาจ๊อบจ้า... ✨</div>
      </div>
    );
  }

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
          {/* ✨ หาจ๊อบจ้า ✨ */}
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
      setTimeout(() => navigateTo(View.Login), 0); // Schedule navigation to avoid state update during render
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
     if (!itemToEdit && (!currentUser.gender || !currentUser.birthdate || !currentUser.educationLevel || currentUser.gender === GenderOption.NotSpecified || currentUser.educationLevel === HelperEducationLevelOption.NotStated)) {
        setTimeout(() => {
            alert('กรุณาอัปเดตข้อมูลส่วนตัว (เพศ, วันเกิด, ระดับการศึกษา) ในหน้า "โปรไฟล์ของฉัน" ก่อน จึงจะสามารถสร้างโปรไฟล์ผู้ช่วยงานได้');
            navigateTo(View.UserProfile);
        }, 0);
        return <p className="text-center p-8">ข้อมูลส่วนตัวยังไม่ครบถ้วน กำลังเปลี่ยนเส้นทางไปหน้าโปรไฟล์...</p>;
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
          {jobs.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.postedAt.toMillis() - a.postedAt.toMillis()).map(job => (
            <JobCard key={job.id} job={job} navigateTo={navigateTo} />
          ))}
        </div>
      )}
    </div>
  );

 const renderFindHelpers = () => {
    const enrichedHelperProfilesList: EnrichedHelperProfile[] = helperProfiles.map(hp => {
      const user = users.find(u => u.id === hp.userId);
      return {
        ...hp,
        userPhotoURL: user?.photoURL,
        userAddress: user?.address, 
        userDisplayName: user?.displayName || user?.username || 'User',
        verifiedExperienceBadge: hp.adminVerifiedExperience || false,
        profileCompleteBadge: checkProfileCompleteness(user),
        hasBeenContactedBadge: checkHasBeenContacted(hp.userId, interactions), // Check based on helper's main user ID
        warningBadge: hp.isSuspicious || false,
        interestedCount: hp.interestedCount || 0,
      };
    }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.postedAt.toMillis() - a.postedAt.toMillis());

    return (
    <div className="container mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-semibold text-secondary-hover dark:text-dark-secondary-hover mb-3 text-center">🧑‍🔧 คนขยันพร้อมช่วย อยู่ตรงนี้แล้ว</h2>
      <p className="text-md text-neutral-dark dark:text-dark-textMuted mb-8 text-center max-w-xl mx-auto font-normal">
        ลองดูโปรไฟล์ของผู้ที่พร้อมช่วยงานช่วงสั้น ๆ ในเชียงใหม่<br/>
        เลือกคนที่ตรงกับความต้องการ แล้วติดต่อได้เลย
      </p>
      {enrichedHelperProfilesList.length === 0 ? (
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
          {enrichedHelperProfilesList.map(profile => (
            <HelperCard 
              key={profile.id} 
              profile={profile} 
              onNavigateToPublicProfile={handleNavigateToPublicProfile} 
              navigateTo={navigateTo} 
              onLogHelperContact={handleLogHelperContactInteraction}
            />
          ))}
        </div>
      )}
    </div>
    );
  };

  const renderRegister = () => <RegistrationForm onRegister={handleRegister} onSwitchToLogin={() => navigateTo(View.Login)} />;
  const renderLogin = () => <LoginForm onLogin={handleLogin} onSwitchToRegister={() => navigateTo(View.Register)} />;

  const renderUserProfile = () => {
    if (!currentUser) {
      setTimeout(() => navigateTo(View.Login), 0);
      return <p className="text-center p-8">กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...</p>;
    }
    return <UserProfilePage currentUser={currentUser} onUpdateProfile={handleUpdateUserProfile} onCancel={() => navigateTo(View.Home)} />;
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
        users={users}
        interactions={interactions}
        onDeleteJob={handleDeleteJob}
        onDeleteHelperProfile={handleDeleteHelperProfile}
        onToggleSuspiciousJob={handleToggleSuspiciousJob}
        onToggleSuspiciousHelperProfile={handleToggleSuspiciousHelperProfile}
        onTogglePinnedJob={handleTogglePinnedJob}
        onTogglePinnedHelperProfile={handleTogglePinnedHelperProfile}
        onToggleHiredJob={handleToggleHiredJobForUserOrAdmin}
        onToggleUnavailableHelperProfile={handleToggleUnavailableHelperProfileForUserOrAdmin}
        onToggleVerifiedExperience={handleToggleVerifiedExperience}
        onStartEditItem={handleStartEditItemFromAdmin}
        currentUser={currentUser}
      />
    );
  };

  const renderMyPostsPage = () => {
    if (!currentUser || currentUser.isAdmin) { // Admins use AdminDashboard
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
    const displayUser: User = {
        ...profileUser,
        profileComplete: checkProfileCompleteness(profileUser),
        hasBeenContacted: checkHasBeenContacted(profileUser.id, interactions),
    };
    const helperProfileForBio = helperProfiles.find(hp => hp.userId === viewingProfileId);
    return <PublicProfilePage user={displayUser} helperProfile={helperProfileForBio} onBack={() => navigateTo(View.FindHelpers)} />;
  };

  let currentViewContent;
  switch (currentView) {
    case View.Home: currentViewContent = renderHome(); break;
    case View.PostJob: currentViewContent = renderPostJob(); break;
    case View.FindJobs: currentViewContent = renderFindJobs(); break;
    case View.OfferHelp: currentViewContent = renderOfferHelpForm(); break;
    case View.FindHelpers: currentViewContent = renderFindHelpers(); break;
    case View.Register: currentViewContent = renderRegister(); break;
    case View.Login: currentViewContent = renderLogin(); break;
    case View.AdminDashboard: currentViewContent = renderAdminDashboard(); break;
    case View.MyPosts: currentViewContent = renderMyPostsPage(); break;
    case View.UserProfile: currentViewContent = renderUserProfile(); break;
    case View.AboutUs: currentViewContent = renderAboutUsPage(); break;
    case View.PublicProfile: currentViewContent = renderPublicProfile(); break;
    case View.Safety: currentViewContent = renderSafetyPage(); break;
    default: currentViewContent = renderHome();
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
              if (feedbackSubmissionStatus !== 'success') {
                setFeedbackSubmissionStatus('idle');
                setFeedbackSubmissionMessage(null);
              }
          }}
          onSubmit={handleFeedbackSubmit}
          submissionStatus={feedbackSubmissionStatus}
          submissionMessage={feedbackSubmissionMessage}
      />
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
            <button onClick={() => navigateTo(View.AboutUs)} className="px-1.5 py-0.5 sm:px-2 sm:py-1 hover:text-primary dark:hover:text-dark-primary-hover transition-colors">เกี่ยวกับเรา</button>
            <span className="text-neutral-medium dark:text-dark-textMuted inline">|</span>
            <button onClick={() => navigateTo(View.Safety)} className="px-1.5 py-0.5 sm:px-2 sm:py-1 hover:text-primary dark:hover:text-dark-primary-hover transition-colors">โปรดอ่านเพื่อความปลอดภัย</button>
            <span className="text-neutral-medium dark:text-dark-textMuted inline">|</span>
            <button
                onClick={() => { setIsFeedbackModalOpen(true); if(feedbackSubmissionStatus === 'error') { setFeedbackSubmissionStatus('idle'); setFeedbackSubmissionMessage(null);}}}
                className="px-1.5 py-0.5 sm:px-2 sm:py-1 hover:text-primary dark:hover:text-dark-primary-hover transition-colors"
            >อยากให้เราปรับปรุงอะไร?</button>
        </div>
      </footer>
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
