const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');
const https = require('https');

const app = express();

// Firebase initialization
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CALLBACK ROUTE (Spawtap / Pubscale) ---
app.get('/callback', async (req, res) => {
    try {
        const userId = req.query.user_id || req.query.uid;
        const amount = parseFloat(req.query.value || req.query.payout || req.query.amount || 0);

        if (!userId || amount <= 0) {
            return res.status(400).send("Invalid data");
        }

        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            const currentCoins = sfDoc.exists ? (sfDoc.data().coins || 0) : 0;
            transaction.set(userRef, { coins: currentCoins + amount }, { merge: true });
        });

        res.status(200).send("1");
    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("0");
    }
});

// --- NEW ROUTE: MYLEAD OFFERWALL POSTBACK ---
app.get('/mylead-callback', async (req, res) => {
    try {
        const userId = req.query.user_id;
        // MyLead se aane wale points ko float/int mein convert karna
        const amount = parseFloat(req.query.coins || 0); 
        const status = req.query.status;

        // MyLead mein status '1' ka matlab hota hai task successfully approved/completed hai
        if (status !== '1') {
            return res.status(200).send("Status not approved");
        }

        if (!userId || amount <= 0) {
            return res.status(400).send("Invalid data");
        }

        // Firebase Firestore mapping (Aapke original rules ke hisaab se)
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            const currentCoins = sfDoc.exists ? (sfDoc.data().coins || 0) : 0;
            transaction.set(userRef, { coins: currentCoins + amount }, { merge: true });
        });

        // MyLead ko '1' respond karna zaroori hai taaki wo samajh jaye ki server ne data le liya hai
        res.status(200).send("1");
    } catch (error) {
        console.error("MyLead Callback Error:", error);
        res.status(500).send("0");
    }
});

// --- PING ROBOT (Render Server ko active rakhne ke liye) ---
const RENDER_URL = 'https://earnflow-backend-45gw.onrender.com/callback?uid=testuser&payout=1';

const robotPunchServer = () => {
    https.get(RENDER_URL, (res) => {
        console.log(`Self-ping server status: ${res.statusCode}`);
    }).on('error', (err) => {
        console.error('Self-ping error:', err.message);
    });
};

setInterval(robotPunchServer, 600000); // Har 10 minute mein ping karega

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server is running perfectly on port " + PORT));
