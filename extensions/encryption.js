/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension finds any content between double braces {{like_this}} and looks for a page with a matching
// slug. If found, the braced content will be replaced with the content of the target page within an `article`
// tag with a class of `transclusion` so it can be targeted and styled.

const storageKey = "wikey";

function fromHexString(hexString){
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function toHexString(bytes){
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

function fromBase64String(base64String) {
  return Uint8Array.from(atob(base64String), (m) => m.codePointAt(0));
}

function toBase64String(bytes) {
  return btoa(String.fromCodePoint(...bytes));
}

async function saveKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const objKey = await crypto.subtle.exportKey("jwk", key);
  const strKey = JSON.stringify(objKey);

  localStorage.setItem(storageKey, strKey);
  return key;
}

export async function loadKey() {
  const strKey = localStorage.getItem(storageKey);
  if (strKey) {
    const objKey = JSON.parse(strKey);
    const key = await crypto.subtle.importKey(
      "jwk",
        objKey,
      {
        name: "AES-GCM",
      },
      true,
      ["encrypt", "decrypt"]
    );
    return key;
  }
  else{
    return await saveKey();
  }
}

export async function encrypt(message, key) {
  const encoded = (new TextEncoder()).encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encoded
  );

  //const hexString = toHexString(iv) + toHexString(new Uint8Array(ciphertext));
  const hexString = toBase64String(iv) + toBase64String(new Uint8Array(ciphertext));
  return hexString; 
}

export async function decrypt(hexString, key) {
  //let ciphertext = fromHexString(hexString);
  let ciphertext = fromBase64String(hexString);
  let iv = ciphertext.slice(0, 12);
  ciphertext = ciphertext.slice(12);
  let decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    ciphertext
  );
  const message = (new TextDecoder()).decode(decrypted);
  return message;
}

(function encryptionExtension () {
  if (!window.FW || !window.FW._loaded) return setTimeout(encryptionExtension, 1); // wait until FW is mounted
  const { state, emitter } = window.FW;
  state.tDepth = 0;
  state.tDepthMax = 20; // Maximum depth to check for transclusion
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      state.tDepth = 0;
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        injectEncryption();
      }, 300);
    });
  });
  emitter.emit('DOMContentLoaded');

  function injectEncryption() {
    console.log("injectEncryption");

    if (!!document.getElementById('testButton')) return;
    const button = html`
    <button id="testButton" class="btn btn-primary" onclick=${async () => {
      console.log("test");
      const key = await loadKey();
      const hexString = await encrypt("abcd", key);

      const text2 = await decrypt(hexString, key);
      console.log(text2);
    }}>Test</button>`;

    const nav = document.querySelector('.sb nav');
    nav.parentNode.insertBefore(button, nav);
  }
})();
