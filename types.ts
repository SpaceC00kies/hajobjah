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
  Vocational = 'ปวช./ปวส.',
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
  username: string; // Username of the user who created this profile
  isSuspicious?: boolean; // For admin marking
  isPinned?: boolean; // For admin pinning
  isUnavailable?: boolean; // For admin marking as unavailable/closed
}

export interface User {
  id: string;
  displayName: string;      // ชื่อ (Display Name)
  username: string;         // ชื่อผู้ใช้ (Unique)
  email: string;            // อีเมล (Unique)
  hashedPassword: string;   // IMPORTANT: For demonstration, this will be plain text.
                            // IN A REAL APP, NEVER STORE PLAIN TEXT PASSWORDS.
                            // Always use strong hashing algorithms (e.g., bcrypt, Argon2).
  isAdmin?: boolean;        // Flag for admin users
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
  Safety = 'SAFETY', // New view for Safety Page
}

export interface AIPromptDetails {
  taskType: string;
  locationDetails: string;
  schedule: string;
  compensationDetails: string;
}

// For enriching HelperProfile data for display in cards
export interface EnrichedHelperProfile extends HelperProfile {
  userPhoto?: string;
  userAddress?: string; // Could be a snippet or full address depending on context
  userDisplayName: string;
}