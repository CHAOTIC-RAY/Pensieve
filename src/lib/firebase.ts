/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect if running in browser
const isBrowser = typeof window !== 'undefined';

const getFirebaseConfig = () => {
  if (isBrowser) {
    const customApiKey = localStorage.getItem('mymind_firebase_apiKey');
    const customAuthDomain = localStorage.getItem('mymind_firebase_authDomain');
    const customProjectId = localStorage.getItem('mymind_firebase_projectId');
    const customStorageBucket = localStorage.getItem('mymind_firebase_storageBucket');
    const customMessagingSenderId = localStorage.getItem('mymind_firebase_messagingSenderId');
    const customAppId = localStorage.getItem('mymind_firebase_appId');
    const customDatabaseId = localStorage.getItem('mymind_firebase_firestoreDatabaseId');

    // If at least project ID and API key are customized, use the custom config
    if (customProjectId && customApiKey) {
      return {
        apiKey: customApiKey,
        authDomain: customAuthDomain || undefined,
        projectId: customProjectId,
        storageBucket: customStorageBucket || undefined,
        messagingSenderId: customMessagingSenderId || undefined,
        appId: customAppId || undefined,
        firestoreDatabaseId: customDatabaseId || firebaseConfig.firestoreDatabaseId
      };
    }
  }
  return firebaseConfig;
};

const activeConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(activeConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, activeConfig.firestoreDatabaseId);

import { getAuth } from 'firebase/auth';
export const auth = getAuth(app);

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
  }
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
