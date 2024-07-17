// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBeGHe_kiQ9Y0T4iuBGXtqHsUW1wifdk2E',
  authDomain: 'wildfire-86695.firebaseapp.com',
  projectId: 'wildfire-86695',
  storageBucket: 'buckets.hashfeed.social',
  messagingSenderId: '1029715662349',
  appId: '1:1029715662349:web:ad686e26ae6f119cc62744',
  measurementId: 'G-JVKQG4F3P2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
// Initialize Authentication through Firebase
export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);
