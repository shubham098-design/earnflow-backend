const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios'); 
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

// Yahan dekho maine ' ' (quotes) sahi kar diye hain
const RENDER_URL = 'https://earnflow-backend-45gw.onrender.com/callback?uid=testuser&payout=1'; 

const robotPunchServer = async () => {
    try {
        await axios.get(RENDER_URL);
        console.log("ROBOT: Pani Wala Punch! Server is awake.");
    } catch (error) {
        console.log("ROBOT: Punching...");
    }
};

setInterval(robotPunchServer, 600000); 

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server is running perfectly on port " + PORT));
