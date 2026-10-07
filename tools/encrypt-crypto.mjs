// Encrypts the password-protected "Crypto Platform" case study into public/crypto.enc.json.
//
//   CRYPTO_PASSWORD='...' npm run encrypt-crypto
//
// Inputs (git-ignored, kept only on your machine):
//   private/crypto-main.html      plaintext <main> of the case study
//   private/crypto-images/*       images used by that page
// Output (committed, safe to publish): public/crypto.enc.json (AES-GCM, key from PBKDF2-SHA256)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const password = process.env.CRYPTO_PASSWORD;
if (!password) {
  console.error('Set CRYPTO_PASSWORD, e.g.  CRYPTO_PASSWORD=... npm run encrypt-crypto');
  process.exit(1);
}

const imgDir = 'private/crypto-images';
const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
const images = {};
for (const file of readdirSync(imgDir)) {
  const ext = file.split('.').pop().toLowerCase();
  images[file] = { type: types[ext] ?? 'application/octet-stream', data: readFileSync(`${imgDir}/${file}`).toString('base64') };
}

// point image URLs at the in-memory copies; the gate script swaps them for blob: URLs after decrypting
let html = readFileSync('private/crypto-main.html', 'utf8');
for (const name of Object.keys(images)) html = html.replaceAll(`src="/images/${name}"`, `src="/images/crypto/${name}"`);

const iterations = 600_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
  material,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);
const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ html, images })));
const b64 = (buf) => Buffer.from(buf).toString('base64');
writeFileSync('public/crypto.enc.json', JSON.stringify({ v: 1, iterations, salt: b64(salt), iv: b64(iv), data: b64(cipher) }));
console.log(`Wrote public/crypto.enc.json (${Object.keys(images).length} images, ${(cipher.byteLength / 1e6).toFixed(1)} MB)`);
