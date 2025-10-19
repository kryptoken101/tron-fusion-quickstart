import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const PORT = 9091;
const AUTH_TOKEN = "tron-fusion"; // Token required for RPC access

// Local FullNode RPC
const LOCAL_RPC = "http://127.0.0.1:8090";

// GetBlock fallback URLs
const GETBLOCK_RPC = {
  mainnet: "https://go.getblock.us/2f2083fae5e14f419ac3f1a83a1f8568",
  testnet: "https://go.getblock.io/bca480c9c1274f31bd41e63e1dd72731"
};

// ---------------------------
// Token Authentication
// ---------------------------
app.use((req, res, next) => {
  const token = req.headers['getblock_token'];
  if (token !== AUTH_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized: invalid token' });
  }
  next();
});

// ---------------------------
// Helper: forward request
// ---------------------------
async function forwardRpc(url, body) {
  try {
    const response = await axios.post(url, body, { timeout: 3000 });
    return response.data;
  } catch (err) {
    console.warn(`⚠️ RPC failed at ${url}: ${err.message}`);
    return null;
  }
}

// ---------------------------
// JSON-RPC Endpoint
// ---------------------------
app.post('/trx/:network/fullnodeJsonRpc', async (req, res) => {
  const network = req.params.network.toLowerCase();

  // Try local RPC first
  let result = await forwardRpc(LOCAL_RPC, req.body);

  // Fallback to GetBlock
  if (!result) {
    const fallbackUrl = GETBLOCK_RPC[network];
    if (!fallbackUrl) {
      return res.status(500).json({ error: "No fallback RPC for this network" });
    }

    try {
      const response = await axios.post(fallbackUrl, req.body, { timeout: 5000 });
      result = response.data;
    } catch (err) {
      return res.status(500).json({
        error: "Both local and GetBlock RPC failed",
        details: err.message
      });
    }
  }

  res.json(result);
});

// ---------------------------
// Start proxy server
// ---------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Tron Fusion RPC Proxy running on port ${PORT}`);
  console.log(`🔑 Token: ${AUTH_TOKEN}`);
  console.log(`⚡ Local RPC: ${LOCAL_RPC}`);
  console.log(`⚡ GetBlock fallback URLs:`, GETBLOCK_RPC);
});

