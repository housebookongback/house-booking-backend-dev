// src/models/propertyPolicy.js
module.exports = (sequelize, DataTypes) => {
    const PropertyPolicy = sequelize.define('PropertyPolicy', {
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
                'cancellation',
                'refund',
                'house_rules',
                'check_in',
                'check_out',
                'security_deposit',
                'cleaning',
                'damage',
                'liability',
                'insurance',
                'other'
            ),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { len: [2, 100] }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        terms: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        exceptions: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        version: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '1.0'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        requiresAgreement: {
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
        tableName: 'PropertyPolicies',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true },
            order: [['displayOrder', 'ASC']]
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byType: (type) => ({ where: { type } }),
            byListing: (listingId) => ({ where: { listingId } }),
            requiresAgreement: { where: { requiresAgreement: true } }
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['type'] },
            { fields: ['isActive'] },
            { fields: ['requiresAgreement'] },
            { fields: ['displayOrder'] },
            { fields: ['deletedAt'] },
            { fields: ['isActive', 'deletedAt'] },
            {
                unique: true,
                fields: ['listingId', 'type'],
                name: 'listing_policy_type_unique_idx'
            }
        ],
        validate: {
            titleLength() {
                if (this.title.length < 2 || this.title.length > 100) {
                    throw new Error('Title must be between 2 and 100 characters');
                }
            },
            async validListing() {
                if (!this.listingId) return true;
                
                try {
                    const listing = await sequelize.models.Listings.unscoped().findByPk(this.listingId);
                    
                    if (!listing) {
                        console.error(`PropertyPolicy validation: Listing with ID ${this.listingId} not found`);
                        
                        if ((this._options && this._options.transaction) ||
                            (this._options && this._options.validate === false)) {
                            console.log(`Warning: Skipping validation for listing ${this.listingId} in PropertyPolicy`);
                            return true;
                        }
                        
                        throw new Error(`Listing with ID ${this.listingId} not found`);
                    }
                    
                    return true;
                } catch (error) {
                    console.error(`PropertyPolicy validListing error:`, error);
                    
                    if (this._options && this._options.validate === false) {
                        console.log(`PropertyPolicy validation disabled, skipping checks for listing ${this.listingId}`);
                        return true;
                    }
                    
                    throw error;
                }
            },
            validTerms() {
                if (this.terms && typeof this.terms !== 'object') {
                    throw new Error('Terms must be an object');
                }
            },
            validConditions() {
                if (this.conditions && typeof this.conditions !== 'object') {
                    throw new Error('Conditions must be an object');
                }
            },
            validExceptions() {
                if (this.exceptions && typeof this.exceptions !== 'object') {
                    throw new Error('Exceptions must be an object');
                }
            }
        },
        hooks: {
            beforeUpdate: async (policy) => {
                if (
                    policy.changed('description') ||
                    policy.changed('terms') ||
                    policy.changed('conditions') ||
                    policy.changed('exceptions')
                ) {
                    const [major, minor] = policy.version.split('.').map(Number);
                    policy.version = `${major}.${minor + 1}`;
                    policy.lastUpdated = new Date();
                }
            }
        }
    });

    // Class Methods
    PropertyPolicy.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    PropertyPolicy.findByType = function(listingId, type) {
        return this.scope('byListing', listingId)
            .scope('byType', type)
            .findAll();
    };

    PropertyPolicy.getRequiredAgreements = function(listingId) {
        return this.scope('byListing', listingId)
            .scope('requiresAgreement')
            .findAll();
    };

    // Instance Methods
    PropertyPolicy.prototype.updateOrder = async function(newOrder) {
        return this.update({ displayOrder: newOrder });
    };

    PropertyPolicy.prototype.toggleStatus = async function() {
        return this.update({ isActive: !this.isActive });
    };

    PropertyPolicy.prototype.updateTerms = async function(newTerms) {
        return this.update({ terms: { ...this.terms, ...newTerms } });
    };

    PropertyPolicy.prototype.updateConditions = async function(newConditions) {
        return this.update({ conditions: { ...this.conditions, ...newConditions } });
    };

    PropertyPolicy.prototype.updateExceptions = async function(newExceptions) {
        return this.update({ exceptions: { ...this.exceptions, ...newExceptions } });
    };

    PropertyPolicy.prototype.getPolicyDetails = function() {
        return {
            id: this.id,
            type: this.type,
            title: this.title,
            description: this.description,
            terms: this.terms,
            conditions: this.conditions,
            exceptions: this.exceptions,
            version: this.version,
            lastUpdated: this.lastUpdated,
            requiresAgreement: this.requiresAgreement
        };
    };

    // Associations
    PropertyPolicy.associate = (models) => {
        PropertyPolicy.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return PropertyPolicy;
};
