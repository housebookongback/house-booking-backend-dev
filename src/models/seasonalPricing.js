const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const SeasonalPricing = sequelize.define('SeasonalPricing', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Listings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [2, 100]
            }
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        adjustmentType: {
            type: DataTypes.ENUM('percentage', 'fixed', 'multiplier'),
            allowNull: false,
            defaultValue: 'percentage'
        },
        adjustmentValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        minStay: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1 }
        },
        maxStay: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1 }
        },
        priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Higher priority rules are applied first'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        tableName: 'SeasonalPricing',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byDateRange: (startDate, endDate) => ({
                where: {
                    startDate: { [Op.lte]: endDate },
                    endDate: { [Op.gte]: startDate }
                }
            })
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['startDate'] },
            { fields: ['endDate'] },
            { fields: ['priority'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validListing() {
                const listing = await sequelize.models.Listing.findByPk(this.listingId);
                if (!listing) throw new Error('Invalid listing');
            },
            validDateRange() {
                if (this.startDate > this.endDate) {
                    throw new Error('Start date cannot be after end date');
                }
            },
            validAdjustment() {
                if (this.adjustmentType === 'percentage' && (this.adjustmentValue < -100 || this.adjustmentValue > 1000)) {
                    throw new Error('Percentage adjustment must be between -100 and 1000');
                }
                if (this.adjustmentType === 'fixed' && this.adjustmentValue < 0) {
                    throw new Error('Fixed adjustment cannot be negative');
                }
                if (this.adjustmentType === 'multiplier' && this.adjustmentValue <= 0) {
                    throw new Error('Multiplier must be greater than 0');
                }
            }
        }
    });

    // Class Methods
    SeasonalPricing.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    SeasonalPricing.findActiveByDate = function(listingId, date) {
        return this.findAll({
            where: {
                listingId,
                startDate: { [Op.lte]: date },
                endDate: { [Op.gte]: date },
                isActive: true
            },
            order: [['priority', 'DESC']]
        });
    };

    // Instance Methods
    SeasonalPricing.prototype.applyToPrice = function(basePrice) {
        switch (this.adjustmentType) {
            case 'percentage':
                return basePrice * (1 + this.adjustmentValue / 100);
            case 'fixed':
                return basePrice + this.adjustmentValue;
            case 'multiplier':
                return basePrice * this.adjustmentValue;
            default:
                return basePrice;
        }
    };

    SeasonalPricing.prototype.updateAdjustment = async function(adjustmentType, adjustmentValue) {
        this.adjustmentType = adjustmentType;
        this.adjustmentValue = adjustmentValue;
        return this.save();
    };

    SeasonalPricing.prototype.updateDateRange = async function(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
        return this.save();
    };

    // Associations
    SeasonalPricing.associate = models => {
        SeasonalPricing.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing'
        });
    };

    return SeasonalPricing;
}; 