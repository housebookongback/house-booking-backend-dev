const { sequelize } = require('../models');
const searchService = require('../services/searchService');
const db = require('../models');
const { Op } = require('sequelize');

const searchController = {
    // Basic search with filters
    search: async (req, res) => {
        try {
            // Parse numbers early with defaults
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 9;

            // Handle date parameters
            const { checkIn, checkOut, ...otherQuery } = req.query;

            // Parse categories if present
            const categories = otherQuery.categories?.split(',').map(Number);

            const searchParams = {
                ...otherQuery,
                checkIn,    // ISO string from frontend
                checkOut,   // ISO string from frontend
                page,
                limit,
                categories
            };
            
            const query = await searchService.buildSearchQuery(searchParams);
            const sortedQuery = searchService.sortResults(query, searchParams.sort);
            
            const { count, rows } = await db.Listing.findAndCountAll(sortedQuery);
            
            // Record search history if user is authenticated
            if (req.user) {
                await searchService.recordSearch(req.user.id, {
                    ...searchParams,
                    resultCount: count
                });
            }

            res.json({
                success: true,
                data: {
                    listings: rows,
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Search error:', error);
            
            // Handle date validation errors
            if (error.message.includes('date')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            // Handle JSON parse errors for dateRange
            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date range format'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error performing search',
                error: error.message
            });
        }
    },

    // Save search filter
    saveFilter: async (req, res) => {
        try {
            const { name, filters } = req.body;
            
            if (!name || !filters) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and filters are required'
                });
            }

            const savedFilter = await searchService.saveFilter(req.user.id, { name, filters });
            
            res.json({
                success: true,
                data: savedFilter
            });
        } catch (error) {
            console.error('Save filter error:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving search filter',
                error: error.message
            });
        }
    },

    // Get user's saved filters
    getSavedFilters: async (req, res) => {
        try {
            const filters = await searchService.getSavedFilters(req.user.id);
            
            res.json({
                success: true,
                data: filters
            });
        } catch (error) {
            console.error('Get saved filters error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving saved filters',
                error: error.message
            });
        }
    },

    // Get search history
    getSearchHistory: async (req, res) => {
        try {
            const history = await sequelize.models.SearchHistory.findAll({
                where: { userId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 20
            });
            
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Get search history error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving search history',
                error: error.message
            });
        }
    },

    // Get popular searches
    getPopularSearches: async (req, res) => {
        try {
            const popularSearches = await searchService.getPopularSearches();
            
            res.json({
                success: true,
                data: popularSearches
            });
        } catch (error) {
            console.error('Get popular searches error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving popular searches',
                error: error.message
            });
        }
    }
};

module.exports = searchController;
