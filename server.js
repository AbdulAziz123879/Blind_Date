const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database Setup
const db = new sqlite3.Database('./anondate.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT 0,
            reveal_level INTEGER DEFAULT 0,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Anonymous Profiles table
        db.run(`CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            anon_name TEXT NOT NULL,
            bio TEXT,
            gender TEXT,
            age INTEGER,
            location TEXT,
            interests TEXT, -- JSON array
            answers TEXT, -- JSON object with quiz answers
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Preferences table
        db.run(`CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT PRIMARY KEY,
            gender_pref TEXT DEFAULT 'any',
            age_min INTEGER DEFAULT 18,
            age_max INTEGER DEFAULT 80,
            distance_pref TEXT DEFAULT 'any',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Conversations table
        db.run(`CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user1_id TEXT NOT NULL,
            user2_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reveal_level INTEGER DEFAULT 0,
            last_message TEXT,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user1_id) REFERENCES users(id),
            FOREIGN KEY (user2_id) REFERENCES users(id),
            UNIQUE(user1_id, user2_id)
        )`);

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            type TEXT DEFAULT 'text',
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )`);

        // Blocks/Reports table
        db.run(`CREATE TABLE IF NOT EXISTS blocks (
            blocker_id TEXT NOT NULL,
            blocked_id TEXT NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (blocker_id, blocked_id),
            FOREIGN KEY (blocker_id) REFERENCES users(id),
            FOREIGN KEY (blocked_id) REFERENCES users(id)
        )`);

        console.log('Database tables initialized');
    });
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    // Simple token check (in production use JWT)
    db.get('SELECT * FROM users WHERE id = ?', [token], (err, user) => {
        if (err || !user) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, anonName } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        
        db.run('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', 
            [userId, email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            
            // Create default profile
            const defaultName = anonName || `User#${Math.floor(Math.random() * 10000)}`;
            db.run('INSERT INTO profiles (user_id, anon_name) VALUES (?, ?)', [userId, defaultName]);
            
            // Create default preferences
            db.run('INSERT INTO preferences (user_id) VALUES (?)', [userId]);
            
            res.json({ success: true, userId: userId, token: userId });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
        
        // Update last active
        db.run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        res.json({ 
            success: true, 
            token: user.id, 
            user: {
                id: user.id,
                email: user.email,
                revealLevel: user.reveal_level
            }
        });
    });
});

