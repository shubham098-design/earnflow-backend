app.get('/callback', async (req, res) => {
    try {
        console.log("Full Request Data:", req.query); // Yahan se pata chalega kya data aa raha hai
        
        const userId = req.query.user_id; 
        const amount = parseFloat(req.query.payout); // Float use kiya hai decimal ke liye

        if (!userId) {
            console.log("Error: No user_id received");
            return res.status(400).send("Missing user_id");
        }

        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(userRef);
            if (!sfDoc.exists) {
                throw "User not found with ID: " + userId;
            }
            
            let currentCoins = sfDoc.data().coins || 0;
            transaction.update(userRef, { coins: currentCoins + amount });
        });

        res.status(200).send("1");

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        res.status(500).send("0");
    }
});
