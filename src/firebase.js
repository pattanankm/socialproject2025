// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDD92N7_QCQ1W9acNBTo_UccUA9hEBROpw",
  authDomain: "react-firebase-auth-8ad89.firebaseapp.com",
  projectId: "react-firebase-auth-8ad89",
  storageBucket: "react-firebase-auth-8ad89.firebasestorage.app",
  messagingSenderId: "625179823327",
  appId: "1:625179823327:web:e6bcba8192cb0504732d6a",
  measurementId: "G-JL4QYFH199"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;