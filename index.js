const express = require('express');
const admin = require('firebase-admin');
const app = express();

// 1. Firebase ko connect karna
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. PubScale ka URL (Callback Endpoint)
app.get('/pubscale-callback', async (req, res) => {
    try {
        const userId = req.query.user_id; 
        const amount = parseInt(req.query.amount);

        if (!userId || !amount) {
            return res.status(400).send("Missing data");
        }

        // 3. Firebase mein User ke Coins Update karna
        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                throw "User does not exist!";
            }
            
            let newCoins = (sfDoc.data().coins || 0) + amount;
            transaction.update(userRef, { coins: newCoins });
        });

        console.log("Success: Added " + amount + " coins to user " + userId);
        res.status(200).send("1"); 

    } catch (error) {
        console.error("Error updating coins:", error);
        res.status(500).send("0");
    }
});

// Port configuration Render ke liye
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
