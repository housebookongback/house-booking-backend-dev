const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const ReviewReport = sequelize.define('ReviewReport', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        reviewId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Reviews', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        reporterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        reason: {
            type: DataTypes.ENUM(
                'inappropriate_content',
                'false_information',
                'spam',
                'hate_speech',
                'harassment',
                'other'
            ),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 1000]
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        resolution: {
            type: DataTypes.ENUM('removed', 'edited', 'no_action'),
            allowNull: true
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resolvedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        },
        resolutionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 1000]
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
        tableName: 'ReviewReports',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            pending: { where: { status: 'pending' } },
            underReview: { where: { status: 'under_review' } },
            resolved: { where: { status: 'resolved' } },
            dismissed: { where: { status: 'dismissed' } },
            byReview: (reviewId) => ({ where: { reviewId } }),
            byReporter: (reporterId) => ({ where: { reporterId } }),
            byResolver: (resolvedById) => ({ where: { resolvedById } })
        },
        indexes: [
            { fields: ['reviewId'] },
            { fields: ['reporterId'] },
            { fields: ['status'] },
            { fields: ['resolvedById'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            {
                unique: true,
                fields: ['reviewId', 'reporterId'],
                name: 'review_report_unique_per_user'
            }
        ],
        validate: {
            async validReview() {
                const review = await sequelize.models.Review.findByPk(this.reviewId);
                if (!review) throw new Error('Invalid review');
            },
            async validReporter() {
                const reporter = await sequelize.models.User.findByPk(this.reporterId);
                if (!reporter) throw new Error('Invalid reporter');
            },
            async validResolver() {
                if (this.resolvedById) {
                    const resolver = await sequelize.models.User.findByPk(this.resolvedById);
                    if (!resolver) throw new Error('Invalid resolver');
                }
            },
            async noDuplicateBySameReporter() {
                if (this.isNewRecord) {
                    const exists = await this.constructor.findOne({
                        where: { 
                            reviewId: this.reviewId, 
                            reporterId: this.reporterId,
                            isActive: true
                        }
                    });
                    if (exists) throw new Error('You\'ve already reported this review');
                }
            }
        },
        hooks: {
            beforeUpdate: async (report) => {
                if (report.changed('status') && report.status === 'resolved') {
                    report.resolvedAt = new Date();
                }
            },
            afterCreate: async (report) => {
                try {
                    // Get the review details
                    const review = await sequelize.models.Review.findByPk(report.reviewId, {
                        include: [
                            { model: sequelize.models.User, as: 'reviewer' },
                            { model: sequelize.models.User, as: 'reviewed' }
                        ]
                    });

                    if (!review) return;

                    // Create notification for moderators
                    await sequelize.models.Notification.create({
                        userId: report.reporterId, // Notify the reporter
                        type: 'info',
                        category: 'review',
                        title: 'Review Report Submitted',
                        message: `Your report for review "${review.comment?.substring(0, 50)}..." has been submitted and is pending review.`,
                        metadata: {
                            reviewId: review.id,
                            reportId: report.id
                        }
                    });

                    // Find all moderators
                    const moderators = await sequelize.models.User.findAll({
                        where: { role: 'moderator' }
                    });

                    // Create notifications for each moderator
                    await Promise.all(moderators.map(moderator => 
                        sequelize.models.Notification.create({
                            userId: moderator.id,
                            type: 'warning',
                            category: 'review',
                            title: 'New Review Report',
                            message: `A new report has been submitted for review "${review.comment?.substring(0, 50)}..."`,
                            metadata: {
                                reviewId: review.id,
                                reportId: report.id,
                                reporterId: report.reporterId
                            }
                        })
                    ));

                    // You could also send emails here
                    // await EmailService.sendModeratorNotification(report, review);
                } catch (error) {
                    console.error('Error in afterCreate hook for ReviewReport:', error);
                    // Don't throw the error to prevent report creation from failing
                }
            }
        }
    });

    // Class Methods
    ReviewReport.findByReview = function(reviewId) {
        return this.scope('byReview', reviewId).findAll();
    };

    ReviewReport.findByReporter = function(reporterId) {
        return this.scope('byReporter', reporterId).findAll();
    };

    ReviewReport.getPendingReports = function() {
        return this.scope('pending').findAll();
    };

    ReviewReport.findOrCreateFor = async function(reviewId, reporterId, defaults = {}) {
        const [report] = await this.findOrCreate({
            where: { 
                reviewId, 
                reporterId,
                isActive: true 
            },
            defaults: { 
                reviewId, 
                reporterId, 
                ...defaults,
                isActive: true 
            }
        });
        return report;
    };

    // Instance Methods
    ReviewReport.prototype.startReview = async function() {
        this.status = 'under_review';
        return this.save();
    };

    ReviewReport.prototype.resolve = async function(resolution, notes, resolvedById) {
        this.status = 'resolved';
        this.resolution = resolution;
        this.resolutionNotes = notes;
        this.resolvedById = resolvedById;
        return this.save();
    };

    ReviewReport.prototype.dismiss = async function(notes, resolvedById) {
        this.status = 'dismissed';
        this.resolutionNotes = notes;
        this.resolvedById = resolvedById;
        return this.save();
    };

    // Associations
    ReviewReport.associate = models => {
        ReviewReport.belongsTo(models.Review, {
            foreignKey: 'reviewId',
            as: 'review'
        });
        ReviewReport.belongsTo(models.User, {
            foreignKey: 'reporterId',
            as: 'reporter'
        });
        ReviewReport.belongsTo(models.User, {
            foreignKey: 'resolvedById',
            as: 'resolver'
        });
    };

    return ReviewReport;
}; 