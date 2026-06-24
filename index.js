const express = require('express');
const admin = require('firebase-admin');
const app = express();

// Firebase setup
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Callback endpoint for both Spawntap and PubScale
app.get('/callback', async (req, res) => {
    try {
        console.log("Full Incoming Request:", req.query);

        // Parameters: Spawntap bhejta hai 'user_id', 'payout'. PubScale bhej sakta hai 'sub_id' ya 'user_id'.
        const userId = req.query.user_id || req.query.sub_id;
        const amount = parseFloat(req.query.payout || req.query.amount || 0);

        if (!userId || amount <= 0) {
            console.log("Error: Invalid data received");
            return res.status(400).send("Invalid request parameters");
        }

        const userRef = db.collection('users').doc(userId);

        // Database transaction: Coins update karne ke liye
        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                throw new Error("User does not exist in database!");
            }

            const currentCoins = sfDoc.data().coins || 0;
            transaction.update(userRef, { coins: currentCoins + amount });
        });

        console.log(`Success: Added ${amount} coins to ${userId}`);
        res.status(200).send("1"); // 1 means Success

    } catch (error) {
        console.error("Critical Error:", error.message);
        res.status(500).send("0"); // 0 means Error
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server is running perfectly on port " + PORT);
});
