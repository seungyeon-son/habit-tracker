import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
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
const _auth = getAuth(app);

// 탭/브라우저 닫아도 로그인 상태 유지 (localStorage 기반)
setPersistence(_auth, browserLocalPersistence);

export const auth = _auth;
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseEnabled = true;
