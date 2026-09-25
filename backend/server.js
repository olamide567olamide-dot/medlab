const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const aiChatRouter = require('./routes/aiChat');
const trustedRouter = require('./routes/trustedQuery');
const { verifyApiKey } = require('./middleware/auth');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please wait a moment.' }
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:4000',
      'https://localhost:4000',
      'http://127.0.0.1:4000',
      'https://127.0.0.1:4000'
    ];
    if (allowedOrigins.includes(origin) || origin === process.env.CORS_ORIGIN) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY']
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(xss());
app.use(morgan('combined'));

app.use('/api', verifyApiKey, apiLimiter, aiChatRouter);
app.use('/api', verifyApiKey, apiLimiter, trustedRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

if (USE_HTTPS) {
  const keyPath = process.env.HTTPS_KEY_PATH || path.join(__dirname, 'certs', 'key.pem');
  const certPath = process.env.HTTPS_CERT_PATH || path.join(__dirname, 'certs', 'cert.pem');
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('HTTPS enabled but certificate files not found');
    process.exit(1);
  }
  const https = require('https');
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`iMedic AI backend listening securely on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`iMedic AI backend listening on http://localhost:${PORT}`);
  });
}
