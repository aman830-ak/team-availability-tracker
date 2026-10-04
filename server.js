const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./team.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS team (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        role TEXT,
        isAvailable INTEGER
    )`);

    db.get("SELECT COUNT(*) AS count FROM team", (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO team (name, role, isAvailable) VALUES (?, ?, ?)");
            stmt.run("Alice Johnson", "Frontend Engineer", 1);
            stmt.run("Bob Smith", "Backend Engineer", 0);
            stmt.run("Charlie Davis", "Product Manager", 1);
            stmt.finalize();
        }
    });
});

// GET: Fetch all team members
app.get('/api/team', (req, res) => {
    db.all("SELECT * FROM team", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST: Add a new team member
app.post('/api/team', (req, res) => {
    const { name, role } = req.body;
    if (!name || !role) return res.status(400).json({ error: "Name and role are required." });

    db.run("INSERT INTO team (name, role, isAvailable) VALUES (?, ?, 1)", [name, role], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, role, isAvailable: 1 });
    });
});

// PATCH: Update availability
app.patch('/api/team/:id/toggle', (req, res) => {
    const { isAvailable } = req.body;
    const numericStatus = isAvailable ? 1 : 0;

    db.run("UPDATE team SET isAvailable = ? WHERE id = ?", [numericStatus, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: req.params.id, isAvailable: numericStatus });
    });
});

// DELETE: Remove a team member (Admin Only)
app.delete('/api/team/:id', (req, res) => {
    db.run("DELETE FROM team WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes > 0) {
            res.json({ success: true, message: "Member removed" });
        } else {
            res.status(404).json({ error: "Member not found" });
        }
    });
});

app.listen(3000, () => console.log('Admin server running on http://localhost:3000'));