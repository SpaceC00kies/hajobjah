

export interface Job {
  id: string;
  title: string;
  location: string;
  dateTime: string; // Existing general date/time text field
  payment: string;
  contact: string;
  description: string;
  desiredAgeStart?: number;
  desiredAgeEnd?: number;
  preferredGender?: 'ชาย' | 'หญิง' | 'ไม่จำกัด';
  desiredEducationLevel?: JobDesiredEducationLevelOption;
  dateNeededFrom?: string; // YYYY-MM-DD
  dateNeededTo?: string; // YYYY-MM-DD (optional)
  timeNeededStart?: string; // HH:MM
  timeNeededEnd?: string; // HH:MM
  postedAt?: string; // ISO date string
  userId: string; // ID of the user who posted this job
  ownerId?: string; // ID of the user who owns this doc (for security rules)
  username: string; // Username of the user who posted this job
  isSuspicious?: boolean; // For admin marking
  isPinned?: boolean; // For admin pinning
  isHired?: boolean; // For admin marking as hired/closed
}

export enum GenderOption {
  Male = 'ชาย',
  Female = 'หญิง',
  Other = 'อื่น ๆ / เพศทางเลือก',
  NotSpecified = 'ไม่ระบุ',
}

export enum JobDesiredEducationLevelOption {
  Any = 'ไม่จำกัด',
  MiddleSchool = 'ม.ต้น',
  HighSchool = 'ม.ปลาย',
  Vocational = 'ปวช./ปวส.',
  Bachelor = 'ปริญญาตรี',
  Higher = 'สูงกว่าปริญญาตรี',
}

export enum HelperEducationLevelOption {
  NotStated = 'ไม่ได้ระบุ',
  MiddleSchool = 'ม.ต้น',
  HighSchool = 'ม.ปลาย',
  Vocational = 'ปวช./ปวس.',
  Bachelor = 'ปริญญาตรี',
  Higher = 'สูงกว่าปริญญาตรี',
}

export interface HelperProfile {
  id: string;
  profileTitle: string;
  details: string;
  area: string;
  availability: string; // Existing general availability text field
  contact: string;
  gender?: GenderOption; // Snapshot from User profile
  birthdate?: string; // Store as YYYY-MM-DD string, Snapshot from User profile
  educationLevel?: HelperEducationLevelOption; // Snapshot from User profile
  availabilityDateFrom?: string; // YYYY-MM-DD
  availabilityDateTo?: string; // YYYY-MM-DD
  availabilityTimeDetails?: string; // Free text for specific recurring times/days
  postedAt?: string; // ISO date string
  userId: string; // ID of the user who created this profile
  ownerId?: string; // ID of the user who owns this doc (for security rules)
  username: string; // Username of the user who created this profile
  isSuspicious?: boolean; // For admin marking (Used for Badge 4: Warning Badge 🔺)
  isPinned?: boolean; // For admin pinning
  isUnavailable?: boolean; // For admin marking as unavailable/closed
  adminVerifiedExperience?: boolean; // Badge 1: "ผ่านงานมาก่อน" ⭐ (Admin-set)
  interestedCount?: number; // New: To count how many users clicked "สนใจผู้ช่วยนี้"
}

export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  Member = 'Member',
}

export interface User {
  id: string;
  displayName: string;      // ชื่อ (Display Name)
  username: string;         // ชื่อผู้ใช้ (Unique)
  email: string;            // อีเมล (Unique)
  hashedPassword: string;   // IMPORTANT: For demonstration, this will be plain text.
                            // IN A REAL APP, NEVER STORE PLAIN TEXT PASSWORDS.
                            // Always use strong hashing algorithms (e.g., bcrypt, Argon2).
  isAdmin?: boolean;        // Flag for admin users - will be derived from role
  role: UserRole;           // New role property
  mobile: string;           // เบอร์โทรศัพท์ (Required)
  lineId?: string;          // LINE ID (Optional)
  facebook?: string;        // Facebook (URL or username) (Optional)
  gender?: GenderOption;
  birthdate?: string; // YYYY-MM-DD
  educationLevel?: HelperEducationLevelOption;
  photo?: string; // Base64 string for profile photo
  address?: string; // User's address

  // Personality fields
  favoriteMusic?: string;
  favoriteBook?: string;
  favoriteMovie?: string;
  hobbies?: string;
  favoriteFood?: string;
  dislikedThing?: string;
  introSentence?: string;

  // Badge-related fields
  profileComplete?: boolean;     // Badge 2: "โปรไฟล์ครบถ้วน" 🟢 (Auto-calculated)
  userLevel: UserLevel; // Store calculated user level for Members
  isMuted?: boolean; // For admin to mute user from posting
  isFrozen?: boolean; // For admin to freeze/ban user account
}

export enum View {
  Home = 'HOME',
  PostJob = 'POST_JOB',
  FindJobs = 'FIND_JOBS',
  OfferHelp = 'OFFER_HELP',
  FindHelpers = 'FIND_HELPERS',
  Login = 'LOGIN',
  Register = 'REGISTER',
  AdminDashboard = 'ADMIN_DASHBOARD',
  MyPosts = 'MY_POSTS',
  UserProfile = 'USER_PROFILE',
  AboutUs = 'ABOUT_US',
  PublicProfile = 'PUBLIC_PROFILE',
  Safety = 'SAFETY',
  Webboard = 'WEBBOARD', 
}

