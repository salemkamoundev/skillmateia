importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Config Firebase (DOIT MATCH TES CLÉS DE PROD)
// TODO: Remplacer par vos vraies valeurs
firebase.initializeApp({
    apiKey: "AIzaSyAmjaBM-3VyLRrAuznsxHBg9mYp7azMXb4",
    authDomain: "skillmateia.firebaseapp.com",
    databaseURL: "https://skillmateia-default-rtdb.firebaseio.com",
    projectId: "skillmateia",
    storageBucket: "skillmateia.firebasestorage.app",
    messagingSenderId: "340201900564",
    appId: "1:340201900564:web:56bf1d6b70a1b9b3767501",
    measurementId: "G-10J0XV8FJT"
});

const messaging = firebase.messaging();

// Handler pour les messages en background
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Message reçu en background ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icons/icon-192x192.png',
    data: payload.data // Données custom (ex: url de redirection)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
