


import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Job, HelperProfile, User, EnrichedHelperProfile, Interaction, WebboardPost, WebboardComment, UserLevel, EnrichedWebboardPost, EnrichedWebboardComment } from './types';
import type { AdminItem as AdminItemType } from './components/AdminDashboard';
import { View, GenderOption, HelperEducationLevelOption, USER_LEVELS, UserLevelName, UserRole, ADMIN_BADGE_DETAILS, MODERATOR_BADGE_DETAILS } from './types';
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
import { WebboardPage } from './components/WebboardPage';
import { UserLevelBadge } from './components/UserLevelBadge';
import { SiteLockOverlay } from './components/SiteLockOverlay'; 

// --- Firebase Integration ---
// Switch this flag to false to revert to mock/localStorage mode for prototyping
const USE_FIREBASE = true; 

// Conditional Firebase imports
let auth: any, db: any, storage: any; // Use 'any' to avoid type errors when USE_FIREBASE is false
let onAuthStateChanged: any, createUserWithEmailAndPassword: any, signInWithEmailAndPassword: any, signOut: any;
let collection: any, onSnapshot: any, doc: any, getDoc: any, setDoc: any, addDoc: any, updateDoc: any, deleteDoc: any, serverTimestamp: any, query: any, where: any, orderBy: any, Timestamp: any, getDocs: any, writeBatch: any;
let ref: any, uploadBytesResumable: any, getDownloadURL: any, deleteObject: any;


if (USE_FIREBASE) {
  import('./firebase').then(firebaseModule => {
    auth = firebaseModule.auth;
    db = firebaseModule.db;
    storage = firebaseModule.storage;

    import('firebase/auth').then(authModule => {
      onAuthStateChanged = authModule.onAuthStateChanged;
      createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword;
      signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
      signOut = authModule.signOut;
    });
    import('firebase/firestore').then(firestoreModule => {
      collection = firestoreModule.collection;
      onSnapshot = firestoreModule.onSnapshot;
      doc = firestoreModule.doc;
      getDoc = firestoreModule.getDoc;
      setDoc = firestoreModule.setDoc;
      addDoc = firestoreModule.addDoc;
      updateDoc = firestoreModule.updateDoc;
      deleteDoc = firestoreModule.deleteDoc;
      serverTimestamp = firestoreModule.serverTimestamp;
      Timestamp = firestoreModule.Timestamp;
      query = firestoreModule.query;
      where = firestoreModule.where;
      orderBy = firestoreModule.orderBy;
      getDocs = firestoreModule.getDocs; // Added import
      writeBatch = firestoreModule.writeBatch; // Added import
    });
    import('firebase/storage').then(storageModule => {
      ref = storageModule.ref;
      uploadBytesResumable = storageModule.uploadBytesResumable;
      getDownloadURL = storageModule.getDownloadURL;
      deleteObject = storageModule.deleteObject;
    });
  }).catch(err => console.error("Error loading Firebase modules:", err));
}

// --- End Firebase Integration ---


type Theme = 'light' | 'dark';
const ADMIN_USERNAME = "admin"; // Used for initial admin creation if needed
const ADMIN_EMAIL = "admin@hajobjah.com"; // Used for initial admin creation
const ADMIN_PASSWORD = "adminpass"; // Used for initial admin creation

const USER_CLICKED_HELPERS_LS_KEY = 'chiangMaiUserClickedHelpersMap'; // Kept for non-Firebase mode
const SITE_LOCKED_LS_KEY = 'chiangMaiSiteLockedStatus'; // Kept for non-Firebase mode


const THAI_PROFANITY_BLACKLIST: string[] = [
  "คำหยาบ1", "คำต้องห้าม2", "badword3", "inappropriate_phrase",
];

export const containsBlacklistedWords = (text: string): boolean => {
  if (!text || THAI_PROFANITY_BLACKLIST.length === 0) return false;
  const lowerText = text.toLowerCase();
  return THAI_PROFANITY_BLACKLIST.some(word => lowerText.includes(word.toLowerCase()));
};

export const isValidThaiMobileNumberUtil = (mobile: string): boolean => {
  if (!mobile) return false;
  const cleaned = mobile.replace(/[\s-]/g, '');
  return /^0[689]\d{8}$/.test(cleaned);
};

export const checkProfileCompleteness = (user: User): boolean => {
  if (!user) return false;
  const hasRequiredContact = !!user.mobile;
  const hasPhoto = !!user.photo;
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

export const calculateUserLevel = (userId: string, posts: WebboardPost[], comments: WebboardComment[]): UserLevel => {
  const userPostsCount = posts.filter(p => p.userId === userId).length;
  const userCommentsCount = comments.filter(c => c.userId === userId).length;
  const score = (userPostsCount * 2) + (userCommentsCount * 0.5);

  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (USER_LEVELS[i].minScore !== undefined && score >= USER_LEVELS[i].minScore!) {
      return USER_LEVELS[i];
    }
  }
  return USER_LEVELS[0];
};

export const getUserDisplayBadge = (user: User | null | undefined, posts: WebboardPost[], comments: WebboardComment[]): UserLevel => {
  if (!user) return USER_LEVELS[0]; 
  if (user.role === UserRole.Admin) return ADMIN_BADGE_DETAILS;
  if (user.role === UserRole.Moderator) return MODERATOR_BADGE_DETAILS;
  return user.userLevel || calculateUserLevel(user.id, posts, comments);
};


