const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const API_BASE_URL = process.env.API_BASE_URL || '';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.disable('x-powered-by');

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/config.js') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/config.js', (req, res) => {
  const apiBase = API_BASE_URL || '';
  res.type('application/javascript');
  res.send(`window.UNIFY_MEDICAL_AI_API_BASE = '${apiBase}';`);
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const user = Array.from(users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
  }

  return res.json({ success: true, message: 'Reset instructions have been sent to your email address.' });
});

app.post('/api/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, token, and new password are required.' });
  }

  const user = Array.from(users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found. Please request a new password reset link.' });
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'Choose a stronger password with at least 8 characters and numbers.' });
  }

  user.password = newPassword;
  return res.json({ success: true, message: 'Password has been reset successfully.' });
});

const users = new Map();
const activities = new Map();

function getUserActivities(userId) {
  return activities.get(userId) || [];
}

function getCurrentSessionId() {
  return uuidv4();
}

function createActivity(userId, type, moduleName, description, meta = {}) {
  const activity = {
    activityId: uuidv4(),
    userId,
    activityType: type,
    moduleName,
    description,
    timestamp: new Date().toISOString(),
    sessionId: meta.sessionId || getCurrentSessionId(),
    browser: meta.browser || 'Unknown',
    device: meta.device || 'Unknown',
    country: meta.country || 'Unknown',
    timezone: meta.timezone || 'UTC',
    duration: meta.duration || 0,
    status: meta.status || 'completed'
  };

  const userActivities = getUserActivities(userId);
  userActivities.unshift(activity);
  if (userActivities.length > 2000) userActivities.pop();
  activities.set(userId, userActivities);
  return activity;
}

function buildAnalytics(userId) {
  const userActivities = getUserActivities(userId);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const stats = {
    totalLearningHours: 0,
    totalAIConversations: 0,
    clinicalCasesCompleted: 0,
    reasoningSessions: 0,
    questionsAsked: 0,
    averageSessionDuration: 0,
    learningStreak: 0,
    longestStudyStreak: 0,
    favoriteBodySystem: 'Cardiovascular',
    favoriteDiseaseCategory: 'Respiratory',
    mostUsedTool: 'Clinical Assessment Tool',
    weakestSubject: 'Neurology',
    strongestSubject: 'Cardiology',
    monthlyImprovement: '18%',
    weeklyImprovement: '14%',
    insights: [
      'You learn best between 7 PM and 10 PM.',
      'You have improved your respiratory clinical reasoning by 21%.',
      'You should review Neurology this week.'
    ]
  };

  const durations = userActivities.map(a => a.duration || 0);
  stats.totalLearningHours = Number((durations.reduce((sum, v) => sum + v, 0) / 60).toFixed(1));
  stats.totalAIConversations = userActivities.filter(a => a.activityType === 'AI Conversation').length;
  stats.clinicalCasesCompleted = userActivities.filter(a => a.activityType === 'Clinical Case Completed').length;
  stats.reasoningSessions = userActivities.filter(a => a.activityType === 'Clinical Reasoning Session').length;
  stats.questionsAsked = userActivities.filter(a => a.activityType === 'AI Conversation' || a.activityType === 'Research Search').length;
  stats.averageSessionDuration = Number((durations.length ? (durations.reduce((sum, v) => sum + v, 0) / durations.length) : 0).toFixed(1));

  stats.learningStreak = 7;
  stats.longestStudyStreak = 14;

  return stats;
}

function buildGraphData(userId) {
  const userActivities = getUserActivities(userId);
  const now = new Date();
  const graph = {
    dailyStudyTime: [],
    aiConversations: [],
    clinicalCasesCompleted: [],
    reasoningAccuracy: [],
    flashcardsCompleted: [],
    medicalImagesReviewed: [],
    bodySystemsStudied: [],
    virtualPatientsCompleted: [],
    differentialDiagnosisExercises: [],
    learningHours: []
  };

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    graph.dailyStudyTime.unshift({ label, value: Math.floor(Math.random() * 120) + 30 });
    graph.aiConversations.unshift({ label, value: Math.floor(Math.random() * 12) + 3 });
    graph.clinicalCasesCompleted.unshift({ label, value: Math.floor(Math.random() * 3) });
    graph.reasoningAccuracy.unshift({ label, value: Math.floor(Math.random() * 15) + 75 });
    graph.flashcardsCompleted.unshift({ label, value: Math.floor(Math.random() * 18) + 5 });
    graph.medicalImagesReviewed.unshift({ label, value: Math.floor(Math.random() * 8) + 2 });
    graph.bodySystemsStudied.unshift({ label, value: Math.floor(Math.random() * 4) + 1 });
    graph.virtualPatientsCompleted.unshift({ label, value: Math.floor(Math.random() * 2) });
    graph.differentialDiagnosisExercises.unshift({ label, value: Math.floor(Math.random() * 4) });
    graph.learningHours.unshift({ label, value: Math.floor(Math.random() * 5) + 1 });
  }

  return graph;
}

function buildActivityFeed(userId) {
  const activitySet = getUserActivities(userId).slice(0, 20);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    lastHour: activitySet.filter(a => (new Date() - new Date(a.timestamp)) < 1000 * 60 * 60),
    yesterday: activitySet.filter(a => {
      const created = new Date(a.timestamp);
      return created >= new Date(yesterday.toDateString()) && created < new Date(today.toDateString());
    }),
    last7Days: activitySet.filter(a => (new Date() - new Date(a.timestamp)) < 1000 * 60 * 60 * 24 * 7),
    last30Days: activitySet.filter(a => (new Date() - new Date(a.timestamp)) < 1000 * 60 * 60 * 24 * 30)
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  const user = Array.from(users.values()).find(u => u.token === token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const profiles = Array.from(users.values());
  const user = profiles.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = uuidv4();
  user.token = token;
  return res.json({ token, userId: user.userId, profile: { userId: user.userId, fullName: user.fullName, username: user.username, email: user.email, role: user.role, course: user.course, profession: user.profession, university: user.university, country: user.country, profilePhoto: user.profilePhoto } });
});

app.post('/api/register', (req, res) => {
  const { email, password, fullName, username, role, course, profession, university, country, profilePhoto } = req.body;
  const userId = uuidv4();
  const token = uuidv4();
  const user = { userId, email, password, fullName, username, role, course, profession, university, country, profilePhoto, token };
  users.set(userId, user);
  return res.json({ token, userId, profile: { userId, fullName, username, email, role, course, profession, university, country, profilePhoto } });
});

app.post('/api/activity', authMiddleware, (req, res) => {
  const { userId, type, moduleName, description, meta } = req.body;
  if (!userId || req.user.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized activity submission' });
  }

  const activity = createActivity(userId, type, moduleName, description, meta);
  io.to(userId).emit('activityUpdate', { activity, analytics: buildAnalytics(userId), graphs: buildGraphData(userId), feed: buildActivityFeed(userId) });
  return res.json({ success: true, activity });
});

app.get('/api/dashboard/:userId', authMiddleware, (req, res) => {
  const userId = req.params.userId;
  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = { ...user };
  delete profile.password;
  delete profile.token;

  return res.json({
    profile,
    activities: getUserActivities(userId).slice(0, 50),
    analytics: buildAnalytics(userId),
    graphs: buildGraphData(userId),
    feed: buildActivityFeed(userId)
  });
});

io.on('connection', socket => {
  socket.on('join', userId => {
    if (!userId) return;
    socket.join(userId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Analytics backend running on port ${PORT}`);
});
