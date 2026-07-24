const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');
const https = require('https'); // Native library, koi error nhi aayega

const app = express();

// Firebase initialization (Apna service account key file ensure kar lena)
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Uptime robot / Self-ping URL setup
const RENDER_URL = 'https://earnflow-backend-45gw.onrender.com/callback?uid=testuser&payout=1';

const robotPunchServer = () => {
    https.get(RENDER_URL, (res) => {
        console.log("ROBOT: Pani Wala Punch! Server Status:", res.statusCode);
    }).on('error', (e) => {
        console.log("ROBOT: Punching...");
    });
};

// Har 10 minute mein server ko active rakhne ke liye ping karega
setInterval(robotPunchServer, 600000);

// --- EXISTING ROUTES (Pubscale / Spawntp ya callback agar koi ho) ---
app.get('/callback', (req, res) => {
    res.status(200).send("Server is active and running!");
});

// --- NEW: AdGem Postback Route ---
app.get('/adgem-postback', async (req, res) => {
    try {
        const { user_id, amount, tx_id } = req.query;

        // Check kar le ki required parameters aaye hain ya nahi
        if (!user_id || !amount) {
            return res.status(400).send("Missing parameters");
        }

        console.log(`AdGem Offer Completed! User: ${user_id}, Amount: ${amount}, TxID: ${tx_id}`);

        // Firebase Firestore mein user ke wallet mein coins add karne ka code
        const userRef = admin.firestore().collection('users').doc(user_id);
        
        await admin.firestore().runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User does not exist in database!");
            }
            
            const currentBalance = userDoc.data().balance || 0;
            const newBalance = currentBalance + Number(amount);
            
            transaction.update(userRef, { balance: newBalance });
        });

        console.log(`Successfully credited ${amount} coins to user ${user_id}`);

        // AdGem ko success response dena zaroori hai
        res.status(200).send("OK");
    } catch (error) {
        console.error("AdGem Postback Error:", error.message || error);
        res.status(500).send("Internal Server Error");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server is running perfectly on port " + PORT));
