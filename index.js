const express = require('express');
const admin = require('firebase-admin');
const app = express();

// Firebase initialize
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Unified Callback Endpoint
app.get('/callback', async (req, res) => {
    try {
        console.log("Full Incoming Request:", req.query);

        // PubScale bhejta hai 'user_id' aur 'value'
        // Spawntap bhejta hai 'user_id' aur 'payout'
        // Hum sab handle karenge
        const userId = req.query.user_id || req.query.sub_id;
        const amount = parseFloat(req.query.value || req.query.payout || req.query.amount || 0);

        if (!userId || amount <= 0) {
            console.log("Error: Invalid data received. Amount:", amount, "User:", userId);
            return res.status(400).send("Invalid request parameters");
        }

        const userRef = db.collection('users').doc(userId);

        // Transaction se coins add karo (Safe method)
        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                throw new Error("User does not exist in database!");
            }

            const currentCoins = sfDoc.data().coins || 0;
            transaction.update(userRef, { coins: currentCoins + amount });
        });

        console.log(`Success: Added ${amount} coins to user: ${userId}`);
        res.status(200).send("1"); // PubScale/Spawntap ko success bhejo

    } catch (error) {
        console.error("Critical Error:", error.message);
        res.status(500).send("0");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server is running perfectly on port " + PORT);
});
