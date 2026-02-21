import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let adminDb: Firestore;
let adminAuth: Auth;

if (getApps().length === 0) {
  // Use Application Default Credentials or service account JSON from env
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    const parsed = JSON.parse(serviceAccount);
    app = initializeApp({ credential: cert(parsed) });
  } else {
    // Fallback to ADC (works in Firebase/GCP environments)
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

adminDb = getFirestore(app);
adminAuth = getAuth(app);

export { adminDb, adminAuth };
