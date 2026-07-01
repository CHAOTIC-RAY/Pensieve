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
  
  // Fallback to hardcoded config if environment variables aren't available
  return {
    apiKey: "AIzaSyCI9dw2m47MMk9jIXvl4l7DEPA4AF91tS0",
    authDomain: "gen-lang-client-0018612871.firebaseapp.com",
    projectId: "gen-lang-client-0018612871",
    storageBucket: "gen-lang-client-0018612871.firebasestorage.app",
    messagingSenderId: "591622610805",
    appId: "1:591622610805:web:97cca18539f0981e017d3c",
    measurementId: "G-WZVSFCPW38"
  };
};

const activeConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(activeConfig);

import { getAuth } from 'firebase/auth';
export const auth = getAuth(app);

import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);

export default app;