// Profile Routes
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get(`SELECT p.*, pref.* FROM profiles p 
            LEFT JOIN preferences pref ON p.user_id = pref.user_id 
            WHERE p.user_id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Profile not found' });
        
        res.json({
            anonName: row.anon_name,
            bio: row.bio,
            gender: row.gender,
            age: row.age,
            location: row.location,
            interests: row.interests ? JSON.parse(row.interests) : [],
            answers: row.answers ? JSON.parse(row.answers) : {},
            preferences: {
                gender: row.gender_pref,
                ageMin: row.age_min,
                ageMax: row.age_max,
                distance: row.distance_pref
            }
        });
    });
});

app.put('/api/profile', authenticateToken, (req, res) => {
    const { anonName, bio, gender, age, location, interests, answers, preferences } = req.body;
    
    db.run(`UPDATE profiles SET 
            anon_name = COALESCE(?, anon_name),
            bio = COALESCE(?, bio),
            gender = COALESCE(?, gender),
            age = COALESCE(?, age),
            location = COALESCE(?, location),
            interests = COALESCE(?, interests),
            answers = COALESCE(?, answers)
            WHERE user_id = ?`,
        [anonName, bio, gender, age, location, 
         interests ? JSON.stringify(interests) : null,
         answers ? JSON.stringify(answers) : null,
         req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update preferences if provided
        if (preferences) {
            db.run(`UPDATE preferences SET
                    gender_pref = COALESCE(?, gender_pref),
                    age_min = COALESCE(?, age_min),
                    age_max = COALESCE(?, age_max),
                    distance_pref = COALESCE(?, distance_pref)
                    WHERE user_id = ?`,
                [preferences.gender, preferences.ageMin, preferences.ageMax, 
                 preferences.distance, req.user.id]);
        }
        
        res.json({ success: true });
    });
});

// Matching Algorithm
app.post('/api/matches/find', authenticateToken, (req, res) => {
    const { answers, filters } = req.body;
    const userId = req.user.id;
    
    // Store/update user's quiz answers
    db.run('UPDATE profiles SET answers = ? WHERE user_id = ?', 
        [JSON.stringify(answers), userId]);

    // Matching query
    let query = `
        SELECT 
            u.id,
            p.anon_name,
            p.bio,
            p.interests,
            p.answers,
            p.age,
            p.gender,
            ABS(IFNULL(p.age, 25) - ?) as age_diff,
            CASE 
                WHEN p.answers IS NOT NULL THEN 
                    (CASE WHEN json_extract(p.answers, '$.1') = ? THEN 30 ELSE 0 END +
                     CASE WHEN json_extract(p.answers, '$.2') = ? THEN 30 ELSE 0 END +
                     CASE WHEN json_extract(p.answers, '$.3') = ? THEN 40 ELSE 0 END)
                ELSE 50
            END as compatibility_score
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN blocks b ON (b.blocker_id = ? AND b.blocked_id = u.id) 
                         OR (b.blocker_id = u.id AND b.blocked_id = ?)
        LEFT JOIN conversations c ON (c.user1_id = ? AND c.user2_id = u.id) 
                                OR (c.user1_id = u.id AND c.user2_id = ?)
        WHERE u.id != ? 
        AND u.id NOT IN (
            SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END 
            FROM conversations 
            WHERE user1_id = ? OR user2_id = ?
        )
        AND b.blocker_id IS NULL
    `;
    
    const params = [
        filters.ageMin || 25,
        answers['1'], answers['2'], answers['3'],
        userId, userId,
        userId, userId,
        userId, userId, userId, userId
    ];

    // Add filters
    if (filters.gender && filters.gender !== 'any') {
        query += ` AND (p.gender = ? OR p.gender IS NULL)`;
        params.push(filters.gender);
    }
    
    if (filters.ageMin) {
        query += ` AND (p.age >= ? OR p.age IS NULL)`;
        params.push(filters.ageMin);
    }
    
    if (filters.ageMax) {
        query += ` AND (p.age <= ? OR p.age IS NULL)`;
        params.push(filters.ageMax);
    }

    query += ` ORDER BY compatibility_score DESC, age_diff ASC LIMIT 10`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const matches = rows.map(row => ({
            id: row.id,
            name: row.anon_name,
            bio: row.bio,
            age: row.age,
            gender: row.gender,
            compatibility: Math.min(98, Math.max(65, row.compatibility_score + Math.floor(Math.random() * 10))),
            interests: row.interests ? JSON.parse(row.interests) : [],
            distance: `${Math.floor(Math.random() * 15) + 1} miles away`, // Calculate real distance in production
            avatar: getAvatarForPersonality(row.answers)
        }));
        
        res.json({ matches });
    });
});

function getAvatarForPersonality(answers) {
    if (!answers) return '👤';
    const ans = JSON.parse(answers);
    if (ans['1'] === 'adventure') return '⛰️';
    if (ans['1'] === 'cozy') return '📚';
    if (ans['1'] === 'social') return '🎉';
    if (ans['1'] === 'creative') return '🎨';
    return '👤';
}

// Conversation Routes
app.post('/api/conversations', authenticateToken, (req, res) => {
    const { matchId } = req.body;
    const convId = uuidv4();
    
    db.run(`INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)`,
        [convId, req.user.id, matchId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ conversationId: convId });
    });
});

app.get('/api/conversations', authenticateToken, (req, res) => {
    db.all(`SELECT 
                c.id,
                c.reveal_level,
                c.last_message,
                c.last_active,
                CASE 
                    WHEN c.user1_id = ? THEN c.user2_id 
                    ELSE c.user1_id 
                END as partner_id,
                p.anon_name as partner_name
            FROM conversations c
            JOIN profiles p ON p.user_id = CASE 
                WHEN c.user1_id = ? THEN c.user2_id 
                ELSE c.user1_id 
            END
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.last_active DESC`,
        [req.user.id, req.user.id, req.user.id, req.user.id], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const conversations = rows.map(row => ({
                id: row.id,
                partnerId: row.partner_id,
                partnerName: row.partner_name,
                lastMessage: row.last_message,
                lastActive: row.last_active,
                revealLevel: row.reveal_level,
                unread: false // Implement unread count logic
            }));
            
            res.json(conversations);
        });
});

app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
    const convId = req.params.id;
    
    // Verify user is part of conversation
    db.get(`SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [convId, req.user.id, req.user.id], (err, conv) => {
        if (err || !conv) return res.status(403).json({ error: 'Access denied' });
        
        db.all(`SELECT m.*, u.id as sender_id 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ? 
                ORDER BY m.created_at ASC`,
            [convId], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const messages = rows.map(row => ({
                    id: row.id,
                    text: row.content,
                    sender: row.sender_id === req.user.id ? 'me' : 'them',
                    timestamp: row.created_at,
                    type: row.type
                }));
                
                res.json({ messages, revealLevel: conv.reveal_level });
            });
    });
});

app.post('/api/conversations/:id/messages', authenticateToken, (req, res) => {
    const convId = req.params.id;
    const { text, type = 'text' } = req.body;
    
    // Verify and get partner
    db.get(`SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [convId, req.user.id, req.user.id], (err, conv) => {
        if (err || !conv) return res.status(403).json({ error: 'Access denied' });
        
        const msgId = uuidv4();
        
        db.run(`INSERT INTO messages (id, conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?, ?)`,
            [msgId, convId, req.user.id, text, type], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Update conversation last message
            db.run(`UPDATE conversations SET last_message = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?`,
                [text, convId]);
            
            res.json({ 
                id: msgId, 
                text, 
                sender: 'me', 
                timestamp: new Date().toISOString(),
                type 
            });
        });
    });
});

// Reveal System
app.post('/api/conversations/:id/reveal', authenticateToken, (req, res) => {
    const convId = req.params.id;
    const { level } = req.body;
    
    db.run(`UPDATE conversations SET reveal_level = ? WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [level, convId, req.user.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, revealLevel: level });
    });
});

// Block/Report
app.post('/api/block', authenticateToken, (req, res) => {
    const { userId, reason } = req.body;
    
    db.run(`INSERT INTO blocks (blocker_id, blocked_id, reason) VALUES (?, ?, ?)`,
        [req.user.id, userId, reason], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});