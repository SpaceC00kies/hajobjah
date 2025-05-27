
import type { Timestamp } from 'firebase/firestore';

export interface Job {
  id: string; // Firestore document ID
  title: string;
  location: string;
  dateTime: string;
  payment: string;
  contact: string; // This will be derived from the user's profile at creation/update
  description: string;
  desiredAgeStart?: number;
  desiredAgeEnd?: number;
  preferredGender?: 'ชาย' | 'หญิง' | 'ไม่จำกัด';
  desiredEducationLevel?: JobDesiredEducationLevelOption;
  dateNeededFrom?: string; // YYYY-MM-DD
  dateNeededTo?: string; // YYYY-MM-DD (optional)
  timeNeededStart?: string; // HH:MM
  timeNeededEnd?: string; // HH:MM
  postedAt: Timestamp; // Firestore Timestamp
  userId: string; // Firebase UID of the user who posted this job
  username: string; // Username of the user who posted this job (denormalized)
  isSuspicious?: boolean;
  isPinned?: boolean;
  isHired?: boolean;
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
  Vocational = 'ปวช./ปวส.',
  Bachelor = 'ปริญญาตรี',
  Higher = 'สูงกว่าปริญญาตรี',
}

export interface HelperProfile {
  id: string; // Firestore document ID
  profileTitle: string;
  details: string;
  area: string;
  availability: string;
  contact: string; // This will be derived from the user's profile at creation/update
  gender?: GenderOption; // Snapshot from User profile
  birthdate?: string; // Store as YYYY-MM-DD string, Snapshot from User profile
  educationLevel?: HelperEducationLevelOption; // Snapshot from User profile
  availabilityDateFrom?: string; // YYYY-MM-DD
  availabilityDateTo?: string; // YYYY-MM-DD
  availabilityTimeDetails?: string;
  postedAt: Timestamp; // Firestore Timestamp
  userId: string; // Firebase UID of the user who created this profile
  username: string; // Username of the user who created this profile (denormalized)
  isSuspicious?: boolean;
  isPinned?: boolean;
  isUnavailable?: boolean;
  adminVerifiedExperience?: boolean;
  interestedCount?: number;
  interestedUserIds?: string[]; // Array of user UIDs who are interested
}

export interface User {
  id: string; // Firebase UID
  displayName: string;
  username: string; // Unique
  email: string; // Unique (from Firebase Auth)
  isAdmin?: boolean;
  mobile: string;
  lineId?: string;
  facebook?: string;
  gender?: GenderOption;
  birthdate?: string; // YYYY-MM-DD
  educationLevel?: HelperEducationLevelOption;
  photoURL?: string; // URL from Firebase Storage
  address?: string;

  favoriteMusic?: string;
  favoriteBook?: string;
  favoriteMovie?: string;
  hobbies?: string;
  favoriteFood?: string;
  dislikedThing?: string;
  introSentence?: string;

  // Badge-related fields (calculated, not directly stored or if stored, can be re-calculated)
  profileComplete?: boolean;
  hasBeenContacted?: boolean;
  createdAt: Timestamp; // Firestore Timestamp
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
}

export interface AIPromptDetails {
  taskType: string;
  locationDetails: string;
  schedule: string;
  compensationDetails: string;
}

export interface EnrichedHelperProfile extends HelperProfile {
  userPhotoURL?: string; // Updated from userPhoto
  userAddress?: string;
  userDisplayName: string;
  profileCompleteBadge: boolean;
  hasBeenContactedBadge: boolean;
  warningBadge: boolean;
  verifiedExperienceBadge: boolean;
}

export interface Interaction {
  id: string; // Firestore document ID
  helperUserId: string; // User ID of the helper (HelperProfile ID or User ID)
  helperProfileId: string; // Firestore ID of the HelperProfile document
  employerUserId: string; // User ID of the employer initiating contact
  timestamp: Timestamp; // Firestore Timestamp
  type: 'contact_helper';
}