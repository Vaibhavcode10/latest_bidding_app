import express from 'express';
import { fileStore } from '../fileStore.js';

const router = express.Router();

const getFilePath = (sport) => `data/${sport}/players.json`;

// Get all players for a sport
router.get('/:sport', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    const players = await fileStore.readJSON(filePath);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new player to a sport
router.post('/:sport', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    const players = await fileStore.readJSON(filePath);
    const sportPrefix = req.params.sport.substring(0, 2).toLowerCase();
    const newPlayer = {
      ...req.body,
      id: `${sportPrefix}_p${Date.now()}`,
      sport: req.params.sport,
      currentBid: 0,
      status: 'AVAILABLE',
      auctionPrice: null,
      soldTo: null
    };
    players.push(newPlayer);
    await fileStore.writeJSON(filePath, players);
    res.status(201).json(newPlayer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update player
router.put('/:sport/:id', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    let players = await fileStore.readJSON(filePath);
    players = players.map(p => p.id === req.params.id ? { ...p, ...req.body } : p);
    await fileStore.writeJSON(filePath, players);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete player
router.delete('/:sport/:id', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    let players = await fileStore.readJSON(filePath);
    players = players.filter(p => p.id !== req.params.id);
    await fileStore.writeJSON(filePath, players);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;