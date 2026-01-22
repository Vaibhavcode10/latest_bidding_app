import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players.js';
import teamsRouter from './routes/teams.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});