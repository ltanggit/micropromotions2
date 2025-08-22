import express from 'express';
// import fetch from 'node-fetch';
import querystring from 'querystring';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES = '',
} = process.env;

function tokenBasicAuthHeader() {
  const b64 = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  return `Basic ${b64}`;
}

// Kick off OAuth
router.get('/connect', auth(true), async (req, res) => {
  const state = jwt.sign({ uid: req.user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const qs = querystring.stringify({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
    show_dialog: 'true',
  });
  return res.redirect(`https://accounts.spotify.com/authorize?${qs}`);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { uid } = jwt.verify(state, process.env.JWT_SECRET);

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': tokenBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Token exchange failed', detail: tokens });
    }

    // Who is this user?
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    const me = await meRes.json();

    // Save to your user
    const user = await User.findById(uid);
    const expiresAt = new Date(Date.now() + (tokens.expires_in - 60) * 1000); // pad -60s

    user.spotify = {
      spotifyUserId: me.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || user.spotify?.refreshToken,
      expiresAt,
    };
    await user.save();

    // Back to app
    return res.redirect('/worker/dashboard?connected=spotify');
  } catch (e) {
    console.error(e);
    return res.status(400).send('Spotify auth error');
  }
});

// Token refresh helper
async function ensureSpotifyToken(user) {
  if (!user.spotify?.accessToken) throw new Error('No Spotify connection');
  if (user.spotify.expiresAt && user.spotify.expiresAt > new Date()) return user.spotify.accessToken;

  // refresh
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': tokenBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: user.spotify.refreshToken,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Could not refresh Spotify token');
  user.spotify.accessToken = data.access_token;
  user.spotify.expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
  await user.save();
  return user.spotify.accessToken;
}

// (Premium path) Start playback of a track on a device (requires device_id & Premium)
router.post('/play', auth(true), async (req, res) => {
  try {
    const { trackUri, deviceId, positionMs = 0 } = req.body;
    const user = await User.findById(req.user.id);
    const token = await ensureSpotifyToken(user);

    const r = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uris: [trackUri],
        position_ms: positionMs,
      }),
    });

    if (r.status === 204) return res.json({ ok: true });
    const text = await r.text();
    return res.status(r.status).json({ error: 'play_failed', detail: text });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// (Fallback path) Check recently played for a track in last 50 plays
router.get('/recently-played/:trackId', auth(true), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const token = await ensureSpotifyToken(user);
    const r = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await r.json();
    const found = (data?.items || []).find(i => i.track?.id === req.params.trackId);
    return res.json({ played: !!found, foundAt: found?.played_at || null });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Token fetcher hits a tiny backend endpoint that returns the current Spotify access token (so the SDK can refresh via server)
router.get('/token', auth(true), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const token = await ensureSpotifyToken(user);
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});


export default router;
