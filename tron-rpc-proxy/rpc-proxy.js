const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 9090;

// Configure endpoints
const LOCAL_NODE = 'http://127.0.0.1:8090'; // Your Tron Fusion local node inside Docker
const GETBLOCK_RPC = 'https://go.getblock.us/2f2083fae5e14f419ac3f1a83a1f8568'; // GetBlock mainnet

app.use(bodyParser.json());

// Helper to detect if request is for private test network
function isPrivateRequest(reqBody) {
    // Example: forward wallet/getaccount for your private addresses to local node
    if (!reqBody || !reqBody.method) return false;

    const privateMethods = ['wallet/getaccount', 'wallet/getnowblock', 'wallet/getblockbynum'];
    return privateMethods.includes(reqBody.method);
}

app.post('/', async (req, res) => {
    try {
        const targetNode = isPrivateRequest(req.body) ? LOCAL_NODE : GETBLOCK_RPC;

        const response = await axios.post(targetNode, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });

        res.json(response.data);
    } catch (err) {
        console.error('RPC Proxy Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Tron RPC Proxy running on http://127.0.0.1:${PORT}`);
    console.log(`Forwarding private requests to ${LOCAL_NODE}`);
    console.log(`Forwarding other requests to ${GETBLOCK_RPC}`);
});

