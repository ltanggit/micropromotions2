// backend/routes/spotifyRoutes.js
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

/* =========================
   ENV & CONSTANTS
========================= */
const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI, // e.g. https://<tunnel>.trycloudflare.com/api/spotify/callback
} = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  console.warn('[spotify] Missing required envs: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REDIRECT_URI');
}

const STATE_COOKIE = 'spotify_oauth_state';
const ACCESS_COOKIE = 'spotify_access';
const REFRESH_COOKIE = 'spotify_refresh';

// The SDK needs streaming + playback scopes:
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

/* =========================
   HELPERS
========================= */
function isHttps(req) {
  // when proxied (Cloudflare), trust the forwarded proto
  return (req.headers['x-forwarded-proto'] || '').toString().includes('https');
}

function cookieOpts(req, overrides = {}) {
  // Allow cookies across all routes (VERY IMPORTANT for callback to read them)
  return {
    httpOnly: true,        // protect against XSS; we’ll expose via /api/spotify/token endpoint
    sameSite: 'lax',       // lets OAuth redirect work
    secure: isHttps(req),  // true on Cloudflare tunnel
    path: '/',             // DO NOT narrow to /api/spotify, or callback won't see it
    ...overrides,
  };
}

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    state,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  });

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    body.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      timeout: 10000,
    }
  );

  return data; // { access_token, refresh_token, expires_in, token_type, scope }
}

async function refreshTokens(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    body.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      timeout: 10000,
    }
  );

  return data; // { access_token, token_type, scope, expires_in, refresh_token? }
}

/* =========================
   ROUTES
========================= */

/**
 * GET /api/spotify/login?returnTo=/spotify/connect
 * - Creates a CSRF state
 * - Stores it in a cookie
 * - Redirects to Spotify authorize
 */
// router.get('/login', (req, res) => {
//   try {
//     const returnTo = (req.query.returnTo || '/').toString();
//     // simple CSRF token
//     const csrf = crypto.randomBytes(16).toString('hex');
//     const stateValue = `${csrf}|${encodeURIComponent(returnTo)}`;

//     // Write state cookie at ROOT so callback can read it.
//     res.cookie(STATE_COOKIE, stateValue, cookieOpts(req, { maxAge: 10 * 60 * 1000 }));

//     const url = buildAuthorizeUrl(csrf);
//     return res.redirect(url);
//   } catch (err) {
//     console.error('[spotify/login] error:', err);
//     return res.status(500).json({ error: 'spotify_login_failed' });
//   }
// });

/**
 * GET /api/spotify/callback?code=...&state=csrf|%2FreturnPath
 * - Validates state matches cookie
 * - Exchanges code for tokens
 * - Stores access & refresh tokens in httpOnly cookies
 * - Redirects back to returnTo
 */
// router.get('/callback', async (req, res) => {
//   try {
//     const stateFromSpotify = (req.query.state || '').toString();
//     const code = (req.query.code || '').toString();

//     // Expect "csrf|returnTo"
//     const [csrfFromQuery, returnToRaw] = stateFromSpotify.split('|');

//     // Must have a state cookie written by /login
//     const stateCookie = req.cookies?.[STATE_COOKIE];
//     if (!stateCookie) {
//       console.warn('[spotify/callback] Missing state cookie');
//       return res.status(400).send('Invalid state');
//     }
//     const [csrfFromCookie] = stateCookie.split('|');

//     if (!csrfFromQuery || !csrfFromCookie || csrfFromQuery !== csrfFromCookie) {
//       console.warn('[spotify/callback] Invalid state comparison', {
//         csrfFromQuery, csrfFromCookie,
//       });
//       // Clear the stale cookie so subsequent attempts work
//       res.clearCookie(STATE_COOKIE, cookieOpts(req));
//       return res.status(400).send('Invalid state');
//     }

//     if (!code) {
//       res.clearCookie(STATE_COOKIE, cookieOpts(req));
//       return res.status(400).send('Missing code');
//     }

//     // Exchange code for tokens
//     const tokenData = await exchangeCodeForTokens(code);

//     // Save tokens in cookies
//     // Access token short-lived; refresh token long-lived
//     res.cookie(ACCESS_COOKIE, tokenData.access_token, cookieOpts(req, { maxAge: tokenData.expires_in * 1000 }));
//     if (tokenData.refresh_token) {
//       res.cookie(REFRESH_COOKIE, tokenData.refresh_token, cookieOpts(req, { maxAge: 30 * 24 * 3600 * 1000 }));
//     }

//     // Clean up state cookie
//     res.clearCookie(STATE_COOKIE, cookieOpts(req));

//     const returnTo = decodeURIComponent(returnToRaw || '/') || '/';
//     return res.redirect(returnTo);
//   } catch (err) {
//     console.error('[spotify/callback] error:', err?.response?.data || err);
//     // ensure state cookie isn’t left lying around
//     res.clearCookie(STATE_COOKIE, cookieOpts(req));
//     return res.status(500).send('Spotify auth failed');
//   }
// });

/**
 * GET /api/spotify/token
 * - Returns a fresh access token (refreshing if needed).
 * - This is what your frontend should call to obtain a token for the Web Playback SDK.
 */
// router.get('/token', async (req, res) => {
//   try {
//     let access = req.cookies?.[ACCESS_COOKIE] || '';
//     const refresh = req.cookies?.[REFRESH_COOKIE] || '';

//     // If we have no tokens at all -> 401 so UI can send user to /api/spotify/login
//     if (!access && !refresh) {
//       return res.status(401).json({ error: 'not_authenticated' });
//     }

//     // If we have an access token, return it directly.
//     if (access) {
//       return res.json({ access_token: access });
//     }

//     // No access token but we have a refresh token -> refresh it
//     if (refresh) {
//       const data = await refreshTokens(refresh);
//       access = data.access_token;
//       // Update cookie expiry for new access token
//       res.cookie(ACCESS_COOKIE, access, cookieOpts(req, { maxAge: data.expires_in * 1000 }));
//       // Spotify may return a new refresh_token; if so, persist it
//       if (data.refresh_token) {
//         res.cookie(REFRESH_COOKIE, data.refresh_token, cookieOpts(req, { maxAge: 30 * 24 * 3600 * 1000 }));
//       }
//       return res.json({ access_token: access });
//     }

//     return res.status(401).json({ error: 'not_authenticated' });
//   } catch (err) {
//     console.error('[spotify/token] error:', err?.response?.data || err);
//     return res.status(500).json({ error: 'token_fetch_failed' });
//   }
// });

/**
 * POST /api/spotify/logout
 * - Clears cookies
 */
// router.post('/logout', (req, res) => {
//   try {
//     res.clearCookie(ACCESS_COOKIE, cookieOpts(req));
//     res.clearCookie(REFRESH_COOKIE, cookieOpts(req));
//     res.clearCookie(STATE_COOKIE, cookieOpts(req));
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error('[spotify/logout] error:', err);
//     return res.status(500).json({ error: 'logout_failed' });
//   }
// });

/**
 * (Optional) GET /api/spotify/me  — for testing that token works
 */
// router.get('/me', async (req, res) => {
//   try {
//     const access = req.cookies?.[ACCESS_COOKIE];
//     if (!access) return res.status(401).json({ error: 'no_access_token' });
//     const { data } = await axios.get('https://api.spotify.com/v1/me', {
//       headers: { Authorization: `Bearer ${access}` },
//     });
//     return res.json(data);
//   } catch (err) {
//     console.error('[spotify/me] error:', err?.response?.data || err);
//     return res.status(500).json({ error: 'me_failed' });
//   }
// });

export default router;
