import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAwR0YtJo-MZWOpkdEUnWKHe32ujCqbFK4",
    authDomain: "cs447-mail.firebaseapp.com",
    projectId: "cs447-mail",
    storageBucket: "cs447-mail.firebasestorage.app",
    messagingSenderId: "381499028700",
    appId: "1:381499028700:web:b2482bc134019d42437019",
    measurementId: "G-9DV4RG3XG1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
