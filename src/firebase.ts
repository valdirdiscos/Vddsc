import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc, 
  query, 
  orderBy,
  onSnapshot,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA7WiebNhfKOl1fx6M-MtZlK8CcAnPa5BU",
  authDomain: "gen-lang-client-0923220789.firebaseapp.com",
  projectId: "gen-lang-client-0923220789",
  storageBucket: "gen-lang-client-0923220789.firebasestorage.app",
  messagingSenderId: "13016057335",
  appId: "1:13016057335:web:b5e720cc3b3831939ddaf2"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID and auto-detected long-polling
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, "ai-studio-discogsparashope-dd3d308d-6630-4f3f-bfab-1292a379e681");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}

export { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc, 
  query, 
  orderBy,
  onSnapshot,
  where,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
export type { FirebaseUser };
