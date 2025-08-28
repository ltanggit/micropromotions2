// backend/utils/isHttps.js
export function isHttps(req) {
  return req.secure || req.get('x-forwarded-proto') === 'https';
}
