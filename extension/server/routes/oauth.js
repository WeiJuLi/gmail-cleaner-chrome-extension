const express = require("express");
const axios = require("axios");
const router = express.Router();


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

router.get("/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) return res.status(400).send("Missing Code.");

    try {
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code"
        });

        const { access_token, refresh_token, expires_in } = tokenRes.data;

        // Save Token info later in DB or Redis, now just print it out.
        console.log("Access Token:", access_token);
        console.log("Refresh Token:", refresh_token);

        res.send("OAuth succeed!");

    } catch (err) {

    console.error("Token exchanging failed:", err.response?.data || err.message);
    res.status(500).send("Token exchanging failed");

    }
});

module.exports = router;