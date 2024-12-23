import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-button');
const notLoggedInDiv = document.getElementById('not-logged-in');
const loggedInDiv = document.getElementById('logged-in');
const userEmailSpan = document.getElementById('user-email');
const statusP = document.getElementById('status');

const privateKeyFileInput = document.getElementById('privateKeyFile');
const restorePrivateKeyBtn = document.getElementById('restorePrivateKeyBtn');
const logoutBtn = document.getElementById('logout');

onAuthStateChanged(auth, user => {
    if (user) {
        notLoggedInDiv.style.display = 'none';
        loggedInDiv.style.display = 'block';
        userEmailSpan.textContent = user.email;
        chrome.runtime.sendMessage({
            type: 'AUTH_STATE_CHANGE',
            user: { email: user.email, uid: user.uid }
        });
    } else {
        notLoggedInDiv.style.display = 'block';
        loggedInDiv.style.display = 'none';
        chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGE', user: null });
    }
});

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    statusP.textContent = '';

    if (!email || !pass) {
        statusP.textContent = 'Please enter email and password.';
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        statusP.textContent = 'Login successful!';
    } catch (error) {
        statusP.textContent = 'Login error: ' + error.message;
    }
});

restorePrivateKeyBtn.addEventListener('click', () => {
    const file = privateKeyFileInput.files[0];
    if (!file) {
        statusP.textContent = "Please select a privateKey.json file.";
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jwk = JSON.parse(e.target.result);
            chrome.storage.local.set({ privateKey: jwk }, () => {
                statusP.textContent = "Private key restored to local storage.";
            });
        } catch {
            statusP.textContent = "Invalid private key file.";
        }
    };
    reader.readAsText(file);
});

logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    statusP.textContent = "Logged out.";
});

console.log('Popup script loaded.');