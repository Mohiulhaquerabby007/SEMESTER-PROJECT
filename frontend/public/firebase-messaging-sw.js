importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

// We need to inject the config here too, but since process.env doesn't work in SW out of the box
// easily without a bundler plugin, we will pass it dynamically using URL params or write it here.
// But wait, the easiest way is to use a placeholder and have the user fill it, OR
// read from URL. Actually, for a simple implementation, the user needs to paste their config here.

// I'll create a template and instruct the user to paste their config.
const firebaseConfig = {
  apiKey: "AIzaSyCk1cXfJ5MejMGDU6zpTb5z3rch2fsf3zg",
  authDomain: "flexypay-82d33.firebaseapp.com",
  projectId: "flexypay-82d33",
  storageBucket: "flexypay-82d33.firebasestorage.app",
  messagingSenderId: "820058558103",
  appId: "1:820058558103:web:24b9f0678068b1c7fee3d2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
