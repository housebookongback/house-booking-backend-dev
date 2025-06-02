const { Wishlist, Listing, User,Photo } = require('../models');

const wishlistController = {
  // Get all wishlists for a user
  async getUserWishlists(req, res) {
    try {
      const userId = req.user.id; // Assuming user is authenticated
      const wishlists = await Wishlist.findAll({
        where: { userId },
        include: [{
          model: Listing,
          as: 'listing',
          include: [{
            model: Photo,
            as: 'photos',
          }]
        }]
      });
      // Add first image to each listing in the response
      console.log("wishlists hhh",wishlists)
      const wishlistsWithFirstImage = wishlists.map(w => {
        const listing = w.listing?.toJSON ? w.listing.toJSON() : w.listing;
        return {
          ...w.toJSON(),
          listing: {
            ...listing,
            firstImage: listing?.photos && listing.photos.length > 0 ? listing.photos[0] : null
          }
        };
      });
      res.json(wishlistsWithFirstImage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wishlists' });
    }
  },

  // Add a listing to wishlist
  async addToWishlist(req, res) {
    try {
      const { listingId } = req.body;
      const userId = req.user.id;

      // Check if listing exists
      const listing = await Listing.findOne({ where: { id: listingId } });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Check if already in wishlist
      const existingWishlist = await Wishlist.findOne({
        where: { userId, listingId }
      });
      
      if (existingWishlist) {
         await Wishlist.destroy({
            where: { userId, listingId }
          });
          res.status(200).json({ data: {message: 'destroy successfully ' } });
      }else{
        await Wishlist.create({
            userId,
            listingId
          });
    
          res.status(201).json({data: {message: 'Added to wishlist successfully' } });
      }
    } catch (error) {
        console.error('Error adding to wishlist:', error)
      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  },

  // Remove a listing from wishlist
  async removeFromWishlist(req, res) {
    try {
      const { listingId } = req.params;
      const userId = req.user.id;

      const deleted = await Wishlist.destroy({
        where: { userId, listingId }
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Wishlist item not found' });
      }

      res.json({ message: 'Removed from wishlist successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
  },

  // Check if a listing is in user's wishlist
  async checkWishlistStatus(req, res) {
    try {
      const { listingId } = req.params;
      const userId = req.user.id;

      const wishlistItem = await Wishlist.findOne({
        where: { userId, listingId }
      });

      res.json({ isInWishlist: !!wishlistItem });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check wishlist status' });
    }
  },

  // Clear all items from wishlist
  async clearWishlist(req, res) {
    try {
      const userId = req.user.id;

      await Wishlist.destroy({
        where: { userId }
      });

      res.json({ message: 'Wishlist cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear wishlist' });
    }
  }
};

module.exports = wishlistController;