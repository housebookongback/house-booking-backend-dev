const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.get('/', searchController.search);
router.get('/popular', searchController.getPopularSearches);

// Protected routes
router.post('/filters', authenticate, searchController.saveFilter);
router.get('/filters', authenticate, searchController.getSavedFilters);
router.get('/history', authenticate, searchController.getSearchHistory);

module.exports = router;
