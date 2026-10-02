import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const app = getApps()[0] || initializeApp({
  apiKey: "AIzaSyAbSsEXLTaVQm7RF8nLHY9VKVhnEjjdG7c",
  authDomain: "hngintern-f6d4f.firebaseapp.com",
  projectId: "hngintern-f6d4f",
  appId: "1:33397702774:web:28e7a245f58a18bd1ddf57",
});
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
