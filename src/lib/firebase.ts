/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect if running in browser
const isBrowser = typeof window !== 'undefined';

const getFirebaseConfig = () => {
  if (isBrowser) {
    const customApiKey = localStorage.getItem('pensieve_firebase_apiKey');
    const customAuthDomain = localStorage.getItem('pensieve_firebase_authDomain');
    const customProjectId = localStorage.getItem('pensieve_firebase_projectId');
    const customStorageBucket = localStorage.getItem('pensieve_firebase_storageBucket');
    const customMessagingSenderId = localStorage.getItem('pensieve_firebase_messagingSenderId');
    const customAppId = localStorage.getItem('pensieve_firebase_appId');

    // If at least project ID and API key are customized, use the custom config
    if (customProjectId && customApiKey) {
      return {
        apiKey: customApiKey,
        authDomain: customAuthDomain || undefined,
        projectId: customProjectId,
        storageBucket: customStorageBucket || undefined,
        messagingSenderId: customMessagingSenderId || undefined,
        appId: customAppId || undefined
      };
    }
  }
  
  // Fallback to platform-generated config from firebase-applet-config.json
  return firebaseConfig;
};

const activeConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(activeConfig);

import { getAuth } from 'firebase/auth';
export const auth = getAuth(app);

import { getFirestore } from 'firebase/firestore';
// Initialize Firestore with the custom database ID if configured
const customDbId = isBrowser ? localStorage.getItem('pensieve_firebase_databaseId') : null;
const dbId = customDbId || firebaseConfig.firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export default app;
