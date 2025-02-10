const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard.service');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const dashboardData = await dashboardService.getDashboardData(req.user.id);
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).json({ 
      message: 'Dashboard verisi alınırken bir hata oluştu',
      error: error.toString()
    });
  }
});

module.exports = router; 