import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "hajobjah.firebaseapp.com",
  projectId: "hajobjah",
  storageBucket: "hajobjah.appspot.com",
  messagingSenderId: "XXXXXXXXX",
  appId: "1:XXXXXXXXX:web:XXXXXXXXX"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);