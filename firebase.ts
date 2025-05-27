// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAmhIItKW9XR4cgtCxtTUm2EKCY17xNOlo",
  authDomain: "hajobjah.firebaseapp.com",
  projectId: "hajobjah",
  storageBucket: "hajobjah.firebasestorage.app",
  messagingSenderId: "441394350866",
  appId: "1:441394350866:web:7b83583818449c0f3901cb",
  measurementId: "G-LXKMEJQPCH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);