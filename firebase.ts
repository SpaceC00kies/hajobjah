
// firebase.ts
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };

/*
--------------------------------------------------------------------------------
Firebase Security Rules (Effective as of user's last update)
--------------------------------------------------------------------------------

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow public read-only access to general site data
    match /jobs/{jobId} {
      allow read: if true;
      allow create: if isSignedIn() && !isMuted() && !isSiteLocked();
      allow update, delete: if isOwnerOrAdmin("jobs", jobId);
    }

    match /helperProfiles/{profileId} {
      allow read: if true;
      allow create: if isSignedIn() && !isMuted() && !isSiteLocked();
      allow update, delete: if isOwnerOrAdmin("helperProfiles", profileId);
    }

    match /webboardPosts/{postId} {
      allow read: if true;
      allow create: if isSignedIn() && !isMuted() && !isSiteLocked();
      // Moderator can update (e.g. pin, content moderation) but not if post is by Admin
      // Admin can update any. Owner can update.
      allow update: if (isSignedIn() && !isMuted() && (
                       (resource.data.ownerId == request.auth.uid) ||
                       (isAdmin()) ||
                       (isModerator() && get(/databases/$(database)/documents/users/$(resource.data.ownerId)).data.role != 'Admin')
                     ));
      // Moderator can delete non-Admin posts. Admin can delete any. Owner can delete.
      allow delete: if (isSignedIn() && (
                       (resource.data.ownerId == request.auth.uid) ||
                       (isAdmin()) ||
                       (isModerator() && get(/databases/$(database)/documents/users/$(resource.data.ownerId)).data.role != 'Admin')
                     ));
    }

    match /webboardComments/{commentId} {
      allow read: if true;
      allow create: if isSignedIn() && !isMuted() && !isSiteLocked();
      // Owner can update their comment. Admins/Mods can also update (for moderation).
      allow update: if (isSignedIn() && !isMuted() && (
                       (resource.data.ownerId == request.auth.uid) ||
                       (isAdmin()) ||
                       (isModerator()) // Assuming mods can edit any comment for moderation
                     ));
      // Owner, Admin, or Moderator can delete comments.
      allow delete: if (isSignedIn() && (
                       (resource.data.ownerId == request.auth.uid) ||
                       (isAdmin()) ||
                       (isModerator())
                     ));
    }

    match /feedback/{feedbackId} {
      allow read: if false; // private
      allow create: if true; // allow anonymous feedback
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow update: if isOwner(userId) || isAdmin(); // Admin can update roles, freeze, etc. Owner updates own profile.
      allow create: if request.auth != null; // User creation during signup
    }

    match /config/{docId} {
      allow read: if true;
      // Only admins can change config like siteStatus
      allow update: if isAdmin();
    }
    
    match /interactions/{interactionId} {
      // Only involved parties or admin can read.
      allow read: if isSignedIn() && (isOwner(resource.data.employerUserId) || isOwner(resource.data.helperUserId) || isAdmin());
      // Only the employer initiating contact can create.
      allow create: if isSignedIn() && request.resource.data.employerUserId == request.auth.uid;
      // No updates/deletes from client generally needed.
    }


    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userIdToMatch) {
      return isSignedIn() && request.auth.uid == userIdToMatch;
    }

    // Check ownership of a document in a specific collection
    // This version is more explicit about checking 'ownerId' on the resource.
    function isOwnerOrAdmin(collectionName, docId) {
      let docData = get(/databases/$(database)/documents/$(collectionName)/$(docId)).data;
      return isSignedIn() &&
        (docData.ownerId == request.auth.uid || isAdmin());
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "Admin";
    }
    
    function isModerator() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "Moderator";
    }

    function isMuted() {
      // Check if the current authenticated user is muted.
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isMuted == true;
    }

    function isSiteLocked() {
      // Site is locked if the doc exists and isSiteLocked is true,
      // UNLESS the current user is an Admin. Admins bypass site lock for operations.
      // This function is for rules that should block normal users during site lock.
      // Admin-specific operations should just check isAdmin().
      let siteConfig = get(/databases/$(database)/documents/config/siteStatus).data;
      return siteConfig.isSiteLocked == true && !isAdmin();
    }
  }
}

// Firebase Storage Rules (Conceptual - ensure these align with Firestore if direct URLs are stored)
service firebase.storage {
  match /b/{bucket}/o {
    // Profile Pictures: users can upload their own, public read if desired
    match /profileImages/{userId}/{fileName} {
      allow read: if true; 
      allow write: if request.auth != null && request.auth.uid == userId 
                   && request.resource.size < 2 * 1024 * 1024 // Max 2MB
                   && request.resource.contentType.matches('image/.*');
    }
    // Webboard Post Images
    match /webboardImages/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId 
                   && request.resource.size < 2 * 1024 * 1024 // Max 2MB
                   && request.resource.contentType.matches('image/.*');
    }
    // Other paths (default deny)
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}

*/
