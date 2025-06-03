const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
// const authMiddleware = require('../middleware/auth'); // Assuming you have authentication middleware
const { authenticate } = require('../middleware/authMiddleware');
// Apply auth middleware to all wishlist routes
router.use(authenticate);

router.get('/', wishlistController.getUserWishlists);
router.post('/', wishlistController.addToWishlist);
router.get('/:listingId/status', wishlistController.checkWishlistStatus);
router.delete('/DeleteAll', wishlistController.clearWishlist);
router.post("/:listingId",wishlistController.removeFromWishlist)

module.exports = router;