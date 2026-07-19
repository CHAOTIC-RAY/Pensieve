/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase Auth only — Google / email / anonymous login.
 * Vault data uses IndexedDB + optional Appwrite/Supabase sync (not Firestore).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const isBrowser = typeof window !== 'undefined';

const getFirebaseConfig = () => {
  if (isBrowser) {
    const customApiKey = localStorage.getItem('pensieve_firebase_apiKey');
    const customAuthDomain = localStorage.getItem('pensieve_firebase_authDomain');
    const customProjectId = localStorage.getItem('pensieve_firebase_projectId');
    const customAppId = localStorage.getItem('pensieve_firebase_appId');

    // Optional Auth project override (Google Sign-In only — no Firestore)
    if (customProjectId && customApiKey) {
      return {
        apiKey: customApiKey,
        authDomain: customAuthDomain || `${customProjectId}.firebaseapp.com`,
        projectId: customProjectId,
        appId: customAppId || undefined,
      };
    }
  }

  return {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
  };
};

const activeConfig = getFirebaseConfig();
const app = getApps().length ? getApp() : initializeApp(activeConfig);

export const auth = getAuth(app);
export default app;
