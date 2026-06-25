import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsiRMECq8H6e8Xyu-sSCciotGXStxpRkA",
  authDomain: "nexdocs-cnh.firebaseapp.com",
  projectId: "nexdocs-cnh",
  storageBucket: "nexdocs-cnh.firebasestorage.app",
  messagingSenderId: "21402875732",
  appId: "1:21402875732:web:4172a7808b4510cbdc3ac1",
};

export const ADMIN_EMAIL = "cossa@cossanexusholdings.co.za";
export const WHATSAPP_NUMBER = "27678011907";
export const TRIAL_DAYS = 10;
export const SUBSCRIPTION_PRICE = 99;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function ensureApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK can only be used in the browser");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(ensureApp());
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(ensureApp());
  return dbInstance;
}
