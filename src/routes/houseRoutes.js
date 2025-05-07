const express = require('express');
const router = express.Router();
const houseController = require('../controllers/houseController');
const { authenticate } = require('../middleware/authMiddleware');
const verifyHost = require('../middleware/hostMiddleware');

// Public routes (no authentication needed)
router.get('/', houseController.getAllHouses);
router.get('/:id', houseController.getHouseById);

// Host-only routes (authentication and host verification required)
router.post('/', authenticate, verifyHost, houseController.createHouse);
router.put('/:id', authenticate, verifyHost, houseController.updateHouse);
router.delete('/:id', authenticate, verifyHost, houseController.deleteHouse);

module.exports = router; 