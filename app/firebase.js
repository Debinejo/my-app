// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYF37kyJjYRHot-h7Oq3MKbnwv1nDb-EU",
  authDomain: "appasistencia-7b29b.firebaseapp.com",
  projectId: "appasistencia-7b29b",
  storageBucket: "appasistencia-7b29b.firebasestorage.app",
  messagingSenderId: "443739793572",
  appId: "1:443739793572:web:74ad225e5d5a96238fde31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Inicializa Realtime Database

export { database };