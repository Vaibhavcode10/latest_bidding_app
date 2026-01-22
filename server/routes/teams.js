import express from 'express';
import { fileStore } from '../fileStore.js';

const router = express.Router();

const getFilePath = (sport) => `data/${sport}/teams.json`;

// Get all teams for a sport
router.get('/:sport', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    const teams = await fileStore.readJSON(filePath);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new team to a sport
router.post('/:sport', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    const teams = await fileStore.readJSON(filePath);
    const sportPrefix = req.params.sport.substring(0, 2).toLowerCase();
    const newTeam = {
      ...req.body,
      id: `${sportPrefix}_t${Date.now()}`,
      sport: req.params.sport,
      playerIds: [],
      playerCount: 0,
      wins: 0,
      losses: 0
    };
    teams.push(newTeam);
    await fileStore.writeJSON(filePath, teams);
    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update team
router.put('/:sport/:id', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    let teams = await fileStore.readJSON(filePath);
    teams = teams.map(t => t.id === req.params.id ? { ...t, ...req.body } : t);
    await fileStore.writeJSON(filePath, teams);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete team
router.delete('/:sport/:id', async (req, res) => {
  try {
    const filePath = getFilePath(req.params.sport);
    let teams = await fileStore.readJSON(filePath);
    teams = teams.filter(t => t.id !== req.params.id);
    await fileStore.writeJSON(filePath, teams);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;