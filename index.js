const express = require('express');
const admin = require('firebase-admin');
const https = require('https'); // Native library, koi error nhi aayega
const app = express();

const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        res.status(500).send("0");
    }
});

// Pani wala robot (Native module use kiya hai, ab crash nhi hoga)
const RENDER_URL = 'https://earnflow-backend-45gw.onrender.com/callback?uid=testuser&payout=1';

const robotPunchServer = () => {
    https.get(RENDER_URL, (res) => {
        console.log("ROBOT: Pani Wala Punch! Server Status:", res.statusCode);
    }).on('error', (e) => {
        console.log("ROBOT: Punching...");
    });
};

setInterval(robotPunchServer, 600000); 

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server is running perfectly on port " + PORT));
