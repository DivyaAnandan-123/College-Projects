// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0xKn9ei5J4xruoIulqYexRdFRutyU5BE",
  authDomain: "cloud-priya.firebaseapp.com",
  projectId: "cloud-priya",
  storageBucket: "cloud-priya.appspot.com", // ✅ FIXED THIS
  messagingSenderId: "919798549008",
  appId: "1:919798549008:web:532ee880c8647bc320d895",
  measurementId: "G-J1CLM9EDBG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  db,
  storage,
  collection,
  addDoc,
  getDocs,
  ref,
  uploadBytes,
  getDownloadURL
};
