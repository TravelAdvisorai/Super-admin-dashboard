// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBz8VrLN-D2rbm-FbL3iwc-DUpW0wIZpko",
  authDomain: "taai-test.firebaseapp.com",
  projectId: "taai-test",
  storageBucket: "taai-test.firebasestorage.app",
  messagingSenderId: "33225749494",
  appId: "1:33225749494:web:1c9dc7d267b24abc7bcdd7",
  measurementId: "G-48S7MRSLLL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };