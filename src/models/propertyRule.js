// src/models/propertyRule.js
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const PropertyRule = sequelize.define('PropertyRule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Listings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        type: {
            type: DataTypes.ENUM(
                'check_in',
                'check_out',
                'quiet_hours',
                'smoking',
                'pets',
                'parties',
                'children',
                'visitors',
                'parking',
                'amenities',
                'safety',
                'other'
            ),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 100]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isAllowed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        restrictions: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        penalty: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'PropertyRules',
        timestamps: true,
        paranoid: true,                   // soft-deletes
        defaultScope: {
            where: { isActive: true },
            order: [['displayOrder', 'ASC']]
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byType: (type) => ({ where: { type } }),
            byListing: (listingId) => ({ where: { listingId } }),
            allowed: { where: { isAllowed: true } },
            restricted: { where: { isAllowed: false } }
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['type'] },
            { fields: ['isAllowed'] },
            { fields: ['isActive'] },
            { fields: ['displayOrder'] },
            { fields: ['deletedAt'] },
            { fields: ['isActive', 'deletedAt'] },
            {
                unique: true,
                fields: ['listingId', 'type'],
                name: 'listing_rule_type_unique_idx'
            }
        ],
        validate: {
            titleLength() {
                if (this.title.length < 2 || this.title.length > 100) {
                    throw new Error('Title must be between 2 and 100 characters');
                }
            },
            async validListing() {
                const listing = await sequelize.models.Listing.findByPk(this.listingId);
                if (!listing) throw new Error('Invalid listing');
            },
            validRestrictions() {
                if (this.restrictions && typeof this.restrictions !== 'object') {
                    throw new Error('Restrictions must be an object');
                }
            }
        }
    });

    // Class Methods
    PropertyRule.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    PropertyRule.findByType = function(listingId, type) {
        return this.scope('byListing', listingId)
            .scope('byType', type)
            .findAll();
    };

    PropertyRule.getAllowedRules = function(listingId) {
        return this.scope('byListing', listingId)
            .scope('allowed')
            .findAll();
    };

    PropertyRule.getRestrictedRules = function(listingId) {
        return this.scope('byListing', listingId)
            .scope('restricted')
            .findAll();
    };

    // Instance Methods
    PropertyRule.prototype.updateOrder = async function(newOrder) {
        return this.update({ displayOrder: newOrder });
    };

    PropertyRule.prototype.toggleStatus = async function() {
        return this.update({ isActive: !this.isActive });
    };

    PropertyRule.prototype.updateRestrictions = async function(newRestrictions) {
        return this.update({ restrictions: { ...this.restrictions, ...newRestrictions } });
    };

    PropertyRule.prototype.getRuleDetails = function() {
        return {
            id: this.id,
            type: this.type,
            title: this.title,
            description: this.description,
            isAllowed: this.isAllowed,
            restrictions: this.restrictions,
            penalty: this.penalty
        };
    };

    // Associations
    PropertyRule.associate = (models) => {
        PropertyRule.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return PropertyRule;
};
