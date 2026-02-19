const express = require("express");
const cors    = require("cors");
const app     = express();
const PORT    = process.env.PORT || 7331;

app.use(cors());
app.use(express.json());

// { userId: [scripts...] }
let pending = {};
// { userId: timestamp }
let players = {};

// ── POST /execute  ← from Mercury C# ────────────────────────────────
app.post("/execute", (req, res) => {
    const { script, userId } = req.body;
    if (!script) return res.status(400).json({ error: "No script" });

    const target = (userId || "all").trim();

    if (target === "all") {
        // Queue for every known player
        const known = Object.keys(players);
        if (known.length === 0) {
            // No players connected yet — store under "all" as fallback
            if (!pending["all"]) pending["all"] = [];
            pending["all"].push(script);
            console.log("[Execute] No players online yet, queued under 'all'");
        } else {
            known.forEach(uid => {
                if (!pending[uid]) pending[uid] = [];
                pending[uid].push(script);
            });
            console.log("[Execute] Queued for " + known.length + " player(s): " + known.join(", "));
        }
    } else {
        if (!pending[target]) pending[target] = [];
        pending[target].push(script);
        console.log("[Execute] Queued for userId: " + target);
    }

    res.json({ success: true, target: target, online: Object.keys(players) });
});

// ── GET /poll?userId=XXXX  ← from Roblox ────────────────────────────
app.get("/poll", (req, res) => {
    const userId = (req.query.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "No userId" });

    // Register player as online
    players[userId] = Date.now();

    // Collect scripts: ones sent to this specific userId + ones sent to "all"
    let scripts = [];

    if (pending[userId] && pending[userId].length > 0) {
        scripts = scripts.concat(pending[userId]);
        pending[userId] = [];
    }

    if (pending["all"] && pending["all"].length > 0) {
        scripts = scripts.concat(pending["all"]);
        pending["all"] = [];
    }

    if (scripts.length > 0)
        console.log("[Poll] Delivering " + scripts.length + " script(s) to userId: " + userId);

    res.json({ scripts: scripts });
});

// ── GET /status  ← debug ─────────────────────────────────────────────
app.get("/status", (req, res) => {
    const now = Date.now();
    // Remove stale players (no poll in 15s)
    Object.keys(players).forEach(uid => {
        if (now - players[uid] > 15000) {
            delete players[uid];
        }
    });
    res.json({
        online_players: Object.keys(players),
        pending_counts: Object.fromEntries(
            Object.entries(pending).map(([k, v]) => [k, v.length])
        )
    });
});

// ── GET /  ── health check ───────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "Mercury Bridge online", port: PORT });
});

app.listen(PORT, () => {
    console.log("================================");
    console.log("  Mercury Bridge  |  Port " + PORT);
    console.log("================================");
});
