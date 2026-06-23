const express = require('express');
const admin = require('firebase-admin');
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
        console.log("Request Query:", req.query);
        
        const userId = req.query.user_id; 
        const amount = parseFloat(req.query.payout);

        if (!userId || isNaN(amount)) {
            return res.status(400).send("Missing parameters");
        }

        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                throw new Error("User not found");
            }
            let currentCoins = sfDoc.data().coins || 0;
            transaction.update(userRef, { coins: currentCoins + amount });
        });

        res.status(200).send("1");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("0");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
