import {db} from './firebaseConfig.js';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    decryptMessage,
    decryptSymKey,
    encryptMessage,
    encryptSymKey,
    generateSymmetricKey,
    importPrivateKey,
    importPublicKey
} from './cryptoUtils.js';
import {doc, getDoc} from "firebase/firestore";

console.log('Content script loaded. Checking for compose windows and encrypted messages every 2s...');

const CHECK_INTERVAL = 2000; // Check every 2 seconds

async function getAuthUser() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ command: 'getUserStatus' }, (response) => {
            resolve(response);
        });
    });
}

async function addEncryptButtonIfNeeded() {
    const messageBody = document.querySelector('div[role="textbox"][contenteditable="true"]');
    const sendButton = document.querySelector('div.aoO[role="button"]');

    const authStatus = await getAuthUser();
    if (!authStatus.authenticated) {
        // No need to add Encrypt & Send if not authenticated
        return;
    }

    if (messageBody && sendButton && !document.getElementById('encrypt-send-button')) {
        const encryptBtn = document.createElement('button');
        encryptBtn.id = 'encrypt-send-button';
        encryptBtn.innerText = "Encrypt & Send";
        encryptBtn.style.background = '#4285f4';
        encryptBtn.style.color = '#fff';
        encryptBtn.style.border = 'none';
        encryptBtn.style.padding = '5px 10px';
        encryptBtn.style.marginRight = '8px';
        encryptBtn.style.cursor = 'pointer';

        sendButton.parentElement.insertBefore(encryptBtn, sendButton);

        encryptBtn.addEventListener('click', async () => {
            const recipientEmail = getRecipientEmail();
            if (!recipientEmail) {
                alert('No recipient found! Please add a recipient before encrypting.');
                return;
            }

            const plaintext = messageBody.innerText.trim();
            if (!plaintext) {
                alert('Message is empty! Please write something before encrypting.');
                return;
            }

            try {
                const recipientKeyDoc = await getDoc(doc(db, 'users', recipientEmail));
                if (!recipientKeyDoc.exists()) {
                    alert('Recipient public key not found in the database!');
                    return;
                }

                const recipientData = recipientKeyDoc.data();
                if (!recipientData.publicKey) {
                    alert('Recipient public key not found in the database!');
                    return;
                }

                const recipientPubKey = await importPublicKey(recipientData.publicKey);
                const symKey = await generateSymmetricKey();
                const { ciphertext, iv } = await encryptMessage(symKey, plaintext);
                const encSymKey = await encryptSymKey(recipientPubKey, symKey);

                const encObj = {
                    encSymKey: arrayBufferToBase64(encSymKey),
                    iv: arrayBufferToBase64(iv),
                    ciphertext: arrayBufferToBase64(ciphertext),
                    marker: 'ENCRYPTED_MESSAGE'
                };

                messageBody.innerText = JSON.stringify(encObj, null, 2);
                alert('Message encrypted! Now click the normal "Send" button to send it.');
            } catch (error) {
                console.error('Error during encryption:', error);
                alert('An error occurred while fetching the public key or encrypting the message.');
            }
        });
    }
}

function getRecipientEmail() {
    try {
        const recipientContainer = document.querySelector('div[role="listbox"]');
        if (!recipientContainer) return null;

        const recipientChip = recipientContainer.querySelector('[data-hovercard-id]');
        if (recipientChip) {
            const email = recipientChip.getAttribute('data-hovercard-id');
            return email ? email.trim() : null;
        }
        return null;
    } catch {
        return null;
    }
}

async function decryptIncomingMessage() {
    const emailBodies = document.querySelectorAll('div.a3s.aiL');

    const authStatus = await getAuthUser();
    if (!authStatus.authenticated) return;

    const stored = await chrome.storage.local.get('privateKey');
    if (!stored.privateKey) return;

    const privateKey = await importPrivateKey(stored.privateKey);

    for (let body of emailBodies) {
        if (body.dataset.decrypted) continue;
        const textContent = body.innerText;
        if (textContent.includes('ENCRYPTED_MESSAGE')) {
            try {
                const encObj = JSON.parse(textContent);
                if (encObj.marker !== 'ENCRYPTED_MESSAGE') continue;

                const encSymKey = base64ToArrayBuffer(encObj.encSymKey);
                const iv = base64ToArrayBuffer(encObj.iv);
                const ciphertext = base64ToArrayBuffer(encObj.ciphertext);

                const symKey = await decryptSymKey(privateKey, encSymKey);
                body.innerText = await decryptMessage(symKey, ciphertext, iv);
                body.dataset.decrypted = 'true';
            } catch (err) {
                console.error('Error decrypting message:', err);
            }
        }
    }
}

setInterval(() => {
    addEncryptButtonIfNeeded();
    decryptIncomingMessage();
}, CHECK_INTERVAL);