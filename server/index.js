import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players.js';
import teamsRouter from './routes/teams.js';
import authRouter from './routes/auth.js';
import verificationRouter from './routes/verification.js';
import seasonsRouter from './routes/seasons.js';
import actionsRouter from './routes/actions.js';

try {
  // Initialize Firebase connection
  console.log('🔌 Initializing Firebase...');
  import("./firebase.js").then(() => {
    console.log('✅ Firebase initialized');
  }).catch((err) => {
    console.error('❌ Firebase initialization failed:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Error loading Firebase:', err);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/auth', authRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/seasons', seasonsRouter);
app.use('/api/actions', actionsRouter);

// 404 handler
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: `Route not found: ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`❌ Server Error:`, err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
});
 