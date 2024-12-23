export async function importPublicKey(jwk) {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ['encrypt']
    );
}

export async function importPrivateKey(jwk) {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ['decrypt']
    );
}

export async function generateSymmetricKey() {
    return await window.crypto.subtle.generateKey(
        {name: 'AES-GCM', length: 256},
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encryptMessage(symKey, message) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        symKey,
        encoder.encode(message)
    );
    return { ciphertext, iv };
}

export async function decryptMessage(symKey, ciphertext, iv) {
    const decoder = new TextDecoder();
    const plaintext = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        symKey,
        ciphertext
    );
    return decoder.decode(plaintext);
}

export async function encryptSymKey(pubKey, symKey) {
    const rawSymKey = await window.crypto.subtle.exportKey('raw', symKey);
    return window.crypto.subtle.encrypt({name: 'RSA-OAEP'}, pubKey, rawSymKey);
}

export async function decryptSymKey(privKey, encSymKey) {
    const rawSymKey = await window.crypto.subtle.decrypt(
        {name: 'RSA-OAEP'},
        privKey,
        encSymKey
    );
    return window.crypto.subtle.importKey(
        'raw',
        rawSymKey,
        { name: 'AES-GCM', length: 256},
        true,
        ['encrypt', 'decrypt']
    );
}

// Utility for base64 conversions
export function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i=0; i<binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}