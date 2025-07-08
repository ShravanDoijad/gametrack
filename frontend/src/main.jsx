import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import BookContextProvider from './constexts/bookContext.jsx'
import { setupOneSignal } from './onesignal-setup';
import axios from 'axios';
axios.defaults.baseURL = import.meta.env.VITE_BACKEND; 
import { ToastContainer, toast } from 'react-toastify';

axios.defaults.withCredentials = true;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("SW registered:", registration);
    })
    .catch((error) => {
      console.error("SW registration failed:", error);
    });
}
setupOneSignal();
createRoot(document.getElementById('root')).render(
  


  <BrowserRouter>
  <BookContextProvider>
  <StrictMode>
    <ToastContainer/>
    <App />
  </StrictMode>
  </BookContextProvider>
  </BrowserRouter>
)
