const { Op, literal } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Document = sequelize.define('Document', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        type: {
            type: DataTypes.ENUM(
                'id_card',
                'passport',
                'driver_license',
                'utility_bill',
                'bank_statement',
                'tax_document',
                'insurance',
                'other'
            ),
            allowNull: false,
        },
        documentNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        issueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        expiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        issuingCountry: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        issuingAuthority: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
            allowNull: false,
            defaultValue: 'pending',
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verifiedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }
    }, {
        tableName: 'Documents',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            active: { where: { isActive: true } },
            inactive: { where: { isActive: false } },
            pending: { where: { status: 'pending' } },
            approved: { where: { status: 'approved' } },
            rejected: { where: { status: 'rejected' } },
            expired: { where: { status: 'expired' } },
            expiringSoon: (days = 30) => ({
                where: {
                    expiryDate: {
                        [Op.lte]: literal(`CURRENT_DATE + INTERVAL '${days} days'`),
                        [Op.gt]: literal('CURRENT_DATE')
                    }
                }
            }),
            byType: (type) => ({ where: { type } }),
            byUser: (userId) => ({ where: { userId } })
        },
        indexes: [
            { fields: ['userId'] },
            { fields: ['type'] },
            { fields: ['status'] },
            { fields: ['expiryDate'] },
            { fields: ['verifiedAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            { 
                fields: ['userId', 'type'],
                name: 'document_user_type_idx'
            }
        ],
        validate: {
            async validUser() {
                const user = await sequelize.models.User.findByPk(this.userId);
                if (!user) throw new Error('Invalid user: User does not exist');
            },
            async validVerifier() {
                if (this.verifiedById) {
                    const verifier = await sequelize.models.User.findByPk(this.verifiedById);
                    if (!verifier) throw new Error('Invalid verifier: User does not exist');
                }
            },
            expiryAfterIssue() {
                if (this.issueDate && this.expiryDate && this.expiryDate <= this.issueDate) {
                    throw new Error('Expiry date must be after issue date');
                }
            },
            validFileSize() {
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (this.fileSize > maxSize) {
                    throw new Error('File size exceeds maximum limit of 10MB');
                }
            }
        },
        hooks: {
            beforeCreate: async (document) => {
                // Auto-set expiry date for ID cards and passports if not provided
                if (!document.expiryDate && ['id_card', 'passport'].includes(document.type)) {
                    document.expiryDate = new Date();
                    document.expiryDate.setFullYear(document.expiryDate.getFullYear() + 10);
                }
            },
            afterUpdate: async (document) => {
                // Check if document has expired
                if (document.status === 'approved' && document.expiryDate && document.expiryDate < new Date()) {
                    await document.update({ status: 'expired' }, { hooks: false });
                }
            }
        }
    });

    // Class Methods
    Document.findOrCreateForUser = async function(userId, type, fileData) {
        const [document] = await this.findOrCreate({
            where: { userId, type },
            defaults: {
                fileUrl: fileData.url,
                fileType: fileData.type,
                fileSize: fileData.size
            }
        });
        return document;
    };

    Document.getExpiringDocuments = async function(days = 30) {
        return this.scope('expiringSoon', days).findAll();
    };

    // Instance Methods
    Document.prototype.approve = async function(verifiedById) {
        return this.update({
            status: 'approved',
            verifiedAt: new Date(),
            verifiedById
        });
    };

    Document.prototype.reject = async function(reason) {
        return this.update({
            status: 'rejected',
            rejectionReason: reason
        });
    };

    Document.prototype.isExpired = function() {
        return this.expiryDate && this.expiryDate < new Date();
    };

    Document.prototype.getVerificationStatus = function() {
        if (this.status === 'approved' && !this.isExpired()) {
            return 'valid';
        }
        if (this.status === 'expired' || this.isExpired()) {
            return 'expired';
        }
        return this.status;
    };

    // Associations
    Document.associate = (models) => {
        Document.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Document.belongsTo(models.User, {
            foreignKey: 'verifiedById',
            as: 'verifiedBy'
        });
    };

    return Document;
}; 