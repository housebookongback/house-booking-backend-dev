const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const PriceRule = sequelize.define('PriceRule', {
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
        type: {
            type: DataTypes.ENUM(
                'last_minute',
                'early_bird',
                'length_of_stay',
                'weekend',
                'holiday',
                'special_event',
                'demand',
                'custom'
            ),
            allowNull: false,
            defaultValue: 'custom'
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        condition: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'JSON conditions for rule application'
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
        tableName: 'PriceRules',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byType: (type) => ({ where: { type } }),
            byDateRange: (startDate, endDate) => ({
                where: {
                    startDate: { [Op.lte]: endDate },
                    endDate: { [Op.gte]: startDate }
                }
            })
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['type'] },
            { fields: ['startDate'] },
            { fields: ['endDate'] },
            { fields: ['priority'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validListing() {
                if (!this.listingId) return true;
                
                try {
                    // Use unscoped to find listings regardless of status
                    const listing = await sequelize.models.Listings.unscoped().findByPk(this.listingId);
                    
                    if (!listing) {
                        console.error(`PriceRule validation: Listing with ID ${this.listingId} not found`);
                        
                        // If this is part of a transaction or validation is disabled, don't throw
                        if ((this._options && this._options.transaction) ||
                            (this._options && this._options.validate === false)) {
                            console.log(`Warning: Skipping validation for listing ${this.listingId} in PriceRule`);
                            return true;
                        }
                        
                        throw new Error(`Listing with ID ${this.listingId} not found`);
                    }
                    
                    return true;
                } catch (error) {
                    console.error(`PriceRule validListing error:`, error);
                    
                    // If validation is disabled, continue without throwing
                    if (this._options && this._options.validate === false) {
                        console.log(`PriceRule validation disabled, skipping checks for listing ${this.listingId}`);
                        return true;
                    }
                    
                    throw error;
                }
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
            },
            validCondition() {
                if (this.condition && typeof this.condition !== 'object') {
                    throw new Error('Condition must be an object');
                }
            }
        }
    });

    // Class Methods
    PriceRule.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    PriceRule.findActiveByDate = function(listingId, date) {
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

    PriceRule.findApplicable = async function(listingId, date, stayLength) {
        const rules = await this.findAll({
            where: {
                listingId,
                startDate: { [Op.lte]: date },
                endDate: { [Op.gte]: date },
                isActive: true
            },
            order: [['priority', 'DESC']]
        });

        return rules.filter(rule => rule.isApplicable(stayLength));
    };

    // Instance Methods
    PriceRule.prototype.isApplicable = function(stayLength) {
        if (this.minStay && stayLength < this.minStay) return false;
        if (this.maxStay && stayLength > this.maxStay) return false;
        
        // Check additional conditions based on rule type
        switch (this.type) {
            case 'last_minute':
                return this.checkLastMinuteCondition();
            case 'early_bird':
                return this.checkEarlyBirdCondition();
            case 'length_of_stay':
                return this.checkLengthOfStayCondition(stayLength);
            case 'weekend':
                return this.checkWeekendCondition();
            case 'holiday':
                return this.checkHolidayCondition();
            case 'special_event':
                return this.checkSpecialEventCondition();
            case 'demand':
                return this.checkDemandCondition();
            default:
                return true;
        }
    };

    PriceRule.prototype.applyToPrice = function(price) {
        if (this.adjustmentType === 'percentage') {
            return price * (1 + this.adjustmentValue / 100);
        } else if (this.adjustmentType === 'flat') {
            return price + this.adjustmentValue;
        } else if (this.adjustmentType === 'fixed') {
            return this.adjustmentValue;
        }
        return price;
    };

    PriceRule.prototype.updateRule = async function(updates) {
        Object.assign(this, updates);
        return this.save();
    };

    // Condition Check Methods
    PriceRule.prototype.checkLastMinuteCondition = function() {
        const daysUntilStay = Math.floor((new Date(this.startDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilStay <= (this.condition.days || 7);
    };

    PriceRule.prototype.checkEarlyBirdCondition = function() {
        const daysUntilStay = Math.floor((new Date(this.startDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilStay >= (this.condition.days || 30);
    };

    PriceRule.prototype.checkLengthOfStayCondition = function(stayLength) {
        return stayLength >= (this.condition.minDays || 0) && 
               (!this.condition.maxDays || stayLength <= this.condition.maxDays);
    };

    PriceRule.prototype.checkWeekendCondition = function() {
        const day = new Date(this.startDate).getDay();
        return day === 0 || day === 6; // Saturday or Sunday
    };

    PriceRule.prototype.checkHolidayCondition = function() {
        // Implementation would check against a holidays table
        return false;
    };

    PriceRule.prototype.checkSpecialEventCondition = function() {
        // Implementation would check against an events table
        return false;
    };

    PriceRule.prototype.checkDemandCondition = function() {
        // Implementation would check booking patterns and demand metrics
        return false;
    };

    // Associations
    PriceRule.associate = models => {
        PriceRule.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing'
        });
    };

    return PriceRule;
}; 