export interface EnrichedHelperProfile extends HelperProfile {
  userPhoto?: string;
  userAddress?: string;
  userDisplayName: string;
  // Badge flags for direct use in HelperCard
  profileCompleteBadge: boolean;    // Badge 2 status
  warningBadge: boolean;            // Badge 4 status (derived from isSuspicious)
  verifiedExperienceBadge: boolean; // Badge 1 status (derived from adminVerifiedExperience)
  // interestedCount is inherited from HelperProfile
}

export interface Interaction {
  interactionId: string;
  helperUserId: string;    // User ID of the helper
  employerUserId: string;  // User ID of the employer initiating contact
  timestamp: string;       // ISO date string
  type: 'contact_helper';
}

// --- Webboard/Blog System Types ---
export interface WebboardPost {
  id: string;
  title: string;
  body: string;
  image?: string; // Base64 encoded string for the image
  userId: string; // ID of the user who posted this
  ownerId?: string; // ID of the user who owns this doc (for security rules)
  username: string; // Username of the user who posted
  authorPhoto?: string; // Author's photo for direct use
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string for edits
  likes: string[]; // Array of user IDs who liked the post
  isPinned?: boolean; // For admin pinning
  isEditing?: boolean; // Client-side flag to help PostCreateForm
}

export interface WebboardComment {
  id: string;
  postId: string; // ID of the post this comment belongs to
  userId: string; // User who made the comment
  ownerId?: string; // User who owns this comment doc (for security rules)
  username: string;
  authorPhoto?: string; // Author's photo for direct use
  text: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string for edits
}

export enum UserLevelName {
  Level1_NewbiePoster = "🐣 มือใหม่หัดโพสต์",
  Level2_FieryNewbie = "🔥 เด็กใหม่ไฟแรง",
  Level3_RegularSenior = "👑 รุ่นพี่ขาประจำ",
  Level4_ClassTeacher = "📘 ครูประจำชั้น",
  Level5_KnowledgeGuru = "🧠 กูรูผู้รอบรู้",
  Level6_BoardFavorite = "💖 ขวัญใจชาวบอร์ด",
  Level7_LegendOfHajobjah = "🪄 ตำนานผู้มีของหาจ๊อบจ้า",
}

// Structure to hold level details (also used for Admin/Mod badges)
export interface UserLevel { // This interface is now generic for all badges
  name: string; // Can be UserLevelName or custom Admin/Mod title
  minScore?: number; // Optional, not used for Admin/Mod
  colorClass: string; // Tailwind CSS class for badge color
  textColorClass?: string; // Tailwind CSS class for text color, if needed for contrast
}

// Define levels - score can be (posts * 2) + (comments * 0.5)
export const USER_LEVELS: UserLevel[] = [
  { name: UserLevelName.Level1_NewbiePoster, minScore: 0, colorClass: 'bg-green-200 dark:bg-green-700/50', textColorClass: 'text-green-800 dark:text-green-200' },
  { name: UserLevelName.Level2_FieryNewbie, minScore: 5, colorClass: 'bg-lime-200 dark:bg-lime-700/50', textColorClass: 'text-lime-800 dark:text-lime-200' },
  { name: UserLevelName.Level3_RegularSenior, minScore: 15, colorClass: 'bg-cyan-200 dark:bg-cyan-700/50', textColorClass: 'text-cyan-800 dark:text-cyan-200' },
  { name: UserLevelName.Level4_ClassTeacher, minScore: 30, colorClass: 'bg-amber-300 dark:bg-amber-600/60', textColorClass: 'text-amber-800 dark:text-amber-100' },
  { name: UserLevelName.Level5_KnowledgeGuru, minScore: 50, colorClass: 'bg-violet-300 dark:bg-violet-600/60', textColorClass: 'text-violet-800 dark:text-violet-100' },
  { name: UserLevelName.Level6_BoardFavorite, minScore: 80, colorClass: 'bg-pink-300 dark:bg-pink-600/60', textColorClass: 'text-pink-800 dark:text-pink-100' },
  { name: UserLevelName.Level7_LegendOfHajobjah, minScore: 120, colorClass: 'bg-teal-300 dark:bg-teal-600/60', textColorClass: 'text-teal-800 dark:text-teal-100' },
];

export const ADMIN_BADGE_DETAILS: UserLevel = {
  name: "🌟 ผู้พิทักษ์จักรวาล",
  colorClass: 'bg-yellow-100 dark:bg-yellow-700/30', // Softer yellow
  textColorClass: 'text-yellow-800 dark:text-yellow-200', // Adjusted text for softer yellow
};

export const MODERATOR_BADGE_DETAILS: UserLevel = {
  name: "👮 ผู้ตรวจการ",
  colorClass: 'bg-blue-400 dark:bg-blue-500/70',
  textColorClass: 'text-blue-900 dark:text-blue-50',
};

// Enriched post type for display, including comment count and calculated author level
export interface EnrichedWebboardPost extends WebboardPost {
  commentCount: number;
  authorLevel: UserLevel; // This will now hold Admin/Mod badge or level badge
  isAuthorAdmin?: boolean; // Flag to indicate if the author of the post is an Admin
}

export interface EnrichedWebboardComment extends WebboardComment {
  authorLevel: UserLevel; // This will now hold Admin/Mod badge or level badge
}
