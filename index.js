// index.js (COMPLETE UPDATED CODE)

const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios'); // ROBOT KE LIYE NAWI LIBRARY
const app = express();

// Firebase initialize
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. Unified Callback Endpoint (FIXED SPAWNTAP REWARDS)
// ==========================================
app.get('/callback', async (req, res) => {
    try {
        console.log("Full Incoming Request:", req.query);

        // PubScale mapping
        let userId = req.query.user_id;
        let amount = parseFloat(req.query.value || 0);

        // --- NEW SPAWNTAP MAPPING START ---
        // Agar PubScale data nahi hai, toh Spawntap check karo
        if (!userId) {
            userId = req.query.uid; // Spawntap bhejta hai uid
        }
        if (amount <= 0) {
            amount = parseFloat(req.query.payout || req.query.reward_amount || 0); // Spawntap parameters
        }
        // --- NEW SPAWNTAP MAPPING END ---

        // Debugging check
        console.log("Final Extracted Data -> User:", userId, "Amount:", amount);

        if (!userId || amount <= 0) {
            console.log("Error: Invalid data received. Amount:", amount, "User:", userId);
            return res.status(400).send("Invalid request parameters");
        }

        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                // If user doesn't exist, create it (best practice for testing)
                transaction.set(userRef, { coins: amount });
            } else {
                const currentCoins = sfDoc.data().coins || 0;
                transaction.update(userRef, { coins: currentCoins + amount });
            }
        });

        console.log(`Success: Added ${amount} coins to user: ${userId}`);
        res.status(200).send("1"); // Both PubScale & Spawntap need success signal

    } catch (error) {
        console.error("Critical Error:", error.message);
        res.status(500).send("0");
    }
});

// ==========================================
// 2. THE ROBOT (Pani Wala Punch) CODE
// ==========================================

// APNA RENDER URL YAHAN DAALO
const RENDER_URL = https://earnflow-backend-45gw.onrender.com'; // Robot is URL ko hit karega

const robotPunchServer = async () => {
    try {
        const response = await axios.get(RENDER_URL);
        console.log("ROBOT: Pani Wala Punch! Server is awake. Status:", response.status);
    } catch (error) {
        console.error("ROBOT: Punch Failed (But it's probably just keeping it awake). Error:", error.message);
    }
};

// Har 10 minute (600,000 ms) mein robot chalega
setInterval(robotPunchServer, 600000); 
console.log("ROBOT: Pani Wala Punch active. Har 10 min mein server jaagega!");

// ==========================================

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server is running perfectly on port " + PORT);
});
