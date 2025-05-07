const models = require('../models');

/**
 * Create a new house listing
 * Only hosts can create houses
 */
const createHouse = async (req, res) => {
    try {
        // Add hostId from the authenticated host
        const houseData = {
            ...req.body,
            hostId: req.host.id
        };
        const house = await models.House.create(houseData);
        res.status(201).json(house);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Get all house listings
 * Public access
 */
const getAllHouses = async (req, res) => {
    try {
        const houses = await models.House.findAll();
        res.json(houses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get a specific house by ID
 * Public access
 */
const getHouseById = async (req, res) => {
    try {
        const house = await models.House.findByPk(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }
        res.json(house);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a house listing
 * Only the host who owns the house can update it
 */
const updateHouse = async (req, res) => {
    try {
        // Check if house exists and belongs to the host
        const house = await models.House.findByPk(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }
        if (house.hostId !== req.host.id && req.host.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this house' });
        }

        const [updated] = await models.House.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedHouse = await models.House.findByPk(req.params.id);
            res.json(updatedHouse);
        } else {
            res.status(404).json({ message: 'House not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Delete a house listing
 * Only the host who owns the house can delete it
 */
const deleteHouse = async (req, res) => {
    try {
        // Check if house exists and belongs to the host
        const house = await models.House.findByPk(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }
        if (house.hostId !== req.host.id && req.host.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this house' });
        }

        const deleted = await models.House.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.json({ message: 'House deleted successfully' });
        } else {
            res.status(404).json({ message: 'House not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createHouse,
    getAllHouses,
    getHouseById,
    updateHouse,
    deleteHouse
}; 