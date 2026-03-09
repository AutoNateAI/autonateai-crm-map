import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA280xxb-pJmE_IZfKgxdIRn4stFoXeYM8",
  authDomain: "marketing-command-center-anai.firebaseapp.com",
  projectId: "marketing-command-center-anai",
  storageBucket: "marketing-command-center-anai.firebasestorage.app",
  messagingSenderId: "557034909885",
  appId: "1:557034909885:web:5a95c65540513ca749c7d4",
  measurementId: "G-GJE5LJ22EQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);