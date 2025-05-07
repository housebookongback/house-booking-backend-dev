const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const MessageAttachment = sequelize.define('MessageAttachment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        messageId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Messages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        fileType: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0
            }
        },
        filePath: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        thumbnailPath: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'MessageAttachments',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byMessage: (messageId) => ({ where: { messageId } }),
            images: { where: { fileType: { [Op.like]: 'image/%' } } },
            videos: { where: { fileType: { [Op.like]: 'video/%' } } },
            documents: { where: { fileType: { [Op.like]: 'application/%' } } },
            recent: {
                order: [['createdAt', 'DESC']],
                limit: 50
            }
        },
        indexes: [
            { fields: ['messageId'] },
            { fields: ['fileType'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validMessage() {
                const message = await sequelize.models.Message.findByPk(this.messageId);
                if (!message) throw new Error('Invalid message');
            },
            validFileType() {
                const allowedTypes = [
                    'image/jpeg', 'image/png', 'image/gif',
                    'video/mp4', 'video/quicktime',
                    'application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                if (!allowedTypes.includes(this.fileType)) {
                    throw new Error('Invalid file type');
                }
            },
            validFileSize() {
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (this.fileSize > maxSize) {
                    throw new Error('File size exceeds limit');
                }
            }
        },
        hooks: {
            beforeCreate: async (attachment) => {
                // Generate thumbnail for images
                if (attachment.fileType.startsWith('image/')) {
                    // You would implement actual thumbnail generation here
                    // attachment.thumbnailPath = await generateThumbnail(attachment.filePath);
                }
            },
            afterDestroy: async (attachment) => {
                try {
                    // Delete the actual file from storage
                    // await deleteFile(attachment.filePath);
                    // if (attachment.thumbnailPath) {
                    //     await deleteFile(attachment.thumbnailPath);
                    // }
                } catch (error) {
                    console.error('Error in afterDestroy hook for MessageAttachment:', error);
                }
            }
        }
    });

    // Class Methods
    MessageAttachment.findByMessage = function(messageId) {
        return this.scope('byMessage', messageId).findAll();
    };

    MessageAttachment.findImagesByMessage = function(messageId) {
        return this.scope('byMessage', messageId)
            .scope('images')
            .findAll();
    };

    // Instance Methods
    MessageAttachment.prototype.getFileUrl = function() {
        // You would implement actual URL generation here
        // return generateFileUrl(this.filePath);
        return this.filePath;
    };

    MessageAttachment.prototype.getThumbnailUrl = function() {
        if (!this.thumbnailPath) return null;
        // You would implement actual URL generation here
        // return generateFileUrl(this.thumbnailPath);
        return this.thumbnailPath;
    };

    // Associations
    MessageAttachment.associate = models => {
        MessageAttachment.belongsTo(models.Message, {
            foreignKey: 'messageId',
            as: 'message'
        });
    };

    return MessageAttachment;
}; 