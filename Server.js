// Mercury Bridge Server
// Run with: node server.js
// Requires Node.js - install with: npm install express cors

const express = require("express");
const cors    = require("cors");
const app     = express();
const PORT    = 7331;

app.use(cors());
app.use(express.json());

// Stores pending scripts per player
let pendingScripts = {}; // { [userId]: [scriptString, ...] }
let connectedPlayers = {}; // { [userId]: lastSeen }

// ── Mercury C# posts here to send a script ───────────────────────────
// POST /execute  body: { script: "...", userId: "all" or "12345678" }
app.post("/execute", (req, res) => {
    const { script, userId } = req.body;

    if (!script) {
        return res.status(400).json({ error: "No script provided" });
    }

    const target = userId || "all";

    if (target === "all") {
        // Send to every connected player
        for (const uid in connectedPlayers) {
            if (!pendingScripts[uid]) pendingScripts[uid] = [];
            pendingScripts[uid].push(script);
        }
        console.log("[Execute] Script queued for ALL players (" + Object.keys(connectedPlayers).length + " online)");
    } else {
        if (!pendingScripts[target]) pendingScripts[target] = [];
        pendingScripts[target].push(script);
        console.log("[Execute] Script queued for player " + target);
    }

    res.json({ success: true, target: target });
});

// ── Roblox polls here to get pending scripts ─────────────────────────
// GET /poll?userId=12345678
app.get("/poll", (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: "No userId provided" });
    }

    // Mark player as connected
    connectedPlayers[userId] = Date.now();

    const scripts = pendingScripts[userId] || [];
    pendingScripts[userId] = []; // clear after delivering

    res.json({ scripts: scripts });
});

// ── Get connected players (for Mercury UI) ───────────────────────────
// GET /players
app.get("/players", (req, res) => {
    // Remove players not seen in last 15 seconds
    const now = Date.now();
    for (const uid in connectedPlayers) {
        if (now - connectedPlayers[uid] > 15000) {
            delete connectedPlayers[uid];
            delete pendingScripts[uid];
        }
    }
    res.json({ players: Object.keys(connectedPlayers) });
});

// ── Health check ─────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "Mercury Bridge online", port: PORT });
});

app.listen(PORT, () => {
    console.log("=================================");
    console.log("  Mercury Bridge Server");
    console.log("  Running on http://localhost:" + PORT);
    console.log("=================================");
    console.log("Waiting for Roblox connection...");
});
