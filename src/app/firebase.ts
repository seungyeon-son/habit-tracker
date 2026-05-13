import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 클라이언트 설정 (공개 키 - 브라우저에 노출되는 값, 보안은 Firestore Rules로 관리)
const firebaseConfig = {
  apiKey: "AIzaSyC0wyKMmbOcQtSZQntQG6pBYgI-RriI51c",
  authDomain: "habit-tracker-83558.firebaseapp.com",
  projectId: "habit-tracker-83558",
  storageBucket: "habit-tracker-83558.firebasestorage.app",
  messagingSenderId: "678377254780",
  appId: "1:678377254780:web:245ba0d6d87401f7adfef9",
  measurementId: "G-8GHK6YNC5Z",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseEnabled = true;
