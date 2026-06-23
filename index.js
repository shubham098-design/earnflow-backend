const express = require('express');
const admin = require('firebase-admin');
const app = express();

// Firebase initialize karna
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Spawntap Callback Route
app.get('/callback', async (req, res) => {
    try {
        const userId = req.query.user_id; 
        const amount = parseInt(req.query.payout);
        const txnId = req.query.txn_id;

        if (!userId || !amount || !txnId) {
            console.log("Error: Missing parameters from Spawntap");
            return res.status(400).send("Missing data");
        }

        // Firebase mein coins update karna
        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                throw "User does not exist in database!";
            }
            
            let currentCoins = sfDoc.data().coins || 0;
            transaction.update(userRef, { coins: currentCoins + amount });
        });

        console.log("Success: Added " + amount + " coins to " + userId);
        res.status(200).send("1"); // Spawntap ko success bheja

    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("0");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
