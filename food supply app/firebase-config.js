// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAw-JoiPt_Xylvo1vBlLeKyREmLpaQt66M",
  authDomain: "foodsupplyapp-75b92.firebaseapp.com",
  projectId: "foodsupplyapp-75b92",
  storageBucket: "foodsupplyapp-75b92.firebasestorage.app",
  messagingSenderId: "564530909937",
  appId: "1:564530909937:web:123288c2632653c10a8f50"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
