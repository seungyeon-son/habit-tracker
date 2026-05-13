import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth';
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

// indexedDB 우선 사용 → iOS Safari Storage 파티셔닝에 강함
// browserPopupRedirectResolver: popup 통신에 postMessage 사용 (sessionStorage 불필요)
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseEnabled = true;
