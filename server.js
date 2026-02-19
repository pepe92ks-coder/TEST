const express = require("express");
const cors    = require("cors");
const app     = express();
const PORT    = process.env.PORT || 7331;

app.use(cors());
app.use(express.json());

let pending = {};
let players = {};

// ── POST /execute  ← from Mercury C# ────────────────────────────────
app.post("/execute", (req, res) => {
    const { script, userId } = req.body;
    if (!script) return res.status(400).json({ error: "No script" });

    const target = (userId || "all").trim();

    if (target === "all") {
        const known = Object.keys(players);
        if (known.length === 0) {
            if (!pending["all"]) pending["all"] = [];
            pending["all"].push(script);
            console.log("[Execute] No players online, queued under 'all': " + script);
        } else {
            known.forEach(uid => {
                if (!pending[uid]) pending[uid] = [];
                pending[uid].push(script);
            });
            console.log("[Execute] Queued for " + known.length + " player(s): " + script);
        }
    } else {
        if (!pending[target]) pending[target] = [];
        pending[target].push(script);
        console.log("[Execute] Queued for " + target + ": " + script);
    }

    res.json({ success: true, target: target, script: script });
});

// ── GET /poll?userId=XXXX  ← from Roblox ────────────────────────────
app.get("/poll", (req, res) => {
    const userId = (req.query.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "No userId" });

    players[userId] = Date.now();

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
        console.log("[Poll] Delivering " + scripts.length + " script(s) to " + userId + ": " + scripts.join(" | "));

    res.json({ scripts: scripts });
});

// ── GET /status ───────────────────────────────────────────────────────
app.get("/status", (req, res) => {
    const now = Date.now();
    Object.keys(players).forEach(uid => {
        if (now - players[uid] > 15000) delete players[uid];
    });
    res.json({
        online_players: Object.keys(players),
        pending: Object.fromEntries(Object.entries(pending).map(([k,v]) => [k, v.length]))
    });
});

// ── GET / ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "Mercury Bridge online", port: PORT });
});

app.listen(PORT, () => {
    console.log("================================");
    console.log("  Mercury Bridge  |  Port " + PORT);
    console.log("================================");
});
