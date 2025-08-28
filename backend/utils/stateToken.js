import crypto from 'crypto';

const ALG = 'sha256';
const ENC = 'base64url'; // Node 18+ supports 'base64url'

export function makeState({ returnTo = '/' }, secret) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ nonce, returnTo });
  const sig = crypto.createHmac(ALG, secret).update(payload).digest(ENC);
  const token = Buffer.from(payload).toString(ENC) + '.' + sig;
  return token; // e.g. eyJub25jZSI6Ii4uLiJ9.abcd...
}

export function parseState(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('bad_state');
  }
  const [payloadB64, sig] = token.split('.');
  const payloadJson = Buffer.from(payloadB64, ENC).toString();
  const expected = crypto.createHmac(ALG, secret).update(payloadJson).digest(ENC);
  // constant-time compare
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('bad_state_sig');
  }
  const obj = JSON.parse(payloadJson);
  if (!obj?.nonce) throw new Error('bad_state_payload');
  return obj; // { nonce, returnTo }
}
