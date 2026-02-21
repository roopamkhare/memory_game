import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz6U3T9C5pqUSIec-sg026PSPuHreqFQg",
  authDomain: "amayaa-memory-game.firebaseapp.com",
  projectId: "amayaa-memory-game",
  storageBucket: "amayaa-memory-game.firebasestorage.app",
  messagingSenderId: "121321294258",
  appId: "1:121321294258:web:66dec51667852adf5f7cab",
  measurementId: "G-SBG3B872PC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);