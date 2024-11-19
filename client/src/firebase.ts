import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCPD4p4bKT-88kWNkfyvkDoev8mPMM1kCc",
    authDomain: "anxiety-shredder-de07d.firebaseapp.com",
    projectId: "anxiety-shredder-de07d",
    storageBucket: "anxiety-shredder-de07d.firebasestorage.app",
    messagingSenderId: "807038680890",
    appId: "1:807038680890:web:f9ef0f51cc007827d51a03",
    measurementId: "G-4DJEGMRFFT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const signUp = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };
  
  export const logIn = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };
  
  export const onAuthStateChangedListener = (callback: (user: any) => void) => {
    console.log('Setting up auth listener');
    onAuthStateChanged(auth, callback);
  };
  