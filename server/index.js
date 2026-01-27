import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players.js';
import teamsRouter from './routes/teams.js';
import authRouter from './routes/auth.js';
import * as auctioneersRouter from './routes/auctioneers.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/auth', authRouter);

// Auctioneer routes
app.post('/api/auctioneers/login', (req, res) => {
  auctioneersRouter.login(req, res);
});

app.get('/api/auctioneers/details', (req, res) => {
  auctioneersRouter.getAuctioneerDetails(req, res);
});

app.post('/api/auctioneers/franchise/create', (req, res) => {
  auctioneersRouter.createFranchise(req, res);
});

app.put('/api/auctioneers/franchise/update', (req, res) => {
  auctioneersRouter.updateFranchise(req, res);
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});