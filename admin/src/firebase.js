// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbfp2sweLJntEJ9-hIF6pYW4UWSEKZ4-Y",
  authDomain: "gametrack-76bc7.firebaseapp.com",
  projectId: "gametrack-76bc7",
  storageBucket: "gametrack-76bc7.firebasestorage.app",
  messagingSenderId: "48531190307",
  appId: "1:48531190307:web:91ce1fa9dd060120e67796",
  measurementId: "G-HZ2S9F42D4"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export default firebaseApp;
