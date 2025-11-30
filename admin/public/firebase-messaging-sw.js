
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDbfp2sweLJntEJ9-hIF6pYW4UWSEKZ4-Y",
  authDomain: "gametrack-76bc7.firebaseapp.com",
  projectId: "gametrack-76bc7",
  storageBucket: "gametrack-76bc7.firebasestorage.app",
  messagingSenderId: "48531190307",
  appId: "1:48531190307:web:91ce1fa9dd060120e67796",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("📥 Background message: ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
