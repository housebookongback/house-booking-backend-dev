const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: [1, 100],
                is: /^[a-z0-9_]+$/i
            }
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false,
            get() {
                const rawValue = this.getDataValue('value');
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return rawValue;
                }
            },
            set(value) {
                this.setDataValue('value', typeof value === 'string' ? value : JSON.stringify(value));
            }
        },
        type: {
            type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
            allowNull: false,
            defaultValue: 'string'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'general'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'SystemSettings',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            public: { where: { isPublic: true } },
            byCategory: (category) => ({ where: { category } }),
            byType: (type) => ({ where: { type } })
        },
        indexes: [
            { fields: ['key'], unique: true },
            { fields: ['category'] },
            { fields: ['type'] },
            { fields: ['isPublic'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            validValue() {
                const value = this.getDataValue('value');
                const type = this.getDataValue('type');

                try {
                    switch (type) {
                        case 'number':
                            if (isNaN(Number(value))) {
                                throw new Error('Value must be a number');
                            }
                            break;
                        case 'boolean':
                            if (value !== 'true' && value !== 'false') {
                                throw new Error('Value must be a boolean');
                            }
                            break;
                        case 'json':
                            JSON.parse(value);
                            break;
                        case 'array':
                            if (!Array.isArray(JSON.parse(value))) {
                                throw new Error('Value must be an array');
                            }
                            break;
                    }
                } catch (error) {
                    throw new Error(`Invalid value for type ${type}: ${error.message}`);
                }
            }
        }
    });

    // Class Methods
    SystemSetting.get = async function(key, defaultValue = null) {
        const setting = await this.findOne({ where: { key } });
        if (!setting) return defaultValue;
        return setting.value;
    };

    SystemSetting.set = async function(key, value, options = {}) {
        const [setting, created] = await this.findOrCreate({
            where: { key },
            defaults: {
                value,
                type: options.type || typeof value,
                description: options.description,
                category: options.category || 'general',
                isPublic: options.isPublic || false
            }
        });

        if (!created) {
            await setting.update({
                value,
                type: options.type || setting.type,
                description: options.description || setting.description,
                category: options.category || setting.category,
                isPublic: options.isPublic ?? setting.isPublic
            });
        }

        return setting;
    };

    SystemSetting.getAll = async function(category = null) {
        const where = category ? { category } : {};
        const settings = await this.findAll({ where });
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    };

    // Instance Methods
    SystemSetting.prototype.deactivate = async function() {
        return this.update({ isActive: false });
    };

    SystemSetting.prototype.activate = async function() {
        return this.update({ isActive: true });
    };

    SystemSetting.prototype.togglePublic = async function() {
        return this.update({ isPublic: !this.isPublic });
    };

    SystemSetting.associate = () => {
        // No direct associations needed
    };

    return SystemSetting;
}; 