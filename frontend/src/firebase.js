// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import  {getMessaging} from "firebase/messaging"


const firebaseConfig = {
   apiKey: "AIzaSyDbfp2sweLJntEJ9-hIF6pYW4UWSEKZ4-Y",
  authDomain: "gametrack-76bc7.firebaseapp.com",
  projectId: "gametrack-76bc7",
  storageBucket: "gametrack-76bc7.firebasestorage.app",
  messagingSenderId: "48531190307",
  appId: "1:48531190307:web:91ce1fa9dd060120e67796",
  measurementId: "G-HZ2S9F42D4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const messaging  = getMessaging(app)

export { auth };
