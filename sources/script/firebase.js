// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAoRBTHb-JJlRISIkXhm3Kc5qe9vr05st4",
  authDomain: "chatid-891c3.firebaseapp.com",
  projectId: "chatid-891c3",
  storageBucket: "chatid-891c3.appspot.com",
  messagingSenderId: "491573880708",
  appId: "1:491573880708:web:141ee236e8c6a912309fd1",
  measurementId: "G-ZZMGYM0GJ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);