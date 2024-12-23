import { auth } from './firebaseConfig.js';

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'AUTH_STATE_CHANGE') {
        chrome.storage.local.set({ authUser: message.user }, () => {
            console.log('Auth state updated in storage:', message.user);
        });
    }

    if (message.command === 'getUserStatus') {
        chrome.storage.local.get('authUser', (result) => {
            if (result.authUser) {
                console.log('User fetched from storage:', result.authUser);
                sendResponse({ authenticated: true, email: result.authUser.email });
            } else {
                // fallback to auth.currentUser if needed
                const user = auth.currentUser;
                console.log('Current user status from Firebase:', user);
                sendResponse({ authenticated: !!user, email: user?.email });
            }
        });
        return true; // Keep messaging channel open for async response
    }
});