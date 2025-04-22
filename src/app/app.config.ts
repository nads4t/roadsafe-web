import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideRouter } from '@angular/router'; // ✅ Import this
import { routes } from './app.routes'; // ✅ Your route definitions

// Define Firebase config directly here
const firebaseConfig = {
  apiKey: "AIzaSyB3rndzEws8XayKX__2RqJWf5fV-uU9Ab4",
  authDomain: "roadsafe-cc574.firebaseapp.com",
  projectId: "roadsafe-cc574",
  storageBucket: "roadsafe-cc574.firebasestorage.app",
  messagingSenderId: "439453125632",
  appId: "1:439453125632:web:164d2274ae1ceea80c1ce5",
  measurementId: "G-QM4FS230F0"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideRouter(routes) // ✅ Add this to enable routing
  ]
};
