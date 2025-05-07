const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Report extends Model {
        static associate(models) {
            Report.belongsTo(models.User, {
                foreignKey: 'reporterId',
                as: 'reporter'
            });
            Report.belongsTo(models.User, {
                foreignKey: 'reportedUserId',
                as: 'reportedUser'
            });
            Report.belongsTo(models.Listing, {
                foreignKey: 'listingId',
                as: 'listing'
            });
            Report.belongsTo(models.User, {
                foreignKey: 'resolvedById',
                as: 'resolvedBy'
            });
        }
    }

    Report.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM('listing', 'user'),
            allowNull: false
        },
        reason: {
            type: DataTypes.ENUM(
                'inappropriate_content',
                'fake_listing',
                'scam',
                'harassment',
                'spam',
                'other'
            ),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [10, 1000]
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        resolution: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        reporterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        reportedUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Listings',
                key: 'id'
            }
        },
        resolvedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Report',
        tableName: 'Reports',
        timestamps: true,
        paranoid: true,
        scopes: {
            pending: { where: { status: 'pending' } },
            underReview: { where: { status: 'under_review' } },
            resolved: { where: { status: 'resolved' } },
            dismissed: { where: { status: 'dismissed' } },
            byReporter: (reporterId) => ({ where: { reporterId } }),
            byReportedUser: (reportedUserId) => ({ where: { reportedUserId } }),
            byListing: (listingId) => ({ where: { listingId } })
        },
        indexes: [
            { fields: ['reporterId'] },
            { fields: ['reportedUserId'] },
            { fields: ['listingId'] },
            { fields: ['status'] },
            { fields: ['type'] },
            {
                fields: ['reporterId', 'reportedUserId', 'type'],
                name: 'report_unique_per_user'
            },
            {
                fields: ['reporterId', 'listingId', 'type'],
                name: 'report_unique_per_listing'
            }
        ],
        validate: {
            async validReporter() {
                const reporter = await sequelize.models.User.findByPk(this.reporterId);
                if (!reporter) throw new Error('Invalid reporter');
            },
            async validReportedUser() {
                if (this.type === 'user' && this.reportedUserId) {
                    const reportedUser = await sequelize.models.User.findByPk(this.reportedUserId);
                    if (!reportedUser) throw new Error('Invalid reported user');
                }
            },
            async validListing() {
                if (this.type === 'listing' && this.listingId) {
                    const listing = await sequelize.models.Listing.findByPk(this.listingId);
                    if (!listing) throw new Error('Invalid listing');
                }
            },
            async noDuplicateReport() {
                if (this.type === 'user' && this.reportedUserId) {
                    const exists = await Report.findOne({
                        where: {
                            reporterId: this.reporterId,
                            reportedUserId: this.reportedUserId,
                            type: 'user'
                        }
                    });
                    if (exists) throw new Error('You have already reported this user');
                }
                if (this.type === 'listing' && this.listingId) {
                    const exists = await Report.findOne({
                        where: {
                            reporterId: this.reporterId,
                            listingId: this.listingId,
                            type: 'listing'
                        }
                    });
                    if (exists) throw new Error('You have already reported this listing');
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
                    await sequelize.models.Notification.create({
                        userId: report.reporterId,
                        type: 'report_submitted',
                        title: 'Report Submitted',
                        message: `Your ${report.type} report has been submitted and is pending review.`,
                        data: {
                            reportId: report.id,
                            type: report.type
                        }
                    });
                } catch (error) {
                    console.error('Error in afterCreate hook for Report:', error);
                }
            }
        }
    });

    // Class Methods
    Report.findByReporter = function(reporterId) {
        return this.scope('byReporter', reporterId).findAll();
    };

    Report.findByReportedUser = function(reportedUserId) {
        return this.scope('byReportedUser', reportedUserId).findAll();
    };

    Report.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    Report.getPendingReports = function() {
        return this.scope('pending').findAll();
    };

    // Instance Methods
    Report.prototype.startReview = async function() {
        return this.update({ status: 'under_review' });
    };

    Report.prototype.resolve = async function(resolution, resolvedById) {
        return this.update({
            status: 'resolved',
            resolution,
            resolvedById,
            resolvedAt: new Date()
        });
    };

    Report.prototype.dismiss = async function(resolution, resolvedById) {
        return this.update({
            status: 'dismissed',
            resolution,
            resolvedById,
            resolvedAt: new Date()
        });
    };

    return Report;
}; 