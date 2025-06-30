import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyB0xKn9ei5J4xruoIulqYexRdFRutyU5BE",
  authDomain: "cloud-priya.firebaseapp.com",
  projectId: "cloud-priya",
  storageBucket: "cloud-priya.firebasestorage.app",
  messagingSenderId: "919798549008",
  appId: "1:919798549008:web:532ee880c8647bc320d895"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };