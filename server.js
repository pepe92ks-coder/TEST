const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 7331;  // Railway asigna process.env.PORT automáticamente

app.use(cors({ origin: "*" }));         // permite cualquier origen (útil para Roblox + tu PC)
app.use(express.json());

// Almacenamiento en memoria (se pierde al reiniciar el contenedor en Railway free)
let pending = {};   // { userId: [script1, script2, ...] , "all": [...] }
let players = {};   // { userId: lastSeenTimestamp }

// ── POST /execute ── desde tu programa C#
app.post("/execute", (req, res) => {
    const { script, userId } = req.body;

    if (!script || typeof script !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'script'" });
    }

    const target = (userId || "all").trim();

    if (target === "all") {
        const knownPlayers = Object.keys(players);
        if (knownPlayers.length === 0) {
            if (!pending["all"]) pending["all"] = [];
            pending["all"].push(script);
            console.log(`[EXECUTE] No players → queued for 'all': ${script.substring(0, 60)}...`);
        } else {
            knownPlayers.forEach(uid => {
                if (!pending[uid]) pending[uid] = [];
                pending[uid].push(script);
            });
            console.log(`[EXECUTE] Queued for ${knownPlayers.length} players: ${script.substring(0, 60)}...`);
        }
    } else {
        if (!pending[target]) pending[target] = [];
        pending[target].push(script);
        console.log(`[EXECUTE] Queued for ${target}: ${script.substring(0, 60)}...`);
    }

    res.json({ success: true, target, queued: (pending[target]?.length || 0) });
});

// ── GET /poll?userId=XXXX ── desde Roblox
app.get("/poll", (req, res) => {
    const userId = (req.query.userId || "").trim();

    if (!userId) {
        return res.status(400).json({ error: "Missing userId query param" });
    }

    // Registrar que este jugador está online
    players[userId] = Date.now();

    let scriptsToSend = [];

    // Scripts específicos para este userId
    if (pending[userId] && pending[userId].length > 0) {
        scriptsToSend = scriptsToSend.concat(pending[userId]);
        pending[userId] = [];
    }

    // Scripts globales ("all")
    if (pending["all"] && pending["all"].length > 0) {
        scriptsToSend = scriptsToSend.concat(pending["all"]);
        pending["all"] = [];
    }

    if (scriptsToSend.length > 0) {
        console.log(`[POLL] Delivered ${scriptsToSend.length} script(s) to ${userId}`);
    }

    res.json({ scripts: scriptsToSend });
});

// ── GET /status ── para debug y ver cuántos están conectados
app.get("/status", (req, res) => {
    const now = Date.now();

    // Limpiar jugadores inactivos (>15 segundos sin poll)
    Object.keys(players).forEach(uid => {
        if (now - players[uid] > 15000) {
            delete players[uid];
        }
    });

    res.json({
        online_players: Object.keys(players),
        online_count: Object.keys(players).length,
        pending: Object.fromEntries(
            Object.entries(pending).map(([k, v]) => [k, v.length])
        )
    });
});

// Raíz (para verificar que el servidor vive)
app.get("/", (req, res) => {
    res.json({ status: "Mercury Bridge online", port: PORT, env: process.env.NODE_ENV || "development" });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log("========================================");
    console.log(` Mercury Bridge running on port ${PORT}`);
    console.log(" URL base: https://test-production-bcc9.up.railway.app");
    console.log("========================================");
});
