import express from 'express';
import { 
  getFranchisesBySport, 
  createFranchise, 
  updateFranchise,
  deleteFranchise 
} from '../dataStore.js';

const router = express.Router();

// Get all teams for a sport
router.get('/:sport', async (req, res) => {
  try {
    const teams = await getFranchisesBySport(req.params.sport);
    res.json(teams);
  } catch (err) {
    console.error('Error getting teams:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new team to a sport
router.post('/:sport', async (req, res) => {
  try {
    const sport = req.params.sport;
    const newTeam = {
      ...req.body,
      sport,
      playerIds: [],
      playerCount: 0,
      createdAt: new Date().toISOString()
    };
    
    const createdTeam = await createFranchise(newTeam);
    res.status(201).json(createdTeam);
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update team
router.put('/:sport/:id', async (req, res) => {
  try {
    const updatedTeam = await updateFranchise(req.params.id, req.body);
    
    if (!updatedTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({ success: true, team: updatedTeam });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete team
router.delete('/:sport/:id', async (req, res) => {
  try {
    await deleteFranchise(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;