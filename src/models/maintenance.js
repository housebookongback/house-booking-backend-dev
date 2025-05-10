const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Maintenance = sequelize.define('Maintenance', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 200]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfterStart(value) {
                    if (value <= this.startTime) {
                        throw new Error('End time must be after start time');
                    }
                }
            }
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'scheduled'
        },
        type: {
            type: DataTypes.ENUM('system', 'database', 'security', 'feature', 'other'),
            allowNull: false,
            defaultValue: 'system'
        },
        impact: {
            type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium'
        },
        affectedServices: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            get() {
                const value = this.getDataValue('affectedServices');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('affectedServices', JSON.stringify(value));
            }
        },
        createdById: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'Maintenances',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            upcoming: {
                where: {
                    startTime: { [Op.gt]: new Date() },
                    status: 'scheduled'
                }
            },
            inProgress: { where: { status: 'in_progress' } },
            completed: { where: { status: 'completed' } },
            cancelled: { where: { status: 'cancelled' } },
            byType: (type) => ({ where: { type } }),
            byImpact: (impact) => ({ where: { impact } }),
            byService: (service) => ({
                where: {
                    affectedServices: {
                        [Op.contains]: [service]
                    }
                }
            })
        },
        indexes: [
            { fields: ['startTime'] },
            { fields: ['endTime'] },
            { fields: ['status'] },
            { fields: ['type'] },
            { fields: ['impact'] },
            { fields: ['createdById'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            validTimeRange() {
                if (this.startTime >= this.endTime) {
                    throw new Error('End time must be after start time');
                }
            },
            validStatusTransition() {
                const validTransitions = {
                    scheduled: ['in_progress', 'cancelled'],
                    in_progress: ['completed', 'cancelled'],
                    completed: [],
                    cancelled: []
                };

                if (this.changed('status')) {
                    const oldStatus = this.previous('status');
                    const newStatus = this.status;
                    
                    if (!validTransitions[oldStatus]?.includes(newStatus)) {
                        throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
                    }
                }
            }
        },
        hooks: {
            beforeCreate: (maintenance) => {
                if (maintenance.startTime < new Date()) {
                    maintenance.status = 'in_progress';
                }
            },
            beforeUpdate: (maintenance) => {
                if (maintenance.changed('status') && maintenance.status === 'completed') {
                    maintenance.endTime = new Date();
                }
            }
        }
    });

    // Class Methods
    Maintenance.getUpcoming = async function(limit = 5) {
        return this.scope('upcoming').findAll({
            order: [['startTime', 'ASC']],
            limit
        });
    };

    Maintenance.getActive = async function() {
        return this.findOne({
            where: {
                status: 'in_progress',
                startTime: { [Op.lte]: new Date() },
                endTime: { [Op.gte]: new Date() }
            }
        });
    };

    Maintenance.getByService = async function(service, options = {}) {
        return this.scope('byService', service).findAll(options);
    };

    // Instance Methods
    Maintenance.prototype.start = async function() {
        if (this.status !== 'scheduled') {
            throw new Error('Can only start scheduled maintenance');
        }
        return this.update({ status: 'in_progress' });
    };

    Maintenance.prototype.complete = async function() {
        if (this.status !== 'in_progress') {
            throw new Error('Can only complete in-progress maintenance');
        }
        return this.update({ 
            status: 'completed',
            endTime: new Date()
        });
    };

    Maintenance.prototype.cancel = async function() {
        if (!['scheduled', 'in_progress'].includes(this.status)) {
            throw new Error('Can only cancel scheduled or in-progress maintenance');
        }
        return this.update({ status: 'cancelled' });
    };

    Maintenance.prototype.extend = async function(newEndTime) {
        if (this.status !== 'in_progress') {
            throw new Error('Can only extend in-progress maintenance');
        }
        if (newEndTime <= this.endTime) {
            throw new Error('New end time must be after current end time');
        }
        return this.update({ endTime: newEndTime });
    };

    Maintenance.associate = (models) => {
        Maintenance.belongsTo(models.User, {
            foreignKey: 'createdById',
            as: 'creator',
            onDelete: 'CASCADE'
        });
    };

    return Maintenance;
}; 