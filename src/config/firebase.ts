import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDNjPfhHkrjWPiX7ir5S1D79sJXCNrV_1E",
  authDomain: "mabinogimobile-cffae.firebaseapp.com",
  databaseURL: "https://mabinogimobile-cffae-default-rtdb.firebaseio.com",
  projectId: "mabinogimobile-cffae",
  storageBucket: "mabinogimobile-cffae.firebasestorage.app",
  messagingSenderId: "641210565766",
  appId: "1:641210565766:web:5ecf2344c21d7997737d07",
  measurementId: "G-TRFV2SPZ3B"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;
