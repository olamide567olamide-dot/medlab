// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || 'localhost'; // or '127.0.0.1'
const APP_BASE_URL = process.env.APP_BASE_URL || `http://${HOST}:${PORT}`;
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin === process.env.CORS_ORIGIN) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const DB_PATH = path.join(__dirname, 'database', 'users.json');

// Ensure database directory and file exist
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

// Helper: Read users
function readUsers() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

// Helper: Save users
function saveUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function getMailer() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return null;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
}

// ====================== API ROUTES ======================

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        let users = readUsers();

        // Check if user already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(409).json({ success: false, message: "User with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = {
            id: Date.now().toString(),
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            password: passwordHash,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        res.json({ 
            success: true, 
            message: "Account created successfully",
            user: { ...newUser, password: undefined }
        });
    } catch (error) {
        console.error('Signup route failed:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isBcryptHash = /^\$2[aby]\$/.test(user.password);
        let passwordMatches;
        if (isBcryptHash) {
            passwordMatches = await bcrypt.compare(password, user.password);
        } else {
            passwordMatches = user.password === password;
            if (passwordMatches) {
                user.password = await bcrypt.hash(password, 12);
                saveUsers(users);
            }
        }
        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        saveUsers(users);

        res.json({ 
            success: true, 
            message: "Login successful",
            user: { 
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Login route failed:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// Forgot password (send reset link to Gmail)
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body || {};

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.json({ success: true, message: 'If an account exists for this email, a reset link will be sent.' });
        }

        const mailer = getMailer();
        if (!mailer) {
            return res.json({ success: true, message: 'If an account exists for this email, a reset link will be sent.' });
        }

        const token = crypto.randomBytes(24).toString('hex');
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

        user.resetToken = token;
        user.resetTokenExpires = expiresAt;
        saveUsers(users);

        const resetUrl = `${APP_BASE_URL}/reset-password.html?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;

        await mailer.sendMail({
            from: `iMEDIC <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: 'iMEDIC password reset',
            text: `You requested a password reset.\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`
        });

        return res.json({ success: true, message: 'If an account exists for this email, a reset link will be sent.' });
    } catch (error) {
        console.error('Forgot-password route failed:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// Reset password (token-based)
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body || {};

        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, token, and newPassword are required' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());

        if (!user || !user.resetToken || !user.resetTokenExpires) {
            return res.status(400).json({ success: false, message: 'Invalid reset token' });
        }

        const isExpired = Number(user.resetTokenExpires) < Date.now();
        const matches = String(user.resetToken) === String(token);

        if (isExpired || !matches) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        saveUsers(users);

        return res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset-password route failed:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
});

// Start server on localhost:3000
app.listen(PORT, HOST, () => {
    console.log(`🚀 iMEDIC Backend Server running at http://${HOST}:${PORT}`);
    console.log(`📁 Database: ${DB_PATH}`);
});
