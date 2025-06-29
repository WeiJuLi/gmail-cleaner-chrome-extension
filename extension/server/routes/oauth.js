const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

router.post('/callback', async (req, res) => {
  const code = req.body.code;

  if (!code) return res.status(400).send('Missing code.');

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI, // ❗直接原字串，這裡不用自己 encode
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    return res.json({ access_token, refresh_token, expires_in });
  } catch (err) {
    console.error('❌ Token exchange failed:', err.response?.data || err.message);
    return res.status(500).json({ error: "Token exchange failed" });
  }
});

module.exports = router;
