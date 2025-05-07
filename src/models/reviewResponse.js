const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const ReviewResponse = sequelize.define('ReviewResponse', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        reviewId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'Reviews', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        hostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1, 2000]
            }
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        editedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        editCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
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
        tableName: 'ReviewResponses',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            public: { where: { isPublic: true } },
            private: { where: { isPublic: false } },
            byReview: (reviewId) => ({ where: { reviewId } }),
            byHost: (hostId) => ({ where: { hostId } })
        },
        indexes: [
            { fields: ['reviewId'], unique: true },
            { fields: ['hostId'] },
            { fields: ['isPublic'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validReview() {
                const review = await sequelize.models.Review.findByPk(this.reviewId);
                if (!review) throw new Error('Invalid review');
            },
            async validHost() {
                const host = await sequelize.models.User.findByPk(this.hostId);
                if (!host) throw new Error('Invalid host');
            },
            async noDuplicateResponse() {
                const existingResponse = await sequelize.models.ReviewResponse.findOne({
                    where: {
                        reviewId: this.reviewId,
                        id: { [Op.ne]: this.id || null }
                    }
                });
                if (existingResponse) {
                    throw new Error('A response already exists for this review');
                }
            }
        },
        hooks: {
            beforeUpdate: async (response) => {
                if (response.changed('content')) {
                    response.editedAt = new Date();
                    response.editCount += 1;
                }
            }
        }
    });

    // Class Methods
    ReviewResponse.findByReview = function(reviewId) {
        return this.scope('byReview', reviewId).findOne();
    };

    ReviewResponse.findByHost = function(hostId) {
        return this.scope('byHost', hostId).findAll();
    };

    // Instance Methods
    ReviewResponse.prototype.edit = async function(newContent) {
        this.content = newContent;
        return this.save();
    };

    ReviewResponse.prototype.toggleVisibility = async function() {
        this.isPublic = !this.isPublic;
        return this.save();
    };

    // Associations
    ReviewResponse.associate = models => {
        ReviewResponse.belongsTo(models.Review, {
            foreignKey: 'reviewId',
            as: 'review'
        });
        ReviewResponse.belongsTo(models.User, {
            foreignKey: 'hostId',
            as: 'host'
        });
    };

    return ReviewResponse;
}; 