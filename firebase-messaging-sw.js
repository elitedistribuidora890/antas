importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
 apiKey: "AIzaSyDbMlnT8pO0_JECJsGrQn2CNfcsKA6uyGQ",
  authDomain: "cidade-9528a.firebaseapp.com",
  projectId: "cidade-9528a",
  storageBucket: "cidade-9528a.firebasestorage.app",
  messagingSenderId: "475692348722",
  appId: "1:475692348722:web:f03639854c7243e917932b",
  measurementId: "G-EW7598TPL2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png"
  });
});