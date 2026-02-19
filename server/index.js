import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players.js';
import teamsRouter from './routes/teams.js';
import authRouter from './routes/auth.js';
import verificationRouter from './routes/verification.js';
import auctionsRouter from './routes/auctions.js';
import liveAuctionRouter from './routes/liveAuction.js';
import auctionHistoryRouter from './routes/auctionHistory.js';
import seasonRoutes from './routes/seasonRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import * as auctioneersRouter from './routes/auctioneers.js';
import { liveAuctionEngine } from './liveAuctionEngine.js';
import "./firebase.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize live auction engine
liveAuctionEngine.initialize().then(() => {
  console.log('🎯 Live Auction Engine ready');
});

// Routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/auth', authRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/auctions', auctionsRouter);
app.use('/api/live-auction', liveAuctionRouter);
app.use('/api/auction-history', auctionHistoryRouter);
app.use('/api/seasons', seasonRoutes);
app.use('/api/auction-seasons', auctionRoutes);

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
 