const DUMMY_WEBBOARD_POSTS_FOR_SEEDING: Omit<WebboardPost, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[] = [
  {
    title: "👋 ยินดีต้อนรับสู่เว็บบอร์ดหาจ๊อบจ้า!",
    body: "สวัสดีครับทุกคน! นี่คือพื้นที่สำหรับพูดคุย แลกเปลี่ยนความคิดเห็น และช่วยเหลือกันในชุมชนหาจ๊อบจ้าของเรานะครับ มีอะไรอยากแชร์ อยากถาม โพสต์ได้เลย! \n\nอย่าลืมอ่านกฎกติกาของบอร์ดเราด้วยนะ 😊",
    userId: 'ADMIN_UID_PLACEHOLDER', // This should be dynamically replaced by the actual Admin UID during seeding
    username: 'admin', // Or the admin's chosen display username
    authorPhoto: undefined,
    likes: [],
    isPinned: true,
  },
];


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const [theme, setTheme] = useState<Theme>('light');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackSubmissionStatus, setFeedbackSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackSubmissionMessage, setFeedbackSubmissionMessage] = useState<string | null>(null);
  
  // Firebase-driven states
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [helperProfiles, setHelperProfiles] = useState<HelperProfile[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [webboardPosts, setWebboardPosts] = useState<WebboardPost[]>([]);
  const [webboardComments, setWebboardComments] = useState<WebboardComment[]>([]);
  
  const [isSiteLocked, setIsSiteLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true); 

  // Local states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginRedirectInfo, setLoginRedirectInfo] = useState<{ view: View; payload?: any } | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Job | HelperProfile | WebboardPost | null>(null);
  const [editingItemType, setEditingItemType] = useState<'job' | 'profile' | 'webboardPost' | null>(null);
  const [sourceViewForForm, setSourceViewForForm] = useState<View | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);


  // --- START OF MOCK/LOCALSTORAGE DATA AND LOGIC (FOR USE_FIREBASE = false) ---
  const [mockUsers, setMockUsers] = useState<User[]>([]);
  const [mockCurrentUser, setMockCurrentUser] = useState<User | null>(null);
  const [mockJobs, setMockJobs] = useState<Job[]>([]);
  const [mockHelperProfiles, setMockHelperProfiles] = useState<HelperProfile[]>([]);
  const [mockInteractions, setMockInteractions] = useState<Interaction[]>([]);
  const [mockWebboardPosts, setMockWebboardPosts] = useState<WebboardPost[]>([]);
  const [mockWebboardComments, setMockWebboardComments] = useState<WebboardComment[]>([]);
  const [mockIsSiteLocked, setMockIsSiteLocked] = useState<boolean>(false);

  const initializeMockData = () => {
    const savedUsers = localStorage.getItem('chiangMaiQuickUsers');
    const savedJobs = localStorage.getItem('chiangMaiQuickJobs');
    const savedHelpers = localStorage.getItem('chiangMaiQuickHelpers');
    const savedInteractions = localStorage.getItem('chiangMaiQuickInteractions');
    let savedWebboardPosts = localStorage.getItem('chiangMaiWebboardPosts');
    const savedWebboardComments = localStorage.getItem('chiangMaiWebboardComments');
    const savedCurrentUser = localStorage.getItem('chiangMaiQuickCurrentUser');
    const savedSiteLock = localStorage.getItem(SITE_LOCKED_LS_KEY);

    if (!savedWebboardPosts) {
        const seededPosts = DUMMY_WEBBOARD_POSTS_FOR_SEEDING.map((p, index) => ({
            ...p, 
            id: `dummy-mock-post-${index}`, 
            ownerId: 'admin-user-001', // Mock admin ID for ownerId
            userId: 'admin-user-001', // Mock admin ID
            createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(), 
            updatedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString()
        }));
        localStorage.setItem('chiangMaiWebboardPosts', JSON.stringify(seededPosts));
        savedWebboardPosts = JSON.stringify(seededPosts);
    }
    
    const tempPosts = savedWebboardPosts ? JSON.parse(savedWebboardPosts) : [];
    const tempComments = savedWebboardComments ? JSON.parse(savedWebboardComments) : [];
    
    const baseAdminUser: User = { 
      id: 'admin-user-001',
      displayName: 'Admin User',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      hashedPassword: ADMIN_PASSWORD, 
      role: UserRole.Admin,
      mobile: '088-888-8888',
      lineId: 'admin_line_id',
      facebook: 'admin_facebook_profile',
      gender: GenderOption.NotSpecified,
      birthdate: '1990-01-01',
      educationLevel: HelperEducationLevelOption.Bachelor,
      photo: undefined,
      address: '1 Admin Road, Admin City',
      favoriteMusic: 'Classical',
      hobbies: 'Reading, Coding',
      profileComplete: true,
      userLevel: ADMIN_BADGE_DETAILS,
      isAdmin: true,
      isMuted: false,
      isFrozen: false,
    };
    const baseTestUser: User = { 
      id: 'test-user-002',
      displayName: 'Test User',
      username: 'test',
      email: 'test@user.com',
      hashedPassword: 'testpass', 
      role: UserRole.Member,
      mobile: '081-234-5678',
      lineId: 'test_user_line',
      facebook: 'test_user_facebook',
      gender: GenderOption.Male,
      birthdate: '1995-05-15',
      educationLevel: HelperEducationLevelOption.HighSchool,
      photo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdlOGM4YSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNSIvPjxwYXRoIGQ9Ik0yMCAyMWE4IDggMCAwIDAtMTYgMCIvPjwvc3ZnPg==',
      address: '123 Mymoo Road, Chiang Mai',
      favoriteMovie: 'Inception',
      introSentence: 'I am a friendly and hardworking individual.',
      profileComplete: true,
      userLevel: calculateUserLevel('test-user-002', tempPosts, tempComments),
      isAdmin: false,
      isMuted: false,
      isFrozen: false,
    };
    let initialMockUsers = [baseAdminUser, baseTestUser];

    if (savedUsers) {
        try {
            const parsedUsers = JSON.parse(savedUsers);
            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
                initialMockUsers = parsedUsers.map((u: any) => ({
                    ...u,
                    userLevel: calculateUserLevel(u.id, tempPosts, tempComments),
                    profileComplete: checkProfileCompleteness(u),
                    isAdmin: u.role === UserRole.Admin,
                    isMuted: u.isMuted || false,
                    isFrozen: u.isFrozen || false,
                }));
            }
        } catch (e) { console.error("Error parsing mock users", e); }
    }
    setMockUsers(initialMockUsers);

    if (savedCurrentUser) {
        try {
            const parsedCurrent = JSON.parse(savedCurrentUser);
            const fullUser = initialMockUsers.find(u => u.id === parsedCurrent.id && u.hashedPassword === parsedCurrent.hashedPassword);
            if (fullUser) setMockCurrentUser(fullUser);
        } catch(e) { console.error("Error parsing mock current user", e); }
    }
    
    setMockJobs(savedJobs ? JSON.parse(savedJobs) : []);
    setMockHelperProfiles(savedHelpers ? JSON.parse(savedHelpers).map((hp: any) => ({...hp, interestedCount: hp.interestedCount || 0})) : []);
    setMockInteractions(savedInteractions ? JSON.parse(savedInteractions) : []);
    setMockWebboardPosts(tempPosts);
    setMockWebboardComments(tempComments);
    setMockIsSiteLocked(savedSiteLock === 'true');
    setIsLoading(false);
  };

  const saveMockData = () => {
    localStorage.setItem('chiangMaiQuickUsers', JSON.stringify(mockUsers));
    localStorage.setItem('chiangMaiQuickJobs', JSON.stringify(mockJobs));
    localStorage.setItem('chiangMaiQuickHelpers', JSON.stringify(mockHelperProfiles));
    localStorage.setItem('chiangMaiQuickInteractions', JSON.stringify(mockInteractions));
    localStorage.setItem('chiangMaiQuickWebboardPosts', JSON.stringify(mockWebboardPosts));
    localStorage.setItem('chiangMaiQuickWebboardComments', JSON.stringify(mockWebboardComments));
    if (mockCurrentUser) {
      localStorage.setItem('chiangMaiQuickCurrentUser', JSON.stringify(mockCurrentUser));
    } else {
      localStorage.removeItem('chiangMaiQuickCurrentUser');
    }
    localStorage.setItem(SITE_LOCKED_LS_KEY, String(mockIsSiteLocked));
  };
  // --- END OF MOCK/LOCALSTORAGE DATA AND LOGIC ---

  const dataLoadedRef = useRef(false); // To prevent multiple initial loads

  // --- Firebase Data Listeners ---
  useEffect(() => {
    if (!USE_FIREBASE) {
      initializeMockData();
      dataLoadedRef.current = true; // Mark mock data as loaded
      return;
    }
    if (!auth || !db || dataLoadedRef.current) { // Added dataLoadedRef check
      if (!auth || !db) console.log("Firebase services not yet loaded...");
      if(dataLoadedRef.current && !isLoading) setIsLoading(false); // Ensure loading is false if data already loaded
      return;
    }
    
    setIsLoading(true);
    dataLoadedRef.current = true; // Mark Firebase data loading attempt

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        // Use onSnapshot for real-time updates to currentUser
        const unsubUserDoc = onSnapshot(userDocRef, (userDocSnap: any) => {
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as Omit<User, 'id'>;
                 setCurrentUser({ 
                    ...userData, 
                    id: firebaseUser.uid, 
                    isAdmin: userData.role === UserRole.Admin,
                    // These are re-calculated client side or should be part of enriched user
                    profileComplete: checkProfileCompleteness({ ...userData, id: firebaseUser.uid }), 
                    userLevel: calculateUserLevel(firebaseUser.uid, webboardPosts, webboardComments),
                    isMuted: userData.isMuted || false,
                    isFrozen: userData.isFrozen || false,
                });
            } else {
                console.warn("User document not found in Firestore for UID:", firebaseUser.uid);
                // This could happen if user is deleted from Firestore but not Auth
                // Or if there's a delay after signup. Consider creating doc if not exists.
                setCurrentUser(null); 
            }
             if (isLoading) setIsLoading(false); // Stop loading after auth and first user doc fetch
        }, (error: any) => {
            console.error("Error fetching user document:", error);
            setCurrentUser(null);
            if (isLoading) setIsLoading(false);
        });
        return () => unsubUserDoc(); // Cleanup listener for user document
      } else {
        setCurrentUser(null);
        if (isLoading) setIsLoading(false); // Stop loading if no user
      }
    });

    // Ensure initial admin user exists in Firestore
    const ensureAdminExists = async () => {
        const adminUserDocRef = doc(db, "users", 'ADMIN_UID_PLACEHOLDER_STATIC'); // Use a static known UID for the conceptual admin
        const adminDocSnap = await getDoc(adminUserDocRef);
        if (!adminDocSnap.exists()) {
            // This means the actual admin account (from Auth) needs to be created first via app UI
            // Then its UID used here. For now, this seeding is conceptual.
            console.log("Conceptual admin user does not exist in Firestore. Manual creation or different seeding needed.");
        }
    };
    // ensureAdminExists(); // Call this if you have a fixed UID for a pre-seeded admin

    const usersCollectionRef = collection(db, "users");
    const unsubUsers = onSnapshot(usersCollectionRef, (snapshot: any) => {
        const usersData = snapshot.docs.map((d: any) => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data,
                isAdmin: data.role === UserRole.Admin,
                profileComplete: checkProfileCompleteness({ ...data, id: d.id }),
                userLevel: calculateUserLevel(d.id, webboardPosts, webboardComments), // Recalculate based on live posts/comments
                isMuted: data.isMuted || false,
                isFrozen: data.isFrozen || false,
            } as User;
        });
        setUsers(usersData);
    }, (error: any) => console.error("Error fetching users collection:", error));
    
    const jobsQuery = query(collection(db, "jobs"), orderBy("isPinned", "desc"), orderBy("postedAt", "desc"));
    const unsubJobs = onSnapshot(jobsQuery, (snapshot: any) => {
        const jobsData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data(), postedAt: d.data().postedAt?.toDate ? d.data().postedAt.toDate().toISOString() : d.data().postedAt } as Job));
        setJobs(jobsData);
    }, (error: any) => console.error("Error fetching jobs collection:", error));

    const profilesQuery = query(collection(db, "helperProfiles"), orderBy("isPinned", "desc"), orderBy("postedAt", "desc"));
    const unsubHelperProfiles = onSnapshot(profilesQuery, (snapshot: any) => {
        const profilesData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data(), postedAt: d.data().postedAt?.toDate ? d.data().postedAt.toDate().toISOString() : d.data().postedAt } as HelperProfile));
        setHelperProfiles(profilesData);
    }, (error: any) => console.error("Error fetching helperProfiles collection:", error));

    const postsQuery = query(collection(db, "webboardPosts"), orderBy("isPinned", "desc"), orderBy("createdAt", "desc"));
    const unsubWebboardPosts = onSnapshot(postsQuery, (snapshot: any) => {
        const postsData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt, updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt } as WebboardPost));
        setWebboardPosts(postsData);
        if (postsData.length === 0 && currentUser?.role === UserRole.Admin) { // Basic seeding logic
            const adminUid = currentUser.id;
            DUMMY_WEBBOARD_POSTS_FOR_SEEDING.forEach(async (postSeed) => {
                const newPost = { ...postSeed, userId: adminUid, ownerId: adminUid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
                try {
                    await addDoc(collection(db, "webboardPosts"), newPost);
                } catch (seedError) { console.error("Error seeding webboard post:", seedError); }
            });
        }
    }, (error: any) => console.error("Error fetching webboardPosts collection:", error));
    
    const commentsQuery = query(collection(db, "webboardComments"), orderBy("createdAt", "asc"));
    const unsubWebboardComments = onSnapshot(commentsQuery, (snapshot: any) => {
        const commentsData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt, updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt } as WebboardComment));
        setWebboardComments(commentsData);
    }, (error: any) => console.error("Error fetching webboardComments collection:", error));
    
    const unsubInteractions = onSnapshot(collection(db, "interactions"), (snapshot: any) => {
        const interactionsData = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate ? d.data().timestamp.toDate().toISOString() : d.data().timestamp } as Interaction));
        setInteractions(interactionsData);
    }, (error: any) => console.error("Error fetching interactions collection:", error));

    const configDocRef = doc(db, "config", "siteStatus"); // Changed from siteSettings to siteStatus
    const unsubSiteConfig = onSnapshot(configDocRef, (docSnap: any) => {
        if (docSnap.exists()) {
            setIsSiteLocked(docSnap.data().isSiteLocked || false);
        } else {
            // Ensure the doc is created with the correct ID if it doesn't exist
            setDoc(configDocRef, { isSiteLocked: false, maintenanceMessage: "ระบบอยู่ระหว่างการปรับปรุง" });
        }
        if (isLoading) setIsLoading(false); // Should be set earlier by auth
    }, (error: any) => {
        console.error("Error fetching site config:", error);
        if (isLoading) setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      unsubJobs();
      unsubHelperProfiles();
      unsubWebboardPosts();
      unsubWebboardComments();
      unsubInteractions();
      unsubSiteConfig();
      dataLoadedRef.current = false; // Reset for potential re-runs if USE_FIREBASE toggles
    };
  }, [USE_FIREBASE, auth, db]); // Re-run if USE_FIREBASE changes or Firebase modules load.

  // Update derived currentUser fields when dependencies change (for Firebase mode)
   useEffect(() => {
    if (USE_FIREBASE && currentUser) {
        const updatedCurrentUser: User = {
            ...currentUser,
            profileComplete: checkProfileCompleteness(currentUser),
            userLevel: calculateUserLevel(currentUser.id, webboardPosts, webboardComments),
            isMuted: currentUser.isMuted || false,
            isFrozen: currentUser.isFrozen || false,
        };
        if (JSON.stringify(currentUser) !== JSON.stringify(updatedCurrentUser)) {
            setCurrentUser(updatedCurrentUser);
        }
    } else if (!USE_FIREBASE && mockCurrentUser) {
        const updatedMockCurrentUser: User = {
            ...mockCurrentUser,
            profileComplete: checkProfileCompleteness(mockCurrentUser),
            userLevel: calculateUserLevel(mockCurrentUser.id, mockWebboardPosts, mockWebboardComments),
            isMuted: mockCurrentUser.isMuted || false,
            isFrozen: mockCurrentUser.isFrozen || false,
        };
         if (JSON.stringify(mockCurrentUser) !== JSON.stringify(updatedMockCurrentUser)) {
            setMockCurrentUser(updatedMockCurrentUser);
        }
    }
  }, [users, webboardPosts, webboardComments, currentUser?.id, mockUsers, mockWebboardPosts, mockWebboardComments, mockCurrentUser?.id, USE_FIREBASE]);


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
  
  const requestLoginForAction = (originalView: View, originalPayload?: any) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!activeCurrentUser) {
      setLoginRedirectInfo({ view: originalView, payload: originalPayload });
      setCurrentView(View.Login);
      setIsMobileMenuOpen(false);
    }
  };

  const navigateTo = (view: View, payload?: any) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);

    const protectedViews: View[] = [
      View.PostJob,
      View.OfferHelp,
      View.UserProfile,
      View.MyPosts,
      View.AdminDashboard,
      View.PublicProfile, 
    ];
    
    if (activeCurrentUser?.isFrozen && view !== View.Login && view !== View.Home && view !== View.Safety && view !== View.AboutUs) {
        alert("บัญชีของคุณถูกระงับการใช้งาน โปรดติดต่อผู้ดูแลระบบ");
        handleLogout(); // Log them out
        return;
    }

    if (!activeCurrentUser && protectedViews.includes(view)) {
      setLoginRedirectInfo({ view, payload });
      setCurrentView(View.Login);
      return;
    }
    
    if (view === View.PublicProfile && typeof payload === 'string') {
      setViewingProfileId(payload);
    } else if (view !== View.PublicProfile) {
      if (viewingProfileId !== null) setViewingProfileId(null);
    }

    if (view === View.Webboard) {
      if (typeof payload === 'string') {
        if (payload === 'create') {
          setSelectedPostId('create');
        } else {
          setSelectedPostId(payload);
        }
      } else if (payload && typeof payload === 'object' && payload.postId) {
        setSelectedPostId(payload.postId);
      } else if (payload === null || payload === undefined) {
        setSelectedPostId(null);
      }
    } else if (selectedPostId !== null && view !== View.AdminDashboard) {
      setSelectedPostId(null);
    }
    setCurrentView(view);
  };


  const handleNavigateToPublicProfile = (userId: string) => {
    navigateTo(View.PublicProfile, userId);
  };

  const handleRegister = async (userData: Omit<User, 'id' | 'hashedPassword' | 'isAdmin' | 'photo' | 'address' | 'userLevel' | 'profileComplete' | 'role' | 'isMuted' | 'isFrozen'> & { password: string }): Promise<boolean> => {
    if (USE_FIREBASE) {
        // Check for existing username or email in Firestore before creating Auth user
        const usersRef = collection(db, "users");
        const usernameQuery = query(usersRef, where("username", "==", userData.username.toLowerCase()));
        const emailQuery = query(usersRef, where("email", "==", userData.email.toLowerCase()));

        const usernameSnapshot = await getDoc(doc(usersRef, userData.username.toLowerCase())); // Assuming username is doc ID for uniqueness check
        if (usernameSnapshot.exists()) { // Simplified check, better to query
             alert('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว โปรดเลือกชื่ออื่น');
            return false;
        }
        // A more robust check for email would be querying the collection
        // For now, we rely on Firebase Auth's email uniqueness.

        if (!isValidThaiMobileNumberUtil(userData.mobile)) {
            alert('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
            return false;
        }
        if (!userData.gender || !userData.birthdate || !userData.educationLevel) {
            alert('กรุณากรอกข้อมูลส่วนตัว (เพศ, วันเกิด, ระดับการศึกษา) ให้ครบถ้วน');
            return false;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const firebaseUser = userCredential.user;
            
            const newUserRole = (userData.username.toLowerCase() === ADMIN_USERNAME || userData.email.toLowerCase() === ADMIN_EMAIL) && userData.password === ADMIN_PASSWORD ? UserRole.Admin : UserRole.Member;

            const newUserProfileData: Omit<User, 'id' | 'hashedPassword' | 'isAdmin' | 'profileComplete' | 'userLevel'> = {
                displayName: userData.displayName,
                username: userData.username, // Store as provided, maybe convert to lower for queries
                email: firebaseUser.email!,
                role: newUserRole,
                mobile: userData.mobile,
                lineId: userData.lineId || '',
                facebook: userData.facebook || '',
                gender: userData.gender || GenderOption.NotSpecified,
                birthdate: userData.birthdate || '',
                educationLevel: userData.educationLevel || HelperEducationLevelOption.NotStated,
                photo: '', 
                address: '',
                favoriteMusic: '', favoriteBook: '', favoriteMovie: '', hobbies: '', favoriteFood: '', dislikedThing: '', introSentence: '',
                isMuted: false, 
                isFrozen: false, 
            };
            
            await setDoc(doc(db, "users", firebaseUser.uid), newUserProfileData);
            alert('ลงทะเบียนสำเร็จแล้ว!');
             if (loginRedirectInfo) {
                navigateTo(loginRedirectInfo.view, loginRedirectInfo.payload);
                setLoginRedirectInfo(null);
            } else {
                navigateTo(View.Home);
            }
            return true;
        } catch (error: any) {
            console.error("Firebase registration error:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert('อีเมลนี้ถูกใช้ไปแล้ว โปรดใช้อีเมลอื่น');
            } else {
                alert(`เกิดข้อผิดพลาดในการลงทะเบียน: ${error.message}`);
            }
            return false;
        }
    } else { // Mock logic
        if (mockUsers.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
            alert('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว โปรดเลือกชื่ออื่น');
            return false;
        }
        if (mockUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
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

        const newUserId = Date.now().toString();
        const newUserRole = (userData.username.toLowerCase() === ADMIN_USERNAME || userData.email.toLowerCase() === ADMIN_EMAIL) && userData.password === ADMIN_PASSWORD ? UserRole.Admin : UserRole.Member;
        
        const newUserBase: Omit<User, 'profileComplete' | 'userLevel' | 'isAdmin' | 'isMuted' | 'isFrozen'> = { 
            id: newUserId,
            displayName: userData.displayName,
            username: userData.username,
            email: userData.email,
            hashedPassword: userData.password,
            role: newUserRole,
            mobile: userData.mobile,
            lineId: userData.lineId || undefined,
            facebook: userData.facebook || undefined,
            gender: userData.gender,
            birthdate: userData.birthdate,
            educationLevel: userData.educationLevel,
        };
        const newUser: User = {
            ...newUserBase,
            isAdmin: newUserRole === UserRole.Admin,
            userLevel: calculateUserLevel(newUserId, mockWebboardPosts, mockWebboardComments),
            profileComplete: checkProfileCompleteness(newUserBase as User),
            isMuted: false,
            isFrozen: false,
        };

        setMockUsers(prev => [...prev, newUser]);
        setMockCurrentUser(newUser); 
        alert('ลงทะเบียนสำเร็จแล้ว!');

        if (loginRedirectInfo) {
            navigateTo(loginRedirectInfo.view, loginRedirectInfo.payload);
            setLoginRedirectInfo(null);
        } else {
            navigateTo(View.Home);
        }
        return true;
    }
  };

  const handleLogin = async (loginIdentifier: string, passwordAttempt: string): Promise<boolean> => {
    if (USE_FIREBASE) {
        try {
            // Attempt login with email. If it fails with 'auth/invalid-email', try finding user by username then login with their email.
            let userEmail = loginIdentifier;
            if (!loginIdentifier.includes('@')) { // Likely a username
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", loginIdentifier));
                const querySnapshot = await getDocs(q); 
                if (!querySnapshot.empty) {
                     userEmail = querySnapshot.docs[0].data().email;
                } else {
                    alert('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
                    return false;
                }
            }

            const userCredential = await signInWithEmailAndPassword(auth, userEmail, passwordAttempt);
            const firebaseUser = userCredential.user;
            const userDocSnap = await getDoc(doc(db, "users", firebaseUser.uid));

            if (userDocSnap.exists() && userDocSnap.data().isFrozen) {
                await signOut(auth); // Sign out the frozen user
                alert("บัญชีของคุณถูกระงับการใช้งาน โปรดติดต่อผู้ดูแลระบบ");
                return false;
            }

            alert(`ยินดีต้อนรับ!`); 
             if (loginRedirectInfo) {
                navigateTo(loginRedirectInfo.view, loginRedirectInfo.payload);
                setLoginRedirectInfo(null);
            } else {
                navigateTo(View.Home);
            }
            return true;
        } catch (error: any) {
            console.error("Firebase login error:", error);
            alert('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
            return false;
        }
    } else { // Mock logic
        const userFromList = mockUsers.find(
        u => (u.username.toLowerCase() === loginIdentifier.toLowerCase() || u.email.toLowerCase() === loginIdentifier.toLowerCase()) &&
            u.hashedPassword === passwordAttempt
        );
        if (userFromList) {
            if (userFromList.isFrozen) {
                alert("บัญชีของคุณถูกระงับการใช้งาน โปรดติดต่อผู้ดูแลระบบ");
                return false;
            }
        const loggedInUser: User = {
            ...userFromList,
            isAdmin: userFromList.role === UserRole.Admin,
            };
        setMockCurrentUser(loggedInUser);
        alert(`ยินดีต้อนรับ @${loggedInUser.displayName}!`);
        if (loginRedirectInfo) {
            navigateTo(loginRedirectInfo.view, loginRedirectInfo.payload);
            setLoginRedirectInfo(null);
        } else {
            navigateTo(View.Home);
        }
        return true;
        } else {
        alert('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
        return false;
        }
    }
  };

  const handleUpdateUserProfile = async (
    updatedProfileData: Pick<User, 'mobile' | 'lineId' | 'facebook' | 'gender' | 'birthdate' | 'educationLevel' | 'photo' | 'address' | 'favoriteMusic' | 'favoriteBook' | 'favoriteMovie' | 'hobbies' | 'favoriteFood' | 'dislikedThing' | 'introSentence'> & { photoFile?: File }
  ): Promise<boolean> => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!activeCurrentUser) {
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

    if (USE_FIREBASE) {
        try {
            const userDocRef = doc(db, "users", activeCurrentUser.id);
            let photoURL = updatedProfileData.photo || activeCurrentUser.photo || ''; // Keep current photo if not changed

            if (updatedProfileData.photoFile) { // New file uploaded
                const photoName = `profileImages/${activeCurrentUser.id}/${Date.now()}_${updatedProfileData.photoFile.name}`;
                const storageRef = ref(storage, photoName);
                const uploadTask = uploadBytesResumable(storageRef, updatedProfileData.photoFile);
                
                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        (snapshot) => { /* Progress */ }, 
                        (error) => { console.error("Upload failed:", error); reject(error); }, 
                        async () => {
                            photoURL = await getDownloadURL(uploadTask.snapshot.ref);
                            // Delete old photo from storage if it exists and is different
                            if (activeCurrentUser.photo && activeCurrentUser.photo !== photoURL && activeCurrentUser.photo.includes('firebasestorage')) {
                                try { await deleteObject(ref(storage, activeCurrentUser.photo)); } catch (e) { console.warn("Old photo deletion failed", e); }
                            }
                            resolve();
                        }
                    );
                });
            } else if (updatedProfileData.photo === undefined && activeCurrentUser.photo) { // Photo explicitly removed by user
                photoURL = '';
                if (activeCurrentUser.photo && activeCurrentUser.photo.includes('firebasestorage')) {
                   try { await deleteObject(ref(storage, activeCurrentUser.photo)); } catch (e) { console.warn("Photo deletion failed", e); }
                }
            }
            // If updatedProfileData.photo is a string (Base64 from previous mock or already a URL), it's handled by initial photoURL assignment
            
            const dataToUpdate = { ...updatedProfileData, photo: photoURL };
            delete (dataToUpdate as any).photoFile;

            await updateDoc(userDocRef, dataToUpdate);
            return true;
        } catch (error) {
            console.error("Error updating user profile in Firebase:", error);
            alert("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
            return false;
        }
    } else { // Mock logic
        setMockCurrentUser(prev => prev ? { ...prev, ...updatedProfileData, photo: updatedProfileData.photoFile ? 'new-base64-placeholder' : updatedProfileData.photo } : null )
        setMockUsers(prevUsers =>
        prevUsers.map(u =>
            u.id === activeCurrentUser.id
            ? {
                ...u,
                ...updatedProfileData, 
                photo: updatedProfileData.photoFile ? 'new-base64-placeholder' : updatedProfileData.photo, // In mock, would be base64
                profileComplete: checkProfileCompleteness({ ...u, ...updatedProfileData, photo: updatedProfileData.photoFile ? 'new-base64-placeholder' : updatedProfileData.photo }),
                }
            : u
        )
        );
        return true;
    }
  };

  const handleLogout = async () => {
    if (USE_FIREBASE) {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Firebase logout error:", error);
            alert("เกิดข้อผิดพลาดในการออกจากระบบ");
        }
    } else {
        setMockCurrentUser(null);
    }
    setLoginRedirectInfo(null); 
    setItemToEdit(null);
    setEditingItemType(null);
    setSourceViewForForm(null);
    setViewingProfileId(null);
    setSelectedPostId(null);
    setIsMobileMenuOpen(false);
    alert('ออกจากระบบเรียบร้อยแล้ว');
    navigateTo(View.Home);
  };
  
  const handleStartEditItemFromAdmin = (item: AdminItemType) => {
    const activeJobs = USE_FIREBASE ? jobs : mockJobs;
    const activeHelperProfiles = USE_FIREBASE ? helperProfiles : mockHelperProfiles;
    const activeWebboardPosts = USE_FIREBASE ? webboardPosts : mockWebboardPosts;

    if (item.itemType === 'job') {
        const originalItem = activeJobs.find(j => j.id === item.id);
        if (originalItem) {
            setItemToEdit(originalItem);
            setEditingItemType('job');
            setSourceViewForForm(View.AdminDashboard);
            navigateTo(View.PostJob);
        } else { console.error("Job not found for editing from Admin:", item); }
    } else if (item.itemType === 'profile') {
        const originalItem = activeHelperProfiles.find(p => p.id === item.id);
        if (originalItem) {
            setItemToEdit(originalItem);
            setEditingItemType('profile');
            setSourceViewForForm(View.AdminDashboard);
            navigateTo(View.OfferHelp);
        } else { console.error("Helper profile not found for editing from Admin:", item); }
    } else if (item.itemType === 'webboardPost') {
        const originalPost = activeWebboardPosts.find(p => p.id === item.id);
        if (originalPost) {
            setItemToEdit({ ...originalPost, isEditing: true });
            setEditingItemType('webboardPost');
            setSourceViewForForm(View.AdminDashboard);
            navigateTo(View.Webboard, 'create');
        } else { console.error("Webboard post not found for editing from Admin:", item); }
    }
  };

  const handleStartEditMyItem = (itemId: string, itemType: 'job' | 'profile' | 'webboardPost') => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeJobs = USE_FIREBASE ? jobs : mockJobs;
    const activeHelperProfiles = USE_FIREBASE ? helperProfiles : mockHelperProfiles;
    const activeWebboardPosts = USE_FIREBASE ? webboardPosts : mockWebboardPosts;

    if (itemType === 'job') {
        const originalItem = activeJobs.find(j => j.id === itemId);
        if (originalItem && originalItem.userId === activeCurrentUser?.id) {
            setItemToEdit(originalItem);
            setEditingItemType(itemType);
            setSourceViewForForm(View.MyPosts);
            navigateTo(View.PostJob);
        } else { 
            alert("เกิดข้อผิดพลาด: ไม่พบรายการ หรือคุณไม่ใช่เจ้าของ"); 
        }
    } else if (itemType === 'profile') {
        const originalItem = activeHelperProfiles.find(p => p.id === itemId);
        if (originalItem && originalItem.userId === activeCurrentUser?.id) {
            setItemToEdit(originalItem);
            setEditingItemType(itemType);
            setSourceViewForForm(View.MyPosts);
            navigateTo(View.OfferHelp);
        } else { 
            alert("เกิดข้อผิดพลาด: ไม่พบรายการ หรือคุณไม่ใช่เจ้าของ"); 
        }
    } else if (itemType === 'webboardPost') {
        const originalPost = activeWebboardPosts.find(p => p.id === itemId);
        if (originalPost && originalPost.userId === activeCurrentUser?.id) {
            setItemToEdit({ ...originalPost, isEditing: true });
            setEditingItemType('webboardPost');
            setSourceViewForForm(View.MyPosts);
            navigateTo(View.Webboard, 'create');
        } else { 
            alert("เกิดข้อผิดพลาด: ไม่พบรายการ หรือคุณไม่ใช่เจ้าของ"); 
        }
    }
  };

  type JobFormData = Omit<Job, 'id' | 'postedAt' | 'userId' | 'username' | 'isSuspicious' | 'isPinned' | 'isHired' | 'contact' | 'ownerId'>;
  type HelperProfileFormData = Omit<HelperProfile, 'id' | 'postedAt' | 'userId' | 'username' | 'isSuspicious' | 'isPinned' | 'isUnavailable' | 'contact' | 'gender' | 'birthdate' | 'educationLevel' | 'adminVerifiedExperience' | 'interestedCount' | 'ownerId'>;

  const generateContactString = (user: User): string => {
    let contactParts: string[] = [];
    if (user.mobile) contactParts.push(`เบอร์โทร: ${user.mobile}`);
    if (user.lineId) contactParts.push(`LINE ID: ${user.lineId}`);
    if (user.facebook) contactParts.push(`Facebook: ${user.facebook}`);
    return contactParts.join('\n') || 'ไม่ระบุช่องทางติดต่อ';
  };

  // --- Firestore Update/Add Functions ---
  const handleUpdateJob = async (updatedJobDataFromForm: JobFormData & { id: string }) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeJobs = USE_FIREBASE ? jobs : mockJobs;

    const originalJob = activeJobs.find(j => j.id === updatedJobDataFromForm.id);
    if (!originalJob) {
      alert('เกิดข้อผิดพลาด: ไม่พบประกาศงานเดิม'); return;
    }
    // Ownership check will be handled by Firestore rules based on ownerId
    // if (originalJob.userId !== activeCurrentUser?.id && activeCurrentUser?.role !== UserRole.Admin) {
    //     alert('คุณไม่มีสิทธิ์แก้ไขประกาศงานนี้'); return;
    // }
    if (containsBlacklistedWords(updatedJobDataFromForm.description) || containsBlacklistedWords(updatedJobDataFromForm.title)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }
    
    const contactInfo = activeCurrentUser ? generateContactString(activeCurrentUser) : 'ข้อมูลติดต่อไม่พร้อมใช้งาน';
    const dataToUpdate: Partial<Job> = {
      ...updatedJobDataFromForm,
      contact: contactInfo, // Ensure contact is updated if user details changed
    };

    if (USE_FIREBASE) {
        const jobDocRef = doc(db, "jobs", updatedJobDataFromForm.id);
        await updateDoc(jobDocRef, dataToUpdate);
    } else {
        setMockJobs(prevJobs => prevJobs.map(j => (j.id === updatedJobDataFromForm.id ? { ...originalJob, ...dataToUpdate } as Job : j)));
    }
    setItemToEdit(null); setEditingItemType(null);
    navigateTo(sourceViewForForm || View.Home); setSourceViewForForm(null);
    alert('แก้ไขประกาศงานเรียบร้อยแล้ว');
  };

  const handleUpdateHelperProfile = async (updatedProfileDataFromForm: HelperProfileFormData & { id: string }) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeHelperProfiles = USE_FIREBASE ? helperProfiles : mockHelperProfiles;

    const originalProfile = activeHelperProfiles.find(p => p.id === updatedProfileDataFromForm.id);
    if (!originalProfile) {
      alert('เกิดข้อผิดพลาด: ไม่พบโปรไฟล์เดิม'); return;
    }
    // Ownership check by Firestore rules
    // if (originalProfile.userId !== activeCurrentUser?.id && activeCurrentUser?.role !== UserRole.Admin) {
    //     alert('คุณไม่มีสิทธิ์แก้ไขโปรไฟล์นี้'); return;
    // }
     if (containsBlacklistedWords(updatedProfileDataFromForm.details) || containsBlacklistedWords(updatedProfileDataFromForm.profileTitle)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }
    const contactInfo = activeCurrentUser ? generateContactString(activeCurrentUser) : 'ข้อมูลติดต่อไม่พร้อมใช้งาน';
    const dataToUpdate: Partial<HelperProfile> = {
      ...updatedProfileDataFromForm,
      contact: contactInfo,
    };
     if (USE_FIREBASE) {
        const profileDocRef = doc(db, "helperProfiles", updatedProfileDataFromForm.id);
        await updateDoc(profileDocRef, dataToUpdate);
    } else {
        setMockHelperProfiles(prevProfiles => prevProfiles.map(p => (p.id === updatedProfileDataFromForm.id ? { ...originalProfile, ...dataToUpdate } as HelperProfile : p)));
    }
    setItemToEdit(null); setEditingItemType(null);
    navigateTo(sourceViewForForm || View.Home); setSourceViewForForm(null);
    alert('แก้ไขโปรไฟล์ผู้ช่วยเรียบร้อยแล้ว');
  };

  const handleSubmitJobForm = (formDataFromForm: JobFormData & { id?: string }) => {
    if (containsBlacklistedWords(formDataFromForm.description) || containsBlacklistedWords(formDataFromForm.title)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }
    if (formDataFromForm.id && itemToEdit && editingItemType === 'job') {
      handleUpdateJob(formDataFromForm as JobFormData & { id: string });
    } else {
      handleAddJob(formDataFromForm);
    }
  };

  const handleSubmitHelperProfileForm = (formDataFromForm: HelperProfileFormData & { id?: string }) => {
     if (containsBlacklistedWords(formDataFromForm.details) || containsBlacklistedWords(formDataFromForm.profileTitle)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }
    if (formDataFromForm.id && itemToEdit && editingItemType === 'profile') {
      handleUpdateHelperProfile(formDataFromForm as HelperProfileFormData & { id: string });
    } else {
      handleAddHelperProfile(formDataFromForm);
    }
  };

  const handleCancelEditOrPost = () => {
    const targetView = sourceViewForForm || View.Home;
    setItemToEdit(null); setEditingItemType(null); setSourceViewForForm(null); setSelectedPostId(null);
    navigateTo(targetView);
  };

  const handleAddJob = useCallback(async (newJobData: JobFormData) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!activeCurrentUser) {
      requestLoginForAction(View.PostJob); return;
    }
    if (activeCurrentUser.isMuted) {
        alert("บัญชีของคุณถูกจำกัดการโพสต์"); return;
    }
    if (containsBlacklistedWords(newJobData.description) || containsBlacklistedWords(newJobData.title)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }

    const contactInfo = generateContactString(activeCurrentUser);
    const jobPayload: Omit<Job, 'id'> = {
      ...newJobData,
      ownerId: activeCurrentUser.id, // Added ownerId
      userId: activeCurrentUser.id,
      username: activeCurrentUser.username,
      contact: contactInfo,
      postedAt: USE_FIREBASE ? serverTimestamp() : new Date().toISOString(),
      isSuspicious: false, isPinned: false, isHired: false,
    };

    if (USE_FIREBASE) {
        await addDoc(collection(db, "jobs"), jobPayload);
    } else {
        const newJobWithId: Job = { ...jobPayload, id: Date.now().toString(), postedAt: new Date().toISOString() };
        setMockJobs(prevJobs => [newJobWithId, ...prevJobs]);
    }
    navigateTo(sourceViewForForm === View.MyPosts ? View.MyPosts : View.FindJobs);
    setSourceViewForForm(null);
    alert('ประกาศงานของคุณถูกเพิ่มเรียบร้อยแล้ว!');
  }, [currentUser, mockCurrentUser, sourceViewForForm, navigateTo, requestLoginForAction, USE_FIREBASE]);

  const handleAddHelperProfile = useCallback(async (newProfileData: HelperProfileFormData) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!activeCurrentUser) {
      requestLoginForAction(View.OfferHelp); return;
    }
    if (activeCurrentUser.isMuted) {
        alert("บัญชีของคุณถูกจำกัดการโพสต์"); return;
    }
    if (containsBlacklistedWords(newProfileData.details) || containsBlacklistedWords(newProfileData.profileTitle)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }

    if (!activeCurrentUser.gender || !activeCurrentUser.birthdate || !activeCurrentUser.educationLevel ||
        activeCurrentUser.gender === GenderOption.NotSpecified || activeCurrentUser.educationLevel === HelperEducationLevelOption.NotStated) {
        alert('กรุณาอัปเดตข้อมูลส่วนตัว (เพศ, วันเกิด, ระดับการศึกษา) ในหน้าโปรไฟล์ของคุณก่อนสร้างโปรไฟล์ผู้ช่วย');
        navigateTo(View.UserProfile); return;
    }
    const contactInfo = generateContactString(activeCurrentUser);
    const profilePayload: Omit<HelperProfile, 'id'> = {
      ...newProfileData,
      ownerId: activeCurrentUser.id, // Added ownerId
      userId: activeCurrentUser.id,
      username: activeCurrentUser.username,
      contact: contactInfo,
      gender: activeCurrentUser.gender,
      birthdate: activeCurrentUser.birthdate,
      educationLevel: activeCurrentUser.educationLevel,
      postedAt: USE_FIREBASE ? serverTimestamp() : new Date().toISOString(),
      isSuspicious: false, isPinned: false, isUnavailable: false,
      adminVerifiedExperience: false, interestedCount: 0,
    };
    if (USE_FIREBASE) {
        await addDoc(collection(db, "helperProfiles"), profilePayload);
    } else {
        const newProfileWithId: HelperProfile = { ...profilePayload, id: Date.now().toString(), postedAt: new Date().toISOString() };
        setMockHelperProfiles(prevProfiles => [newProfileWithId, ...prevProfiles]);
    }
    navigateTo(sourceViewForForm === View.MyPosts ? View.MyPosts : View.FindHelpers);
    setSourceViewForForm(null);
    alert('โปรไฟล์ของคุณถูกเพิ่มเรียบร้อยแล้ว!');
  }, [currentUser, mockCurrentUser, sourceViewForForm, navigateTo, requestLoginForAction, USE_FIREBASE]);

  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalTitle(title); setConfirmModalMessage(message);
    setOnConfirmAction(() => onConfirm); setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false); setConfirmModalMessage(''); setConfirmModalTitle(''); setOnConfirmAction(null);
  };

  const handleConfirmDeletion = () => {
    if (onConfirmAction) onConfirmAction();
    closeConfirmModal();
  };

  const handleDeleteItemFromMyPosts = (itemId: string, itemType: 'job' | 'profile' | 'webboardPost') => {
    if (itemType === 'job') handleDeleteJob(itemId);
    else if (itemType === 'profile') handleDeleteHelperProfile(itemId);
    else if (itemType === 'webboardPost') handleDeleteWebboardPost(itemId);
  };

  const handleDeleteJob = (jobId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeJobs = USE_FIREBASE ? jobs : mockJobs;
    const jobToDelete = activeJobs.find(job => job.id === jobId);
    if (!jobToDelete) { alert('เกิดข้อผิดพลาด: ไม่พบประกาศงานที่ต้องการลบในระบบ'); return; }
    // Ownership check by Firestore rules
    // if (jobToDelete.userId !== activeCurrentUser?.id && activeCurrentUser?.role !== UserRole.Admin) {
    //   alert('คุณไม่มีสิทธิ์ลบประกาศงานนี้'); return;
    // }
    openConfirmModal('ยืนยันการลบประกาศงาน', `คุณแน่ใจหรือไม่ว่าต้องการลบประกาศงาน "${jobToDelete.title}"?`, async () => {
      if (USE_FIREBASE) await deleteDoc(doc(db, "jobs", jobId));
      else setMockJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      alert(`ลบประกาศงาน "${jobToDelete.title}" เรียบร้อยแล้ว`);
    });
  };

  const handleDeleteHelperProfile = (profileId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeHelperProfiles = USE_FIREBASE ? helperProfiles : mockHelperProfiles;
    const profileToDelete = activeHelperProfiles.find(profile => profile.id === profileId);
    if (!profileToDelete) { alert('เกิดข้อผิดพลาด: ไม่พบโปรไฟล์ที่ต้องการลบในระบบ'); return; }
    // Ownership check by Firestore rules
    // if (profileToDelete.userId !== activeCurrentUser?.id && activeCurrentUser?.role !== UserRole.Admin) {
    //   alert('คุณไม่มีสิทธิ์ลบโปรไฟล์นี้'); return;
    // }
    openConfirmModal('ยืนยันการลบโปรไฟล์', `คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ "${profileToDelete.profileTitle}"?`, async () => {
      if (USE_FIREBASE) await deleteDoc(doc(db, "helperProfiles", profileId));
      else setMockHelperProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== profileId));
      alert(`ลบโปรไฟล์ "${profileToDelete.profileTitle}" เรียบร้อยแล้ว`);
    });
  };

  const toggleItemField = async (collectionName: string, itemId: string, fieldName: string, currentItems: any[], setItemsFunction: Function) => {
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return;
    const newValue = !item[fieldName];
    if (USE_FIREBASE) {
        await updateDoc(doc(db, collectionName, itemId), { [fieldName]: newValue });
    } else {
        setItemsFunction((prevItems: any[]) => prevItems.map(i => i.id === itemId ? { ...i, [fieldName]: newValue } : i));
    }
  };

  const handleToggleSuspiciousJob = (jobId: string) => toggleItemField("jobs", jobId, "isSuspicious", USE_FIREBASE ? jobs : mockJobs, USE_FIREBASE ? setJobs : setMockJobs);
  const handleToggleSuspiciousHelperProfile = (profileId: string) => toggleItemField("helperProfiles", profileId, "isSuspicious", USE_FIREBASE ? helperProfiles : mockHelperProfiles, USE_FIREBASE ? setHelperProfiles : setMockHelperProfiles);
  const handleTogglePinnedJob = (jobId: string) => toggleItemField("jobs", jobId, "isPinned", USE_FIREBASE ? jobs : mockJobs, USE_FIREBASE ? setJobs : setMockJobs);
  const handleTogglePinnedHelperProfile = (profileId: string) => toggleItemField("helperProfiles", profileId, "isPinned", USE_FIREBASE ? helperProfiles : mockHelperProfiles, USE_FIREBASE ? setHelperProfiles : setMockHelperProfiles);
  const handleToggleVerifiedExperience = (profileId: string) => toggleItemField("helperProfiles", profileId, "adminVerifiedExperience", USE_FIREBASE ? helperProfiles : mockHelperProfiles, USE_FIREBASE ? setHelperProfiles : setMockHelperProfiles);
  
  const handleToggleHiredJobForUserOrAdmin = (jobId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeJobs = USE_FIREBASE ? jobs : mockJobs;
    const jobToToggle = activeJobs.find(j => j.id === jobId);
    if (jobToToggle && (jobToToggle.userId === activeCurrentUser?.id || activeCurrentUser?.role === UserRole.Admin)) {
        toggleItemField("jobs", jobId, "isHired", activeJobs, USE_FIREBASE ? setJobs : setMockJobs);
    } else { alert("คุณไม่มีสิทธิ์เปลี่ยนสถานะงานนี้"); }
  };
  const handleToggleUnavailableHelperProfileForUserOrAdmin = (profileId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeHelperProfiles = USE_FIREBASE ? helperProfiles : mockHelperProfiles;
    const profileToToggle = activeHelperProfiles.find(p => p.id === profileId);
     if (profileToToggle && (profileToToggle.userId === activeCurrentUser?.id || activeCurrentUser?.role === UserRole.Admin)) {
        toggleItemField("helperProfiles", profileId, "isUnavailable", activeHelperProfiles, USE_FIREBASE ? setHelperProfiles : setMockHelperProfiles);
    } else { alert("คุณไม่มีสิทธิ์เปลี่ยนสถานะโปรไฟล์นี้"); }
  };

  const handleToggleItemStatusFromMyPosts = (itemId: string, itemType: 'job' | 'profile' | 'webboardPost') => {
    if (itemType === 'job') handleToggleHiredJobForUserOrAdmin(itemId);
    else if (itemType === 'profile') handleToggleUnavailableHelperProfileForUserOrAdmin(itemId);
  };

  const handleLogHelperContactInteraction = async (helperProfileId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeHelperProfiles = USE_FIREBASE ? helperProfiles : mockHelperProfiles;

    if (!activeCurrentUser) {
      requestLoginForAction(View.FindHelpers, { intent: 'contactHelper', postId: helperProfileId }); return;
    }
    const helperProfile = activeHelperProfiles.find(hp => hp.id === helperProfileId);
    if (!helperProfile) { console.warn(`Helper profile ${helperProfileId} not found.`); return; }
    if (activeCurrentUser.id === helperProfile.userId) return;

    const newInteractionData: Omit<Interaction, 'interactionId'> = { // interactionId will be Firestore doc ID
        helperUserId: helperProfile.userId, 
        employerUserId: activeCurrentUser.id,
        timestamp: USE_FIREBASE ? serverTimestamp() : new Date().toISOString(),
        type: 'contact_helper',
    };

    if (USE_FIREBASE) {
        // Check if interaction already exists (optional, depends on desired logic)
        // For simplicity, we increment count and add interaction log.
        await updateDoc(doc(db, "helperProfiles", helperProfileId), {
            interestedCount: (helperProfile.interestedCount || 0) + 1
        });
        await addDoc(collection(db, "interactions"), newInteractionData);
    } else {
        let clickedMap: { [userId: string]: string[] } = {};
        const savedClickedMap = localStorage.getItem(USER_CLICKED_HELPERS_LS_KEY);
        if (savedClickedMap) {
            try { clickedMap = JSON.parse(savedClickedMap); } catch (e) { console.error("Error parsing clicked map", e); }
        }
        const userClickedList = clickedMap[activeCurrentUser.id] || [];
        if (!userClickedList.includes(helperProfileId)) {
            setMockHelperProfiles(prevProfiles =>
                prevProfiles.map(hp => hp.id === helperProfileId ? { ...hp, interestedCount: (hp.interestedCount || 0) + 1 } : hp)
            );
            clickedMap[activeCurrentUser.id] = [...userClickedList, helperProfileId];
            localStorage.setItem(USER_CLICKED_HELPERS_LS_KEY, JSON.stringify(clickedMap));
            const newMockInteraction: Interaction = { ...newInteractionData, interactionId: Date.now().toString(), timestamp: new Date().toISOString() };
            setMockInteractions(prev => [...prev, newMockInteraction]);
        }
    }
  };

  const handleAddOrUpdateWebboardPost = async (postData: { title: string; body: string; image?: string; imageFile?: File }, postIdToUpdate?: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!activeCurrentUser) {
      requestLoginForAction(View.Webboard, { action: postIdToUpdate ? 'editPost' : 'createPost', postId: postIdToUpdate }); return;
    }
    if (activeCurrentUser.isMuted) {
        alert("บัญชีของคุณถูกจำกัดการโพสต์"); return;
    }
    if (containsBlacklistedWords(postData.title) || containsBlacklistedWords(postData.body)) {
        alert('เนื้อหาหรือหัวข้อมีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }

    let finalImageURL = postData.image || ''; // Keep existing image if not changed or no new file
    
    if (USE_FIREBASE) {
        if (postData.imageFile) {
            const imageName = `webboardImages/${activeCurrentUser.id}/${Date.now()}_${postData.imageFile.name}`;
            const storageRefImg = ref(storage, imageName);
            const uploadTask = uploadBytesResumable(storageRefImg, postData.imageFile);
            await new Promise<void>((resolve, reject) => {
                uploadTask.on('state_changed', 
                    null, 
                    (error) => { console.error("Image upload failed:", error); reject(error); }, 
                    async () => {
                        finalImageURL = await getDownloadURL(uploadTask.snapshot.ref);
                        // If editing and there was an old image, delete it
                        if (postIdToUpdate) {
                            const oldPost = webboardPosts.find(p => p.id === postIdToUpdate);
                            if (oldPost?.image && oldPost.image.includes('firebasestorage') && oldPost.image !== finalImageURL) {
                                try { await deleteObject(ref(storage, oldPost.image)); } catch (e) { console.warn("Old webboard image deletion failed", e); }
                            }
                        }
                        resolve();
                    }
                );
            });
        } else if (postData.image === undefined && postIdToUpdate) { // Image explicitly removed
             finalImageURL = '';
             const oldPost = webboardPosts.find(p => p.id === postIdToUpdate);
             if (oldPost?.image && oldPost.image.includes('firebasestorage')) {
                try { await deleteObject(ref(storage, oldPost.image)); } catch (e) { console.warn("Webboard image deletion failed", e); }
             }
        }

        const payload = { 
            title: postData.title, 
            body: postData.body, 
            image: finalImageURL, 
            updatedAt: serverTimestamp(),
            authorPhoto: activeCurrentUser.photo || '', // Update authorPhoto on edit too
        };

        if (postIdToUpdate) {
            const postToEdit = webboardPosts.find(p => p.id === postIdToUpdate);
            if (!postToEdit) { alert('ไม่พบโพสต์ที่ต้องการแก้ไข'); return; }
            // Ownership/role check by Firestore rules
            // if (postToEdit.userId !== activeCurrentUser.id && activeCurrentUser.role !== UserRole.Admin && activeCurrentUser.role !== UserRole.Moderator) {
            //     alert('คุณไม่มีสิทธิ์แก้ไขโพสต์นี้'); return;
            // }
            await updateDoc(doc(db, "webboardPosts", postIdToUpdate), payload);
            alert('แก้ไขโพสต์เรียบร้อยแล้ว!');
        } else {
            const newPostPayload: Omit<WebboardPost, 'id'> = {
                ...payload,
                ownerId: activeCurrentUser.id, // Added ownerId
                userId: activeCurrentUser.id,
                username: activeCurrentUser.username,
                createdAt: serverTimestamp(),
                likes: [],
                isPinned: false,
            };
            const newDocRef = await addDoc(collection(db, "webboardPosts"), newPostPayload);
            postIdToUpdate = newDocRef.id; // Get new ID for navigation
            alert('สร้างโพสต์ใหม่เรียบร้อยแล้ว!');
        }

    } else { // Mock logic
        if (postIdToUpdate) {
            const postToEdit = mockWebboardPosts.find(p => p.id === postIdToUpdate);
            if (!postToEdit) { alert('ไม่พบโพสต์ที่ต้องการแก้ไข'); return; }
            if (postToEdit.userId !== activeCurrentUser.id && activeCurrentUser.role !== UserRole.Admin && activeCurrentUser.role !== UserRole.Moderator) {
                alert('คุณไม่มีสิทธิ์แก้ไขโพสต์นี้'); return;
            }
            setMockWebboardPosts(prevPosts =>
                prevPosts.map(p => p.id === postIdToUpdate ? { ...p, title: postData.title, body: postData.body, image: postData.image, authorPhoto: activeCurrentUser.photo, updatedAt: new Date().toISOString(), isEditing: false } : p)
            );
            alert('แก้ไขโพสต์เรียบร้อยแล้ว!');
        } else {
            const newPost: WebboardPost = {
                id: Date.now().toString(),
                ownerId: activeCurrentUser.id, // Added ownerId
                title: postData.title, body: postData.body, image: postData.image,
                userId: activeCurrentUser.id, username: activeCurrentUser.username, authorPhoto: activeCurrentUser.photo,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                likes: [], isPinned: false,
            };
            setMockWebboardPosts(prev => [newPost, ...prev]);
            postIdToUpdate = newPost.id; // Get new ID for navigation
            alert('สร้างโพสต์ใหม่เรียบร้อยแล้ว!');
        }
    }
    setItemToEdit(null); setEditingItemType(null);
    setSelectedPostId(postIdToUpdate || null); 
    navigateTo(View.Webboard, postIdToUpdate); 
  };

  const handleAddWebboardComment = async (postId: string, text: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!activeCurrentUser) {
      requestLoginForAction(View.Webboard, { action: 'comment', postId: postId }); return;
    }
    if (activeCurrentUser.isMuted) {
        alert("บัญชีของคุณถูกจำกัดการโพสต์"); return;
    }
    if (containsBlacklistedWords(text)) {
        alert('เนื้อหาคอมเมนต์มีคำที่ไม่เหมาะสม โปรดแก้ไข'); return;
    }
    const commentPayload: Omit<WebboardComment, 'id'> = {
      postId,
      ownerId: activeCurrentUser.id, // Added ownerId
      userId: activeCurrentUser.id,
      username: activeCurrentUser.username,
      authorPhoto: activeCurrentUser.photo || '',
      text,
      createdAt: USE_FIREBASE ? serverTimestamp() : new Date().toISOString(),
      updatedAt: USE_FIREBASE ? serverTimestamp() : new Date().toISOString(),
    };
    if (USE_FIREBASE) {
        await addDoc(collection(db, "webboardComments"), commentPayload);
    } else {
        const newMockComment: WebboardComment = { ...commentPayload, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setMockWebboardComments(prev => [...prev, newMockComment]);
    }
  };

  const handleToggleWebboardPostLike = async (postId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activePosts = USE_FIREBASE ? webboardPosts : mockWebboardPosts;

    if (!activeCurrentUser) {
      requestLoginForAction(View.Webboard, { action: 'like', postId: postId }); return;
    }
    const postRef = USE_FIREBASE ? doc(db, "webboardPosts", postId) : null;
    const post = activePosts.find(p => p.id === postId);
    if (!post) return;

    const alreadyLiked = post.likes.includes(activeCurrentUser.id);
    let newLikesArray;
    if (alreadyLiked) {
      newLikesArray = post.likes.filter(uid => uid !== activeCurrentUser.id);
    } else {
      newLikesArray = [...post.likes, activeCurrentUser.id];
    }

    if (USE_FIREBASE && postRef) {
        await updateDoc(postRef, { likes: newLikesArray });
    } else {
        setMockWebboardPosts(prevPosts =>
            prevPosts.map(p => p.id === postId ? { ...p, likes: newLikesArray } : p)
        );
    }
  };

  const handleDeleteWebboardPost = (postIdToDelete: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activePosts = USE_FIREBASE ? webboardPosts : mockWebboardPosts;
    const postToDelete = activePosts.find(p => p.id === postIdToDelete);
    if (!postToDelete) return;

    // Ownership/role check by Firestore rules
    // let canDelete = false;
    // if (activeCurrentUser?.role === UserRole.Admin) canDelete = true;
    // else if (activeCurrentUser?.role === UserRole.Moderator) {
    //     const postAuthor = (USE_FIREBASE ? users : mockUsers).find(u => u.id === postToDelete.userId);
    //     if (postAuthor?.role !== UserRole.Admin) canDelete = true;
    //     else { alert("ผู้ตรวจการไม่สามารถลบโพสต์ของแอดมินได้"); return; }
    // } else if (postToDelete.userId === activeCurrentUser?.id) canDelete = true;

    // if (canDelete) {
       openConfirmModal('ยืนยันการลบโพสต์', `คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์ "${postToDelete.title}"?`, async () => {
            if (USE_FIREBASE) {
                await deleteDoc(doc(db, "webboardPosts", postIdToDelete));
                // Also delete associated comments (could be a batched write or cloud function)
                const commentsQueryToDelete = query(collection(db, "webboardComments"), where("postId", "==", postIdToDelete));
                const commentSnapshots = await getDocs(commentsQueryToDelete); 
                const batch = writeBatch(db); 
                commentSnapshots.forEach(docSnap => batch.delete(docSnap.ref));
                await batch.commit();
            } else {
                setMockWebboardPosts(prev => prev.filter(p => p.id !== postIdToDelete));
                setMockWebboardComments(prev => prev.filter(c => c.postId !== postIdToDelete));
            }
            alert(`ลบโพสต์ "${postToDelete.title}" เรียบร้อยแล้ว`);
            if (selectedPostId === postIdToDelete) {
                setSelectedPostId(null); navigateTo(View.Webboard);
            }
        });
    // } else { alert("คุณไม่มีสิทธิ์ลบโพสต์นี้"); }
  };

  const handlePinWebboardPost = async (postId: string) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (activeCurrentUser?.role !== UserRole.Admin) {
        alert("เฉพาะแอดมินเท่านั้นที่สามารถปักหมุดโพสต์ได้"); return;
    }
    const activePosts = USE_FIREBASE ? webboardPosts : mockWebboardPosts;
    const post = activePosts.find(p => p.id === postId);
    if (!post) return;
    const newPinnedStatus = !post.isPinned;

    if (USE_FIREBASE) {
        await updateDoc(doc(db, "webboardPosts", postId), { isPinned: newPinnedStatus });
    } else {
        setMockWebboardPosts(prevPosts =>
            prevPosts.map(p => p.id === postId ? { ...p, isPinned: newPinnedStatus } : p)
        );
    }
  };

  const handleSetUserRole = async (userIdToUpdate: string, newRole: UserRole) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const activeUsers = USE_FIREBASE ? users : mockUsers;

    if (activeCurrentUser?.role !== UserRole.Admin) {
      alert("คุณไม่มีสิทธิ์เปลี่ยนบทบาทผู้ใช้"); return;
    }
    if (userIdToUpdate === activeCurrentUser.id) {
        alert("ไม่สามารถเปลี่ยนบทบาทของตัวเองได้"); return;
    }
    const userToUpdate = activeUsers.find(u => u.id === userIdToUpdate);
    if (userToUpdate && userToUpdate.role === UserRole.Admin && newRole !== UserRole.Admin) {
        alert("ไม่สามารถเปลี่ยนบทบาทของ Admin หลักได้"); return;
    }
    if (USE_FIREBASE) {
        await updateDoc(doc(db, "users", userIdToUpdate), { role: newRole, isAdmin: newRole === UserRole.Admin });
    } else {
        setMockUsers(prevUsers =>
            prevUsers.map(u => u.id === userIdToUpdate ? { ...u, role: newRole, isAdmin: newRole === UserRole.Admin } : u)
        );
    }
    alert(`อัปเดตบทบาทของผู้ใช้ @${activeUsers.find(u=>u.id===userIdToUpdate)?.username} เป็น ${newRole} เรียบร้อยแล้ว`);
  };

  const handleToggleSiteLock = async () => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (activeCurrentUser?.role !== UserRole.Admin) {
      alert("คุณไม่มีสิทธิ์ดำเนินการนี้"); return;
    }
    const newLockStatus = USE_FIREBASE ? !isSiteLocked : !mockIsSiteLocked;
    if (USE_FIREBASE) {
        await setDoc(doc(db, "config", "siteStatus"), { isSiteLocked: newLockStatus }, { merge: true }); // Changed to siteStatus
    } else {
        setMockIsSiteLocked(newLockStatus);
    }
  };

  const handleFeedbackSubmit = async (feedbackText: string): Promise<boolean> => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    if (!feedbackText.trim()) {
        setFeedbackSubmissionStatus('error'); setFeedbackSubmissionMessage('กรุณาใส่ความคิดเห็นของคุณ'); return false;
    }
    setFeedbackSubmissionStatus('submitting'); setFeedbackSubmissionMessage(null);
    try {
        // Using Formspree as before, no change needed for USE_FIREBASE toggle here
        const response = await fetch('https://formspree.io/f/xvgaepzq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                feedback: feedbackText, page: currentView, timestamp: new Date().toISOString(),
                userId: activeCurrentUser?.id || 'anonymous', username: activeCurrentUser?.username || 'anonymous',
                userAgent: navigator.userAgent,
            })
        });
        if (response.ok) {
            setFeedbackSubmissionStatus('success'); setFeedbackSubmissionMessage('ขอบคุณสำหรับความคิดเห็นของคุณ!');
            setIsFeedbackModalOpen(false);
            setTimeout(() => { setFeedbackSubmissionStatus('idle'); setFeedbackSubmissionMessage(null); }, 4000);
            return true;
        } else {
            const errorData = await response.json();
            console.error('Formspree error:', errorData);
            const errorMessage = errorData.errors?.map((e: { message: string }) => e.message).join(', ') || 'เกิดข้อผิดพลาดในการส่ง';
            setFeedbackSubmissionStatus('error');
            setFeedbackSubmissionMessage(`เกิดข้อผิดพลาด: ${errorMessage}. โปรดลองอีกครั้ง`);
            return false;
        }
    } catch (error) {
        console.error('Feedback submission network error:', error);
        setFeedbackSubmissionStatus('error');
        setFeedbackSubmissionMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง');
        return false;
    }
  };


  useEffect(() => {
    if (!USE_FIREBASE) {
        saveMockData();
    }
  }, [mockUsers, mockJobs, mockHelperProfiles, mockCurrentUser, mockInteractions, mockWebboardPosts, mockWebboardComments, mockIsSiteLocked, USE_FIREBASE]);
  
  
  const Header = () => (
    <header className="bg-headerBlue dark:bg-dark-headerBg shadow-md sticky top-0 z-40 font-sans">
      <nav className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <button onClick={() => navigateTo(View.Home)} className="text-xl sm:text-2xl font-bold text-primary dark:text-dark-primary-hover hover:opacity-80 transition-opacity">
            ✨ หาจ๊อบจ้า ✨
          </button>
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
            <NavLinks />
            <ThemeToggleButton />
          </div>
          <div className="md:hidden flex items-center">
            <ThemeToggleButton />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-2 p-2 rounded-md text-neutral-dark dark:text-dark-text hover:bg-primary/30 dark:hover:bg-dark-primary/30 focus:outline-none"
              aria-label="เมนู"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-primary/30 dark:border-dark-primary/30">
            <div className="flex flex-col space-y-2">
              <NavLinks isMobile={true} />
            </div>
          </div>
        )}
      </nav>
    </header>
  );

  const NavLinks: React.FC<{isMobile?: boolean}> = ({isMobile = false}) => {
    const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
    const navButtonClass = isMobile 
      ? "block w-full text-left px-3 py-2 rounded-md text-base font-medium" 
      : "px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-sm sm:text-base font-medium";
    const activeClass = "bg-primary/30 dark:bg-dark-primary/40 text-neutral-dark dark:text-dark-text";
    const inactiveClass = "hover:bg-primary/20 dark:hover:bg-dark-primary/20 text-neutral-dark dark:text-dark-textMuted";

    const commonLinks = [
      { view: View.Home, label: "🏠 หน้าหลัก" },
      { view: View.FindJobs, label: "🔍 หาคนช่วยงาน (ผู้ว่าจ้าง)" },
      { view: View.FindHelpers, label: "🙋‍♀️ หาคนรับงาน (ผู้ช่วย)" },
      { view: View.Webboard, label: "💬 กระทู้พูดคุย" },
      { view: View.AboutUs, label: "✨ เกี่ยวกับเรา" },
      { view: View.Safety, label: "🛡️ เพื่อความปลอดภัย" },
    ];

    const userSpecificLinks = activeCurrentUser
      ? [
          { view: View.PostJob, label: "📢 ประกาศหางาน" },
          { view: View.OfferHelp, label: "🙋‍♂️ เสนอตัวช่วยงาน" },
          { view: View.MyPosts, label: "📁 โพสต์ของฉัน" },
          { view: View.UserProfile, label: `👤 โปรไฟล์ (${activeCurrentUser.username})` },
          ...(activeCurrentUser.role === UserRole.Admin
            ? [{ view: View.AdminDashboard, label: "🔐 แอดมิน" }]
            : []),
        ]
      : [];

    return (
      <>
        {commonLinks.map(link => (
          <button
            key={link.view}
            onClick={() => navigateTo(link.view)}
            className={`${navButtonClass} ${currentView === link.view ? activeClass : inactiveClass}`}
            aria-current={currentView === link.view ? 'page' : undefined}
          >
            {link.label}
          </button>
        ))}
        {activeCurrentUser && userSpecificLinks.map(link => (
             <button
                key={link.view}
                onClick={() => navigateTo(link.view)}
                className={`${navButtonClass} ${currentView === link.view ? activeClass : inactiveClass}`}
                aria-current={currentView === link.view ? 'page' : undefined}
            >
                {link.label}
            </button>
        ))}
        {activeCurrentUser ? (
          <Button
            onClick={handleLogout}
            variant={isMobile ? 'outline' : 'accent'}
            colorScheme="accent"
            size={isMobile ? 'md' : 'sm'}
            className={isMobile ? 'w-full mt-2' : ''}
          >
            🚪 ออกจากระบบ
          </Button>
        ) : (
          <Button
            onClick={() => navigateTo(View.Login)}
            variant={isMobile ? 'login' : "primary"}
            size={isMobile ? 'md' : 'sm'}
            className={isMobile ? 'w-full mt-2' : ''}
          >
            🔑 เข้าสู่ระบบ/ลงทะเบียน
          </Button>
        )}
        {!isMobile && (
          <Button
            onClick={() => setIsFeedbackModalOpen(true)}
            variant="outline"
            colorScheme="neutral"
            size="sm"
            className="!px-2 !py-1 text-xs"
            title="ส่งความคิดเห็น"
          >
            💬
          </Button>
        )}
        {isMobile && (
           <Button
            onClick={() => { setIsFeedbackModalOpen(true); setIsMobileMenuOpen(false);}}
            variant="outline"
            colorScheme="neutral"
            size="md"
            className='w-full mt-2'
          >
            💬 ส่งความคิดเห็นถึงเรา
          </Button>
        )}
      </>
    );
  };

  const ThemeToggleButton = () => (
    <button
      onClick={toggleTheme}
      className="p-1.5 sm:p-2 rounded-full hover:bg-accent/30 dark:hover:bg-dark-accent/30 text-neutral-dark dark:text-dark-text focus:outline-none"
      aria-label={`เปลี่ยนเป็นธีม${theme === 'light' ? 'มืด' : 'สว่าง'}`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
  
  const Footer = () => (
    <footer className="bg-neutral-light dark:bg-dark-cardBg text-center p-4 mt-auto border-t border-neutral-DEFAULT dark:border-dark-border">
      <p className="text-xs font-sans text-neutral-medium dark:text-dark-textMuted">
        &copy; {new Date().getFullYear()} ✨ หาจ๊อบจ้า ✨ - งานด่วน หางานเชียงใหม่. All rights reserved.
      </p>
    </footer>
  );
  
  const activeCurrentUser = USE_FIREBASE ? currentUser : mockCurrentUser;
  const effectiveIsSiteLocked = USE_FIREBASE ? isSiteLocked : mockIsSiteLocked;

  if (isLoading && USE_FIREBASE) {
    return (
      <div className="fixed inset-0 bg-neutral-light dark:bg-dark-pageBg flex flex-col justify-center items-center z-[10000]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary dark:border-dark-primary mb-4"></div>
        <p className="text-lg font-sans text-neutral-dark dark:text-dark-text">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }
  
  if (effectiveIsSiteLocked && activeCurrentUser?.role !== UserRole.Admin) {
    return <SiteLockOverlay />;
  }


  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-2 py-4 sm:px-4 sm:py-6">
        {currentView === View.Home && (
          <div className="text-center p-6 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 dark:from-dark-primary/20 dark:via-dark-secondary/10 dark:to-dark-accent/20 rounded-xl shadow-lg border border-neutral-DEFAULT/30 dark:border-dark-border/30">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-dark dark:text-dark-text mb-4">ยินดีต้อนรับสู่ ✨ หาจ๊อบจ้า ✨</h1>
            <p className="text-md sm:text-lg text-neutral-medium dark:text-dark-textMuted mb-8">
              แพลตฟอร์มสำหรับหางานด่วน งานพาร์ทไทม์ และหาคนช่วยงานในเชียงใหม่
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Button onClick={() => navigateTo(View.FindJobs)} variant="primary" size="lg" className="w-full shadow-xl hover:scale-105 transform transition-transform">
                🔍 ฉันกำลังหาคนช่วยงาน
              </Button>
              <Button onClick={() => navigateTo(View.FindHelpers)} variant="secondary" size="lg" className="w-full shadow-xl hover:scale-105 transform transition-transform">
                🙋‍♀️ ฉันพร้อมรับงาน/เสนอตัวช่วย
              </Button>
            </div>
             <div className="mt-8">
                <Button onClick={() => navigateTo(View.Webboard)} variant="accent" size="md" className="w-full sm:w-auto shadow-lg hover:scale-105 transform transition-transform">
                    💬 ไปที่กระทู้พูดคุย
                </Button>
            </div>
          </div>
        )}
        {currentView === View.PostJob && (
          <PostJobForm 
            onSubmitJob={handleSubmitJobForm} 
            onCancel={handleCancelEditOrPost} 
            initialData={editingItemType === 'job' ? itemToEdit as Job : undefined}
            isEditing={editingItemType === 'job' && !!itemToEdit}
          />
        )}
        {currentView === View.OfferHelp && (
          <OfferHelpForm 
            onSubmitProfile={handleSubmitHelperProfileForm} 
            onCancel={handleCancelEditOrPost}
            initialData={editingItemType === 'profile' ? itemToEdit as HelperProfile : undefined}
            isEditing={editingItemType === 'profile' && !!itemToEdit}
          />
        )}
        {currentView === View.FindJobs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(USE_FIREBASE ? jobs : mockJobs).map(job => (
                <JobCard 
                    key={job.id} 
                    job={job} 
                    navigateTo={navigateTo}
                    currentUser={activeCurrentUser}
                    requestLoginForAction={requestLoginForAction}
                />
            ))}
            {(USE_FIREBASE ? jobs : mockJobs).length === 0 && <p className="col-span-full text-center text-neutral-medium dark:text-dark-textMuted">ยังไม่มีประกาศงานในระบบ</p>}
            </div>
        )}
        {currentView === View.FindHelpers && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(USE_FIREBASE ? helperProfiles : mockHelperProfiles).map(profile => {
                 const user = (USE_FIREBASE ? users : mockUsers).find(u => u.id === profile.userId);
                 const enrichedProfile: EnrichedHelperProfile = {
                    ...profile,
                    userPhoto: user?.photo,
                    userAddress: user?.address,
                    userDisplayName: user?.displayName || profile.username,
                    profileCompleteBadge: user ? checkProfileCompleteness(user) : false,
                    warningBadge: profile.isSuspicious || false,
                    verifiedExperienceBadge: profile.adminVerifiedExperience || false,
                 };
                return (
                    <HelperCard 
                        key={profile.id} 
                        profile={enrichedProfile} 
                        onNavigateToPublicProfile={handleNavigateToPublicProfile}
                        navigateTo={navigateTo}
                        onLogHelperContact={handleLogHelperContactInteraction}
                        currentUser={activeCurrentUser}
                        requestLoginForAction={requestLoginForAction}
                    />
                );
            })}
            {(USE_FIREBASE ? helperProfiles : mockHelperProfiles).length === 0 && <p className="col-span-full text-center text-neutral-medium dark:text-dark-textMuted">ยังไม่มีโปรไฟล์ผู้ช่วยในระบบ</p>}
            </div>
        )}
        {currentView === View.Login && <LoginForm onLogin={handleLogin} onSwitchToRegister={() => navigateTo(View.Register)} />}
        {currentView === View.Register && <RegistrationForm onRegister={handleRegister} onSwitchToLogin={() => navigateTo(View.Login)} />}
        {currentView === View.AdminDashboard && activeCurrentUser?.role === UserRole.Admin && (
            <AdminDashboard
                jobs={USE_FIREBASE ? jobs : mockJobs}
                helperProfiles={USE_FIREBASE ? helperProfiles : mockHelperProfiles}
                users={USE_FIREBASE ? users : mockUsers}
                interactions={USE_FIREBASE ? interactions : mockInteractions}
                webboardPosts={USE_FIREBASE ? webboardPosts : mockWebboardPosts}
                webboardComments={USE_FIREBASE ? webboardComments : mockWebboardComments}
                onDeleteJob={handleDeleteJob}
                onDeleteHelperProfile={handleDeleteHelperProfile}
                onToggleSuspiciousJob={handleToggleSuspiciousJob}
                onToggleSuspiciousHelperProfile={handleToggleSuspiciousHelperProfile}
                onTogglePinnedJob={handleTogglePinnedJob}
                onTogglePinnedHelperProfile={handleTogglePinnedHelperProfile}
                onToggleHiredJob={handleToggleHiredJobForUserOrAdmin}
                onToggleUnavailableHelperProfile={handleToggleUnavailableHelperProfileForUserOrAdmin}
                onToggleVerifiedExperience={handleToggleVerifiedExperience}
                onDeleteWebboardPost={handleDeleteWebboardPost}
                onPinWebboardPost={handlePinWebboardPost}
                onStartEditItem={handleStartEditItemFromAdmin}
                onSetUserRole={handleSetUserRole}
                currentUser={activeCurrentUser}
                isSiteLocked={USE_FIREBASE ? isSiteLocked : mockIsSiteLocked}
                onToggleSiteLock={handleToggleSiteLock}
            />
        )}
        {currentView === View.MyPosts && activeCurrentUser && (
          <MyPostsPage 
            currentUser={activeCurrentUser}
            jobs={USE_FIREBASE ? jobs : mockJobs}
            helperProfiles={USE_FIREBASE ? helperProfiles : mockHelperProfiles}
            webboardPosts={USE_FIREBASE ? webboardPosts : mockWebboardPosts}
            webboardComments={USE_FIREBASE ? webboardComments : mockWebboardComments}
            onEditItem={handleStartEditMyItem}
            onDeleteItem={handleDeleteItemFromMyPosts}
            onToggleHiredStatus={handleToggleItemStatusFromMyPosts}
            navigateTo={navigateTo}
            getUserDisplayBadge={(user, posts, comments) => getUserDisplayBadge(user, posts, comments)}
          />
        )}
        {currentView === View.UserProfile && activeCurrentUser && (
          <UserProfilePage 
            currentUser={activeCurrentUser} 
            onUpdateProfile={handleUpdateUserProfile} 
            onCancel={() => navigateTo(View.Home)} 
          />
        )}
        {currentView === View.AboutUs && <AboutUsPage />}
        {currentView === View.Safety && <SafetyPage />}
        {currentView === View.PublicProfile && viewingProfileId && (
            (() => {
                const userToView = (USE_FIREBASE ? users : mockUsers).find(u => u.id === viewingProfileId);
                const helperProfileForUser = (USE_FIREBASE ? helperProfiles : mockHelperProfiles).find(hp => hp.userId === viewingProfileId);
                if (userToView) {
                    return (
                        <PublicProfilePage 
                            user={userToView} 
                            helperProfile={helperProfileForUser} 
                            onBack={() => navigateTo(View.FindHelpers)}
                            currentUser={activeCurrentUser}
                        />
                    );
                }
                return <p className="text-center text-neutral-medium dark:text-dark-textMuted">ไม่พบโปรไฟล์ผู้ใช้</p>;
            })()
        )}
        {currentView === View.Webboard && (
           <WebboardPage
                currentUser={activeCurrentUser}
                users={USE_FIREBASE ? users : mockUsers}
                posts={USE_FIREBASE ? webboardPosts : mockWebboardPosts}
                comments={USE_FIREBASE ? webboardComments : mockWebboardComments}
                onAddOrUpdatePost={handleAddOrUpdateWebboardPost}
                onAddComment={handleAddWebboardComment}
                onToggleLike={handleToggleWebboardPostLike}
                onDeletePost={handleDeleteWebboardPost}
                onPinPost={handlePinWebboardPost}
                onEditPost={(postToEdit) => { 
                    setItemToEdit({ ...postToEdit, isEditing: true }); 
                    setEditingItemType('webboardPost');
                    setSelectedPostId('create'); // This will open the modal
                }}
                selectedPostId={selectedPostId}
                setSelectedPostId={setSelectedPostId}
                navigateTo={navigateTo}
                editingPost={editingItemType === 'webboardPost' ? itemToEdit as WebboardPost : undefined}
                onCancelEdit={() => { setItemToEdit(null); setEditingItemType(null); }}
                getUserDisplayBadge={(user, posts, comments) => getUserDisplayBadge(user, posts, comments)}
                requestLoginForAction={requestLoginForAction}
           />
        )}

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
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        submissionStatus={feedbackSubmissionStatus}
        submissionMessage={feedbackSubmissionMessage}
      />
      <Footer />
    </>
  );
};

export default App;
