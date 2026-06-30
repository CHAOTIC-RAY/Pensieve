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

export default app;
