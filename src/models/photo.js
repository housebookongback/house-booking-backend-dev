// src/models/photo.js
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Photo = sequelize.define('Photo', {
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
        url: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isUrl: true }
        },
        thumbnailUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { isUrl: true }
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [['image/jpeg', 'image/png', 'image/gif']] }
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 10 * 1024 * 1024 // 10MB max
            }
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 0 }
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 0 }
        },
        caption: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { len: [0, 255] }
        },
        category: {
            type: DataTypes.ENUM(
                'exterior','interior','bedroom','bathroom','kitchen',
                'living_room','dining_room','garden','pool','view','other'
            ),
            allowNull: false,
            defaultValue: 'other'
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: []
        },
        takenAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isCover: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('pending','approved','rejected'),
            allowNull: false,
            defaultValue: 'approved'
        },
        rejectionReason: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'Photos',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true, status: 'approved' },
            order: [['isCover','DESC'],['displayOrder','ASC']]
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            cover: { where: { isCover: true } },
            byListing: (listingId) => ({ where: { listingId } }),
            byCategory: (category) => ({ where: { category } }),
            byStatus: (status) => ({ where: { status } }),
            pending: { where: { status: 'pending' } },
            approved: { where: { status: 'approved' } },
            rejected: { where: { status: 'rejected' } },
            withTags: (tags) => ({
                where: {
                    tags: {
                        [Op.overlap]: Array.isArray(tags) ? tags : [tags]
                    }
                }
            })
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['isCover'] },
            { fields: ['displayOrder'] },
            { fields: ['category'] },
            { fields: ['status'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            { fields: ['tags'], using: 'GIN' }
        ],
        validate: {
            async validListing() {
                const listing = await sequelize.models.Listing.findByPk(this.listingId);
                if (!listing) throw new Error('Invalid listing');
            },
            validTags() {
                if (this.tags && !Array.isArray(this.tags)) {
                    throw new Error('Tags must be an array');
                }
            }
        },
        hooks: {
            beforeCreate: async (photo) => {
                const PhotoModel = sequelize.models.Photo;
                const count = await PhotoModel.scope('byListing', photo.listingId).count();
                if (count === 0) photo.isCover = true;

                if (!photo.thumbnailUrl && photo.url) {
                    photo.thumbnailUrl = photo.url.replace(/(\.[^.]+)$/, '_thumb$1');
                }
            },
            afterDestroy: async (photo) => {
                const PhotoModel = sequelize.models.Photo;
                if (photo.isCover) {
                    const next = await PhotoModel.scope('byListing', photo.listingId).findOne({ order: [['displayOrder','ASC']] });
                    if (next) await next.update({ isCover: true });
                }
            }
        }
    });

    // Class Methods
    Photo.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };
    Photo.getCoverPhoto = function(listingId) {
        return this.scope('cover').findOne({ where: { listingId } });
    };
    Photo.findByCategory = function(listingId, category) {
        return this.scope('byListing', listingId)
            .scope('byCategory', category)
            .findAll();
    };
    Photo.findWithTags = function(listingId, tags) {
        return this.scope('byListing', listingId)
            .scope('withTags', tags)
            .findAll();
    };

    // New class methods for bulk operations
    Photo.bulkUpdateOrder = async function(listingId, photoOrders) {
        // Update multiple photos' display order at once
        // Example: await Photo.bulkUpdateOrder(listingId, [{ id: 1, order: 2 }, { id: 2, order: 1 }]);
        const updates = photoOrders.map(({ id, order }) => ({
            id,
            displayOrder: order
        }));
        return this.bulkCreate(updates, {
            updateOnDuplicate: ['displayOrder']
        });
    };

    Photo.bulkUpdateCategories = async function(listingId, photoCategories) {
        // Update multiple photos' categories at once
        // Example: await Photo.bulkUpdateCategories(listingId, [{ id: 1, category: 'bedroom' }]);
        const updates = photoCategories.map(({ id, category }) => ({
            id,
            category
        }));
        return this.bulkCreate(updates, {
            updateOnDuplicate: ['category']
        });
    };

    // Instance Methods
    Photo.prototype.setAsCover = async function() {
        await Photo.scope('cover').update(
            { isCover: false },
            { where: { listingId: this.listingId } }
        );
        return this.update({ isCover: true });
    };
    Photo.prototype.updateOrder = async function(newOrder) {
        return this.update({ displayOrder: newOrder });
    };
    Photo.prototype.approve = function() {
        return this.update({ status: 'approved' });
    };
    Photo.prototype.reject = function(reason) {
        return this.update({ status: 'rejected', rejectionReason: reason });
    };
    Photo.prototype.addTags = function(tags) {
        const current = this.tags || [];
        const newTags = Array.isArray(tags) ? tags : [tags];
        const merged = [...new Set([...current, ...newTags])];
        return this.update({ tags: merged });
    };
    Photo.prototype.removeTags = function(tags) {
        const current = this.tags || [];
        const remove = Array.isArray(tags) ? tags : [tags];
        const filtered = current.filter(t => !remove.includes(t));
        return this.update({ tags: filtered });
    };

    // New instance methods for gallery navigation
    Photo.prototype.getNextPhoto = async function() {
        // Get the next photo in display order
        return Photo.scope('byListing', this.listingId).findOne({
            where: {
                displayOrder: { [Op.gt]: this.displayOrder }
            },
            order: [['displayOrder', 'ASC']]
        });
    };

    Photo.prototype.getPreviousPhoto = async function() {
        // Get the previous photo in display order
        return Photo.scope('byListing', this.listingId).findOne({
            where: {
                displayOrder: { [Op.lt]: this.displayOrder }
            },
            order: [['displayOrder', 'DESC']]
        });
    };

    Photo.prototype.getGalleryPhotos = async function() {
        // Get all photos for the gallery view
        return Photo.scope('byListing', this.listingId).findAll({
            order: [['displayOrder', 'ASC']]
        });
    };

    // New methods for slideshow functionality
    Photo.prototype.getSlideshowPhotos = async function(options = {}) {
        // Get photos for slideshow with optional filters
        // Example: await photo.getSlideshowPhotos({ category: 'bedroom', limit: 5 });
        const { category, tags, limit } = options;
        const where = { listingId: this.listingId };
        
        if (category) where.category = category;
        if (tags) where.tags = { [Op.overlap]: Array.isArray(tags) ? tags : [tags] };
        
        return Photo.findAll({
            where,
            order: [['displayOrder', 'ASC']],
            limit: limit || undefined
        });
    };

    // New methods for photo metadata
    Photo.prototype.getPhotoMetadata = function() {
        // Get all metadata for a photo
        return {
            id: this.id,
            url: this.url,
            thumbnailUrl: this.thumbnailUrl,
            caption: this.caption,
            category: this.category,
            tags: this.tags,
            width: this.width,
            height: this.height,
            takenAt: this.takenAt,
            displayOrder: this.displayOrder,
            isCover: this.isCover
        };
    };

    // New methods for zoom/pan features
    Photo.prototype.getZoomLevels = function() {
        // Get different zoom levels for the photo
        // This assumes you have a service that generates different sizes
        return {
            original: this.url,
            large: this.url.replace(/(\.[^.]+)$/, '_large$1'),
            medium: this.url.replace(/(\.[^.]+)$/, '_medium$1'),
            small: this.url.replace(/(\.[^.]+)$/, '_small$1')
        };
    };

    // New methods for photo organization
    Photo.prototype.getRelatedPhotos = async function(options = {}) {
        // Get photos related by category or tags
        const { byCategory = true, byTags = true, limit = 5 } = options;
        const where = { listingId: this.listingId };
        
        if (byCategory) where.category = this.category;
        if (byTags && this.tags?.length) {
            where.tags = { [Op.overlap]: this.tags };
        }
        
        return Photo.findAll({
            where,
            order: [['displayOrder', 'ASC']],
            limit
        });
    };

    // Associations
    Photo.associate = (models) => {
        Photo.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
    };

    return Photo;
};
