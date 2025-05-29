const { User, HostVerification, HostProfile, Role, sequelize, Booking, Payment, Listing, Location, PropertyType, Photo, Amenity, PropertyRule } = require('../models');
const { Op } = require('sequelize');

const adminController = {
    // List all host verifications with optional filters
    listHostVerifications: async (req, res) => {
        try {
            const { status, type, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (status) where.status = status;
            if (type) where.type = type;

            const verifications = await HostVerification.findAndCountAll({
                where,
                include: [{
                    model: User,
                    as: 'host',
                    attributes: ['id', 'email', 'name']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                verifications: verifications.rows.map(v => v.getVerificationDetails()),
                total: verifications.count,
                page: parseInt(page),
                totalPages: Math.ceil(verifications.count / limit)
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching verifications', error: error.message });
        }
    },

    // List pending verifications
    listPendingVerifications: async (req, res) => {
        try {
            const verifications = await HostVerification.findAll({
                where: { status: 'pending' },
                include: [{
                    model: User,
                    as: 'host',
                    attributes: ['id', 'email', 'name']
                }],
                order: [['createdAt', 'DESC']]
            });

            res.json({
                verifications: verifications.map(v => v.getVerificationDetails())
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching pending verifications', error: error.message });
        }
    },

    // Get detailed verification info
    getVerificationDetails: async (req, res) => {
        try {
            const verification = await HostVerification.findByPk(req.params.id, {
                include: [{
                    model: User,
                    as: 'host',
                    attributes: ['id', 'email', 'name']
                }]
            });

            if (!verification) {
                return res.status(404).json({ message: 'Verification not found' });
            }

            res.json(verification.getVerificationDetails());
        } catch (error) {
            res.status(500).json({ message: 'Error fetching verification details', error: error.message });
        }
    },

    // Approve verification
    approveVerification: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const verification = await HostVerification.findByPk(req.params.id, {
                include: [{
                    model: User,
                    as: 'host',
                    include: [{
                        model: Role,
                        as: 'roles',
                        through: { attributes: [] }
                    }]
                }]
            });

            if (!verification) {
                await t.rollback();
                return res.status(404).json({ message: 'Verification not found' });
            }

            if (verification.status !== 'pending') {
                await t.rollback();
                return res.status(400).json({ message: 'Only pending verifications can be approved' });
            }

            // Update verification status
            await verification.verify(req.admin.id, { transaction: t });

            // Update host profile verification status
            const hostProfile = await HostProfile.findOne({
                where: { userId: verification.hostId }
            });

            if (hostProfile) {
                await hostProfile.update({
                    verificationStatus: 'verified'
                }, { transaction: t });
            }

            // Add host role to the user
            const hostRole = await Role.findOne({ where: { name: 'host' } });
            if (hostRole && verification.host) {
                const currentRoles = verification.host.roles.map(role => role.id);
                if (!currentRoles.includes(hostRole.id)) {
                    await verification.host.addRole(hostRole, { transaction: t });
                    console.log(`Added host role (${hostRole.id}) to user ${verification.hostId}`);
                }
            } else {
                console.warn('Host role not found or host user not loaded');
            }

            await t.commit();

            res.json({
                message: 'Verification approved successfully',
                verification: verification.getVerificationDetails()
            });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ message: 'Error approving verification', error: error.message });
        }
    },

    // Reject verification
    rejectVerification: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { reason } = req.body;
            if (!reason) {
                await t.rollback();
                return res.status(400).json({ message: 'Rejection reason is required' });
            }

            const verification = await HostVerification.findByPk(req.params.id, {
                include: [{
                    model: User,
                    as: 'host',
                    include: [{
                        model: Role,
                        as: 'roles',
                        through: { attributes: [] }
                    }]
                }]
            });

            if (!verification) {
                await t.rollback();
                return res.status(404).json({ message: 'Verification not found' });
            }

            if (verification.status !== 'pending') {
                await t.rollback();
                return res.status(400).json({ message: 'Only pending verifications can be rejected' });
            }

            // Update verification status
            await verification.reject(req.admin.id, reason, { transaction: t });

            // Update host profile verification status
            const hostProfile = await HostProfile.findOne({
                where: { userId: verification.hostId }
            });

            if (hostProfile) {
                await hostProfile.update({
                    verificationStatus: 'rejected'
                }, { transaction: t });
            }

            // Remove host role and ensure user has user role
            if (verification.host) {
                const hostRole = await Role.findOne({ where: { name: 'host' } });
                const userRole = await Role.findOne({ where: { name: 'user' } });
                
                if (hostRole && userRole) {
                    const currentRoles = verification.host.roles.map(role => role.id);
                    
                    // Remove host role if present
                    if (currentRoles.includes(hostRole.id)) {
                        await verification.host.removeRole(hostRole, { transaction: t });
                        console.log(`Removed host role (${hostRole.id}) from user ${verification.hostId}`);
                    }
                    
                    // Ensure user has user role
                    if (!currentRoles.includes(userRole.id)) {
                        await verification.host.addRole(userRole, { transaction: t });
                        console.log(`Added user role (${userRole.id}) to user ${verification.hostId}`);
                    }
                } else {
                    console.warn('Host or user role not found in database');
                }
            }

            await t.commit();

            res.json({
                message: 'Verification rejected successfully',
                verification: verification.getVerificationDetails()
            });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ message: 'Error rejecting verification', error: error.message });
        }
    },

    // List all hosts with verification status
    listHosts: async (req, res) => {
        try {
            console.log('listHosts called with params:', req.query);
            const { verificationStatus, search, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // Build where clause for host profiles
            const where = {};
            if (verificationStatus && verificationStatus !== 'all') {
                where.verificationStatus = verificationStatus;
            }
            
            console.log('Querying with where clause:', where);
            
            // Use HostProfile directly rather than joining with UserRoles
            const hostProfiles = await HostProfile.findAndCountAll({
                where,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt']
                }],
                order: [[sequelize.col('user.createdAt'), 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            console.log(`Found ${hostProfiles.rows.length} host profiles out of ${hostProfiles.count} total`);
            
            // Transform the host profiles into the expected format
            const hosts = hostProfiles.rows.map(profile => {
                const user = profile.user || {};
                return {
                    id: user.id,
                    name: user.name || 'Unknown',
                    email: user.email || 'Unknown',
                    phone: user.phone || 'N/A',
                    status: user.status || 'unknown',
                    createdAt: user.createdAt,
                    verificationStatus: profile.verificationStatus,
                    displayName: profile.displayName || user.name || 'Unknown',
                    profileId: profile.id
                };
            });

            const response = {
                hosts,
                total: hostProfiles.count,
                page: parseInt(page),
                totalPages: Math.ceil(hostProfiles.count / limit)
            };
            
            console.log('Sending response with structure:', Object.keys(response));
            console.log('Hosts array length:', hosts.length);
            
            // Return in the expected format with hosts array
            res.json(response);
        } catch (error) {
            console.error('Error in listHosts:', error);
            res.status(500).json({ message: 'Error fetching hosts', error: error.message });
        }
    },

    // Update host verification status
    updateHostVerificationStatus: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const userId = req.params.id;
            const { status, reason } = req.body;

            if (!status || !['unverified', 'pending', 'verified', 'rejected'].includes(status)) {
                await t.rollback();
                return res.status(400).json({ message: 'Invalid verification status' });
            }

            // Find the user
            const user = await User.findByPk(userId, {
                attributes: ['id', 'email', 'name', 'phone', 'status'],
                include: [{
                    model: Role,
                    as: 'roles',
                    through: { attributes: [] }
                }]
            });

            if (!user) {
                await t.rollback();
                return res.status(404).json({ message: 'User not found' });
            }

            // Find or create host profile
            let hostProfile = await HostProfile.findOne({
                where: { userId }
            });

            if (!hostProfile) {
                // Create a new host profile if one doesn't exist
                hostProfile = await HostProfile.create({
                    userId,
                    displayName: `${user.name}'s Hosting`,
                    verificationStatus: status,
                    isActive: true
                }, { transaction: t });
            } else {
                // Update existing profile
                await hostProfile.update({ verificationStatus: status }, { transaction: t });
            }

            // Update or create a verification record
            let verification = await HostVerification.findOne({
                where: { hostId: userId },
                order: [['createdAt', 'DESC']]
            });

            if (!verification) {
                // Create a new verification record
                verification = await HostVerification.create({
                    hostId: userId,
                    type: 'identity',
                    status: status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'pending',
                    verifiedById: status === 'verified' ? req.admin?.id : null,
                    verifiedAt: status === 'verified' ? new Date() : null,
                    rejectedById: status === 'rejected' ? req.admin?.id : null,
                    rejectedAt: status === 'rejected' ? new Date() : null,
                    rejectionReason: status === 'rejected' ? reason : null
                }, { transaction: t });
            } else {
                // Update the verification record based on status
                if (status === 'verified') {
                    await verification.verify(req.admin?.id, { transaction: t });
                } else if (status === 'rejected') {
                    await verification.reject(req.admin?.id, reason || 'Rejected by admin', { transaction: t });
                } else {
                    await verification.update({ status: status === 'pending' ? 'pending' : 'pending' }, { transaction: t });
                }
            }

            // *** UPDATE USER ROLE BASED ON VERIFICATION STATUS ***
            // Find the host and user roles
            const hostRole = await Role.findOne({ where: { name: 'host' } });
            const userRole = await Role.findOne({ where: { name: 'user' } });

            if (hostRole && userRole) {
                // Get current user roles
                const currentRoles = user.roles.map(role => role.id);
                
                if (status === 'verified') {
                    // Add host role if verified
                    if (!currentRoles.includes(hostRole.id)) {
                        await user.addRole(hostRole, { transaction: t });
                        console.log(`Added host role (${hostRole.id}) to user ${userId}`);
                    }
                } else if (status === 'rejected') {
                    // Remove host role if rejected
                    if (currentRoles.includes(hostRole.id)) {
                        await user.removeRole(hostRole, { transaction: t });
                        console.log(`Removed host role (${hostRole.id}) from user ${userId}`);
                    }
                    
                    // Ensure user has the user role
                    if (!currentRoles.includes(userRole.id)) {
                        await user.addRole(userRole, { transaction: t });
                        console.log(`Added user role (${userRole.id}) to user ${userId}`);
                    }
                }
            } else {
                console.warn('Host or user role not found in database');
            }

            // Load the updated host profile with user information
            const updatedHostProfile = await HostProfile.findOne({
                where: { userId },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'name', 'phone', 'status'],
                    include: [{
                        model: Role,
                        as: 'roles'
                    }]
                }]
            }, { transaction: t });

            await t.commit();

            res.json({
                message: 'Host verification status updated successfully',
                hostProfile: updatedHostProfile.getProfileDetails(),
                verification: verification.getVerificationDetails(),
                roles: updatedHostProfile.user.roles.map(role => role.name)
            });
        } catch (error) {
            await t.rollback();
            console.error('Error updating host verification status:', error);
            res.status(500).json({ message: 'Error updating host verification status', error: error.message });
        }
    },

    // List all users with filters and pagination
    listUsers: async (req, res) => {
        try {
            console.log('Request query params:', req.query);
            const { status, search, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            
            console.log('Parsed params:', { status, search, page, limit, offset });
            
            // Build where clause
            const where = {};
            if (status && status !== 'all') {
                where.status = status;
            }
            
            // Handle search parameter
            if (search && search.trim() !== '') {
                const searchTerm = `%${search.trim()}%`;
                where[Op.or] = [
                    { name: { [Op.iLike]: searchTerm } },
                    { email: { [Op.iLike]: searchTerm } }
                ];
                console.log('Search condition:', where[Op.or]);
            }
            
            console.log('Final where clause:', JSON.stringify(where));
            
            // Find users
            const users = await User.findAndCountAll({
                where,
                attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] },
                include: [
                    {
                        model: Role,
                        as: 'roles',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            console.log(`Found ${users.count} users`);
            
            // Get all userIds for batch querying
            const userIds = users.rows.map(user => user.id);
            
            // Get booking counts for all users in one query
            const bookingCountsResult = await sequelize.query(
                `SELECT "guestId", COUNT(*) as count 
                 FROM "Bookings" 
                 WHERE "guestId" IN (${userIds.join(',')}) AND status != 'cancelled'
                 GROUP BY "guestId"`,
                { type: sequelize.QueryTypes.SELECT }
            );
            
            // Create a map of userId -> booking count
            const bookingCountMap = {};
            bookingCountsResult.forEach(result => {
                bookingCountMap[result.guestId] = parseInt(result.count);
            });
            
            // Get total spent for all users in one query
            const totalSpentResult = await sequelize.query(
                `SELECT b."guestId", SUM(p.amount) as total 
                 FROM "Payments" p
                 JOIN "Bookings" b ON p."bookingId" = b.id
                 WHERE b."guestId" IN (${userIds.join(',')}) AND p.status = 'completed'
                 GROUP BY b."guestId"`,
                { type: sequelize.QueryTypes.SELECT }
            );
            
            // Create a map of userId -> total spent
            const totalSpentMap = {};
            totalSpentResult.forEach(result => {
                totalSpentMap[result.guestId] = parseFloat(result.total);
            });
            
            // Transform user data
            const transformedUsers = users.rows.map(user => {
                const userData = user.toJSON();
                
                // Determine the primary role
                let primaryRole = 'user';  // Default role
                if (userData.roles && userData.roles.length > 0) {
                    const roleNames = userData.roles.map(role => role.name);
                    
                    if (roleNames.includes('admin')) {
                        primaryRole = 'admin';
                    } else if (roleNames.includes('host')) {
                        primaryRole = 'host';
                    }
                }
                
                // Add calculated fields from maps
                userData.role = primaryRole;
                userData.bookingsCount = bookingCountMap[userData.id] || 0;
                userData.totalSpent = totalSpentMap[userData.id] || 0;
                
                return userData;
            });
            
            const response = {
                data: transformedUsers,
                total: users.count,
                page: parseInt(page),
                totalPages: Math.ceil(users.count / limit)
            };
            
            console.log('Sending response:', {
                dataCount: response.data.length,
                total: response.total,
                page: response.page,
                totalPages: response.totalPages
            });
            
            res.json(response);
        } catch (error) {
            console.error('Error in listUsers:', error);
            res.status(500).json({ message: 'Error fetching users', error: error.message });
        }
    },

    // Get user details by ID
    getUserDetails: async (req, res) => {
        try {
            const userId = req.params.id;
            
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] },
                include: [
                    {
                        model: Role,
                        as: 'roles',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ]
            });
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Transform user data
            const userData = user.toJSON();
            
            // Determine the primary role
            let primaryRole = 'user';  // Default role
            if (userData.roles && userData.roles.length > 0) {
                const roleNames = userData.roles.map(role => role.name);
                
                if (roleNames.includes('admin')) {
                    primaryRole = 'admin';
                } else if (roleNames.includes('host')) {
                    primaryRole = 'host';
                }
            }
            
            userData.role = primaryRole;
            
            // Get booking count for this user
            const bookingCountResult = await sequelize.query(
                `SELECT COUNT(*) as count FROM "Bookings" WHERE "guestId" = :userId AND status != 'cancelled'`,
                {
                    replacements: { userId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Get total spent for this user
            const totalSpentResult = await sequelize.query(
                `SELECT SUM(p.amount) as total 
                 FROM "Payments" p
                 JOIN "Bookings" b ON p."bookingId" = b.id
                 WHERE b."guestId" = :userId AND p.status = 'completed'`,
                {
                    replacements: { userId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Add calculated fields
            userData.bookingsCount = parseInt(bookingCountResult[0].count) || 0;
            userData.totalSpent = totalSpentResult[0]?.total ? parseFloat(totalSpentResult[0].total) : 0;
            
            res.json(userData);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching user details', error: error.message });
        }
    },

    // Ban a user
    banUser: async (req, res) => {
        try {
            const userId = req.params.id;
            const { reason } = req.body;
            
            const user = await User.findByPk(userId);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Update user status
            await user.update({ 
                status: 'banned',
                banReason: reason || null,
                bannedBy: req.admin.id,
                bannedAt: new Date()
            });
            
            res.json({ message: 'User banned successfully', user: { id: user.id, status: user.status } });
        } catch (error) {
            res.status(500).json({ message: 'Error banning user', error: error.message });
        }
    },

    // Unban a user
    unbanUser: async (req, res) => {
        try {
            const userId = req.params.id;
            
            const user = await User.findByPk(userId);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Update user status
            await user.update({ 
                status: 'active',
                banReason: null,
                bannedBy: null,
                bannedAt: null
            });
            
            res.json({ message: 'User unbanned successfully', user: { id: user.id, status: user.status } });
        } catch (error) {
            res.status(500).json({ message: 'Error unbanning user', error: error.message });
        }
    },

    // Bulk ban users
    bulkBanUsers: async (req, res) => {
        try {
            const { ids, reason } = req.body;
            
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'No user IDs provided' });
            }
            
            // Update multiple users
            await User.update(
                { 
                    status: 'banned',
                    banReason: reason || null,
                    bannedBy: req.admin.id,
                    bannedAt: new Date()
                },
                { where: { id: ids } }
            );
            
            res.json({ message: `${ids.length} users banned successfully` });
        } catch (error) {
            res.status(500).json({ message: 'Error bulk banning users', error: error.message });
        }
    },

    // Bulk unban users
    bulkUnbanUsers: async (req, res) => {
        try {
            const { ids } = req.body;
            
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'No user IDs provided' });
            }
            
            // Update multiple users
            await User.update(
                { 
                    status: 'active',
                    banReason: null,
                    bannedBy: null,
                    bannedAt: null
                },
                { where: { id: ids } }
            );
            
            res.json({ message: `${ids.length} users unbanned successfully` });
        } catch (error) {
            res.status(500).json({ message: 'Error bulk unbanning users', error: error.message });
        }
    },

    // Get host details by ID
    getHostDetails: async (req, res) => {
        try {
            const userId = req.params.id;
            
            // Find the host profile directly
            const hostProfile = await HostProfile.findOne({
                where: { userId },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] }
                }]
            });
            
            if (!hostProfile) {
                return res.status(404).json({ message: 'Host profile not found' });
            }
            
            // Get verification history
            const verifications = await HostVerification.findAll({
                where: { hostId: userId },
                order: [['createdAt', 'DESC']]
            });
            
            // Get host listings count
            const listingsCount = await sequelize.query(
                `SELECT COUNT(*) as count FROM "Listings" WHERE "hostId" = :userId`,
                {
                    replacements: { userId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Get completed bookings count
            const bookingsCount = await sequelize.query(
                `SELECT COUNT(*) as count FROM "Bookings" WHERE "hostId" = :userId AND status = 'completed'`,
                {
                    replacements: { userId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Get total earnings
            const earnings = await sequelize.query(
                `SELECT SUM(p.amount) as total 
                 FROM "Payments" p
                 JOIN "Bookings" b ON p."bookingId" = b.id
                 WHERE b."hostId" = :userId AND p.status = 'completed'`,
                {
                    replacements: { userId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const userData = hostProfile.user ? hostProfile.user.toJSON() : {};
            
            // Format response
            const response = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                status: userData.status,
                roles: ['host'], // Since we know this is a host
                hostProfile: hostProfile.getProfileDetails(),
                verifications: verifications.map(v => v.getVerificationDetails()),
                stats: {
                    listingsCount: parseInt(listingsCount[0]?.count || 0),
                    bookingsCount: parseInt(bookingsCount[0]?.count || 0),
                    totalEarnings: earnings[0]?.total ? parseFloat(earnings[0].total) : 0
                }
            };
            
            res.json(response);
        } catch (error) {
            console.error('Error fetching host details:', error);
            res.status(500).json({ message: 'Error fetching host details', error: error.message });
        }
    },

    // List all properties for admin
    listAllProperties: async (req, res) => {
        try {
            const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
            
            const offset = (page - 1) * limit;
            const whereClause = {};
            
            // Filter by status if provided
            if (status) {
                whereClause.status = status;
            }
            
            // First, get all listings directly using a simple query
            const listings = await sequelize.query(
                `SELECT 
                    l.id, 
                    l.title, 
                    l.status, 
                    CAST(l."pricePerNight" AS DECIMAL(10,2)) as "pricePerNight", 
                    l."hostId", 
                    l."propertyTypeId", 
                    l."locationId", 
                    l."createdAt", 
                    l."updatedAt"
                 FROM "Listings" l
                 ORDER BY l."${sortBy}" ${sortOrder}
                 LIMIT :limit OFFSET :offset`,
                {
                    replacements: { 
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Get total count
            const countResult = await sequelize.query(
                'SELECT COUNT(*) as total FROM "Listings"',
                {
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const count = parseInt(countResult[0].total);
            
            // Format response
            const formattedListings = listings.map(listing => {
                // Debug log the raw price value
                console.log(`Backend raw pricePerNight for listing ${listing.id}:`, listing.pricePerNight, typeof listing.pricePerNight);
                
                // Convert pricePerNight to a valid number or default to 0
                const pricePerNight = typeof listing.pricePerNight === 'number' && !isNaN(listing.pricePerNight) 
                    ? listing.pricePerNight 
                    : typeof listing.pricePerNight === 'string' && !isNaN(parseFloat(listing.pricePerNight))
                        ? parseFloat(listing.pricePerNight)
                        : 0;
                
                console.log(`Backend formatted pricePerNight for listing ${listing.id}:`, pricePerNight);
                
                return {
                    id: listing.id,
                    title: listing.title || 'Untitled Property',
                    status: listing.status || 'unknown',
                    pricePerNight: pricePerNight,
                    location: 'Location info available on detail view',
                    propertyType: 'Property type info available on detail view',
                    host: { 
                        id: listing.hostId,
                        name: 'Host info available on detail view',
                        email: '',
                        status: 'active'
                    },
                    featuredPhotoUrl: null,
                    createdAt: listing.createdAt,
                    updatedAt: listing.updatedAt
                };
            });
            
            // Adjust response format to match frontend expectations
            res.json({
                listings: formattedListings,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            console.error('Error fetching listings:', error);
            res.status(500).json({ message: 'Error fetching property listings', error: error.message });
        }
    },
    
    // Get detailed property information
    getPropertyDetails: async (req, res) => {
        try {
            const listingId = req.params.id;
            
            // Get the listing directly using SQL
            const listings = await sequelize.query(
                `SELECT l.* 
                 FROM "Listings" l
                 WHERE l.id = :listingId`,
                {
                    replacements: { listingId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            if (!listings.length) {
                return res.status(404).json({ message: 'Property not found' });
            }
            
            const listing = listings[0];
            
            // Get host information
            const hosts = await sequelize.query(
                `SELECT u.id, u.name, u.email, u.status
                 FROM "Users" u
                 WHERE u.id = :hostId`,
                {
                    replacements: { hostId: listing.hostId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const host = hosts.length ? hosts[0] : null;
            
            // Get property type
            const propertyTypes = await sequelize.query(
                `SELECT pt.id, pt.name, pt.description
                 FROM "PropertyTypes" pt
                 WHERE pt.id = :propertyTypeId`,
                {
                    replacements: { propertyTypeId: listing.propertyTypeId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const propertyType = propertyTypes.length ? propertyTypes[0] : null;
            
            // Get location
            const locations = await sequelize.query(
                `SELECT l.id, l.name
                 FROM "Locations" l
                 WHERE l.id = :locationId`,
                {
                    replacements: { locationId: listing.locationId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const location = locations.length ? locations[0] : null;
            
            // Get booking stats
            const bookingStats = await sequelize.query(
                `SELECT 
                    COUNT(*) as totalBookings,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedBookings,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledBookings,
                    SUM(CASE WHEN status = 'completed' THEN "totalPrice" ELSE 0 END) as totalRevenue
                 FROM "Bookings"
                 WHERE "listingId" = :listingId`,
                {
                    replacements: { listingId },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Format response
            const response = {
                ...listing,
                host,
                propertyType,
                location,
                stats: {
                    totalBookings: parseInt(bookingStats[0]?.totalBookings || 0),
                    completedBookings: parseInt(bookingStats[0]?.completedBookings || 0),
                    cancelledBookings: parseInt(bookingStats[0]?.cancelledBookings || 0),
                    totalRevenue: bookingStats[0]?.totalRevenue ? parseFloat(bookingStats[0].totalRevenue) : 0
                }
            };
            
            res.json(response);
        } catch (error) {
            console.error('Error fetching property details:', error);
            res.status(500).json({ message: 'Error fetching property details', error: error.message });
        }
    },
    
    // Update property status
    updatePropertyStatus: async (req, res) => {
        try {
            const listingId = req.params.id;
            const { status, reason } = req.body;
            
            // Validate status
            const validStatuses = ['draft', 'published', 'under_review', 'rejected', 'suspended'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    message: 'Invalid status value', 
                    validValues: validStatuses 
                });
            }
            
            // Find the listing
            const listing = await Listing.findByPk(listingId);
            
            if (!listing) {
                return res.status(404).json({ message: 'Property not found' });
            }
            
            // Update listing status
            const updateData = { 
                status,
                adminNotes: reason || listing.adminNotes
            };
            
            // Add rejection or suspension details if applicable
            if (status === 'rejected' || status === 'suspended') {
                if (!reason) {
                    return res.status(400).json({ message: 'Reason is required for rejection or suspension' });
                }
                
                updateData.lastStatusChangeReason = reason;
                updateData.lastStatusChangeDate = new Date();
                updateData.lastStatusChangeBy = req.admin.id;
            }
            
            await listing.update(updateData);
            
            res.json({ 
                message: `Property status updated to ${status}`, 
                listing: { 
                    id: listing.id, 
                    title: listing.title,
                    status: listing.status 
                } 
            });
        } catch (error) {
            console.error('Error updating property status:', error);
            res.status(500).json({ message: 'Error updating property status', error: error.message });
        }
    },
    
    // Delete a property
    deleteProperty: async (req, res) => {
        try {
            const listingId = req.params.id;
            
            // Check if listing exists
            const listing = await Listing.findByPk(listingId);
            
            if (!listing) {
                return res.status(404).json({ message: 'Property not found' });
            }
            
            // Check if listing has active bookings
            const activeBookings = await Booking.count({
                where: {
                    listingId,
                    status: ['pending', 'confirmed', 'in_progress']
                }
            });
            
            if (activeBookings > 0) {
                return res.status(400).json({ 
                    message: 'Cannot delete property with active bookings',
                    activeBookingsCount: activeBookings
                });
            }
            
            // Delete the listing
            await listing.destroy();
            
            res.json({ message: 'Property deleted successfully' });
        } catch (error) {
            console.error('Error deleting property:', error);
            res.status(500).json({ message: 'Error deleting property', error: error.message });
        }
    },

    // List all bookings for admin
    listBookings: async (req, res) => {
        try {
            const { status, page = 1, limit = 10, listingId, guestId } = req.query;
            const offset = (page - 1) * limit;
            
            // Build where clause
            const where = {};
            if (status) where.status = status;
            if (listingId) where.listingId = listingId;
            if (guestId) where.guestId = guestId;
            
            const bookings = await Booking.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'guest',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: Listing,
                        as: 'listing',
                        attributes: ['id', 'title']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
            // Format response with proper totalPrice values
            const formattedBookings = bookings.rows.map(booking => {
                const bookingData = booking.toJSON();
                
                // Ensure totalPrice is a valid number
                if (bookingData.totalPrice !== undefined) {
                    // If it's a string, convert it to a number
                    if (typeof bookingData.totalPrice === 'string') {
                        bookingData.totalPrice = parseFloat(bookingData.totalPrice);
                    }
                    
                    // If it's NaN, set it to 0
                    if (isNaN(bookingData.totalPrice)) {
                        bookingData.totalPrice = 0;
                    }
                } else {
                    bookingData.totalPrice = 0;
                }
                
                return bookingData;
            });
            
            res.json({
                data: formattedBookings,
                total: bookings.count,
                page: parseInt(page),
                totalPages: Math.ceil(bookings.count / parseInt(limit))
            });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            res.status(500).json({ message: 'Error fetching bookings', error: error.message });
        }
    },
    
    // Get booking details
    getBookingDetails: async (req, res) => {
        try {
            console.log(`Fetching booking details for ID: ${req.params.id}`);
            const bookingId = req.params.id;
            
            // First try to find with raw query to check if booking exists at all
            const bookingExists = await sequelize.query(
                `SELECT EXISTS(SELECT 1 FROM "Bookings" WHERE id = :bookingId)`,
                {
                    replacements: { bookingId },
                    type: sequelize.QueryTypes.SELECT,
                    plain: true
                }
            );
            
            const exists = bookingExists ? bookingExists.exists : false;
            if (!exists) {
                console.log(`Booking with ID ${bookingId} does not exist in database`);
                return res.status(404).json({ 
                    message: 'Booking not found',
                    details: `No booking exists with ID ${bookingId}`,
                    code: 'BOOKING_NOT_FOUND'
                });
            }
            
            // Try to get booking data directly with SQL as a fallback
            const rawBookingData = await sequelize.query(
                `SELECT * FROM "Bookings" WHERE id = :bookingId`,
                {
                    replacements: { bookingId },
                    type: sequelize.QueryTypes.SELECT,
                    plain: true
                }
            );
            
            console.log(`Raw booking data for ID ${bookingId}:`, rawBookingData ? 'Found' : 'Not found');
            
            // Try to load the full booking with associations
            let booking = null;
            try {
                booking = await Booking.findByPk(bookingId, {
                    include: [
                        {
                            model: User,
                            as: 'guest',
                            attributes: ['id', 'name', 'email', 'phone']
                        },
                        {
                            model: User,
                            as: 'host',
                            attributes: ['id', 'name', 'email', 'phone']
                        },
                        {
                            model: Listing,
                            as: 'listing',
                            attributes: ['id', 'title', 'pricePerNight']
                        },
                        {
                            model: Payment,
                            as: 'payments'
                        }
                    ]
                });
            } catch (associationError) {
                console.error(`Error loading booking with associations: ${associationError.message}`);
            }
            
            // If booking with associations couldn't be loaded, use raw data as fallback
            if (!booking && rawBookingData) {
                console.log(`Using raw data fallback for booking ID ${bookingId}`);
                
                // Get minimal guest and host data
                let guestData = null;
                let hostData = null;
                let listingData = null;
                
                try {
                    if (rawBookingData.guestId) {
                        const guestResult = await sequelize.query(
                            `SELECT id, name, email, phone FROM "Users" WHERE id = :userId`,
                            {
                                replacements: { userId: rawBookingData.guestId },
                                type: sequelize.QueryTypes.SELECT,
                                plain: true
                            }
                        );
                        guestData = guestResult;
                    }
                    
                    if (rawBookingData.hostId) {
                        const hostResult = await sequelize.query(
                            `SELECT id, name, email, phone FROM "Users" WHERE id = :userId`,
                            {
                                replacements: { userId: rawBookingData.hostId },
                                type: sequelize.QueryTypes.SELECT,
                                plain: true
                            }
                        );
                        hostData = hostResult;
                    }
                    
                    if (rawBookingData.listingId) {
                        const listingResult = await sequelize.query(
                            `SELECT id, title, "pricePerNight" FROM "Listings" WHERE id = :listingId`,
                            {
                                replacements: { listingId: rawBookingData.listingId },
                                type: sequelize.QueryTypes.SELECT,
                                plain: true
                            }
                        );
                        listingData = listingResult;
                    }
                } catch (fallbackError) {
                    console.error(`Error loading fallback data: ${fallbackError.message}`);
                }
                
                // Create a booking-like object
                const fallbackBooking = {
                    ...rawBookingData,
                    guest: guestData,
                    host: hostData,
                    listing: listingData,
                    payments: []
                };
                
                // Process this as our booking
                booking = fallbackBooking;
            }
            
            if (!booking) {
                console.log(`Booking with ID ${bookingId} not found with associations`);
                return res.status(404).json({ 
                    message: 'Booking not found',
                    details: 'The booking exists but could not be loaded with its associations',
                    code: 'BOOKING_LOAD_FAILED'
                });
            }
            
            // Process the booking to ensure totalPrice is a number
            const bookingData = booking.toJSON ? booking.toJSON() : booking;
            if (bookingData.totalPrice !== undefined) {
                // If it's a string, convert it to a number
                if (typeof bookingData.totalPrice === 'string') {
                    bookingData.totalPrice = parseFloat(bookingData.totalPrice);
                }
                // If it's NaN, set it to 0
                if (isNaN(bookingData.totalPrice)) {
                    bookingData.totalPrice = 0;
                }
            }
            
            console.log(`Successfully prepared booking data for ID ${bookingId}`);
            res.json(bookingData);
        } catch (error) {
            console.error('Error fetching booking details:', error);
            res.status(500).json({ 
                message: 'Error fetching booking details', 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },
    
    // Update booking status by admin
    updateBookingStatus: async (req, res) => {
        try {
            const bookingId = req.params.id;
            const { status, reason } = req.body;
            
            // Validate status
            const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    message: 'Invalid status value', 
                    validValues: validStatuses 
                });
            }
            
            // Find the booking
            const booking = await Booking.findByPk(bookingId);
            
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            
            // Update booking status
            await booking.update({
                status,
                statusReason: reason,
                statusUpdatedAt: new Date(),
                statusUpdatedBy: req.admin.id
            });
            
            res.json({ 
                message: `Booking status updated to ${status}`, 
                booking: { 
                    id: booking.id, 
                    status: booking.status,
                    statusReason: booking.statusReason,
                    statusUpdatedAt: booking.statusUpdatedAt
                } 
            });
        } catch (error) {
            console.error('Error updating booking status:', error);
            res.status(500).json({ message: 'Error updating booking status', error: error.message });
        }
    },
    
    // Get dashboard stats
    getDashboardStats: async (req, res) => {
        try {
            // Get total users count
            const usersCount = await User.count();
            
            // Get total hosts count
            const hostsCount = await HostProfile.count();
            
            // Get total properties count
            const propertiesCount = await Listing.count();
            
            // Get total bookings count
            const bookingsCount = await Booking.count();
            
            // Get total revenue
            const revenueResult = await sequelize.query(
                `SELECT SUM(amount) as total FROM "Payments" WHERE status = 'completed'`,
                { type: sequelize.QueryTypes.SELECT }
            );
            
            // Get recent bookings
            const recentBookings = await Booking.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'guest',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: Listing,
                        as: 'listing',
                        attributes: ['id', 'title']
                    }
                ]
            });
            
            // Get recent users
            const recentUsers = await User.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] }
            });
            
            // Format response
            res.json({
                counts: {
                    users: usersCount,
                    hosts: hostsCount,
                    properties: propertiesCount,
                    bookings: bookingsCount,
                    revenue: revenueResult[0]?.total ? parseFloat(revenueResult[0].total) : 0
                },
                recent: {
                    bookings: recentBookings,
                    users: recentUsers
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
        }
    },

    // Get all reviews for admin management
    listAllReviews: async (req, res) => {
        try {
            const db = require('../models');
            const { page = 1, limit = 10, status, rating, property, search } = req.query;
            const offset = (page - 1) * limit;
            
            // Base query conditions
            const where = {};
            
            // Filter by visibility status if provided
            if (status === 'true') {
                where.isPublic = true;
            } else if (status === 'false') {
                where.isPublic = false;
            }
            
            // Filter by rating if provided
            if (rating) {
                where.rating = parseInt(rating);
            }
            
            // Get total count of matching reviews
            const totalReviews = await db.Review.count({ where });
            
            // Fetch reviews with pagination
            const reviews = await db.Review.findAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: db.User,
                        as: 'reviewer',
                        attributes: ['id', 'name', 'email', 'profilePicture']
                    },
                    {
                        model: db.User,
                        as: 'reviewed',
                        attributes: ['id', 'name', 'email', 'profilePicture']
                    },
                    {
                        model: db.Booking,
                        as: 'booking',
                        include: [
                            {
                                model: db.Listing,
                                as: 'listing',
                                attributes: ['id', 'title', 'propertyTypeId'],
                                where: property ? { id: property } : {}
                            }
                        ]
                    }
                ]
            });
            
            // Format the reviews for the response
            const formattedReviews = reviews.map(review => {
                return {
                    id: review.id,
                    bookingId: review.bookingId,
                    reviewerId: review.reviewerId,
                    reviewedId: review.reviewedId,
                    rating: review.rating,
                    comment: review.comment,
                    type: review.type,
                    isPublic: review.isPublic,
                    response: review.response,
                    responseDate: review.responseDate,
                    createdAt: review.createdAt,
                    reviewer: review.reviewer ? {
                        id: review.reviewer.id,
                        name: review.reviewer.name,
                        email: review.reviewer.email,
                        profilePicture: review.reviewer.profilePicture
                    } : null,
                    reviewed: review.reviewed ? {
                        id: review.reviewed.id,
                        name: review.reviewed.name,
                        email: review.reviewed.email,
                        profilePicture: review.reviewed.profilePicture
                    } : null,
                    property: review.booking?.listing ? {
                        id: review.booking.listing.id,
                        title: review.booking.listing.title,
                        propertyTypeId: review.booking.listing.propertyTypeId
                    } : null
                };
            });
            
            res.json({
                success: true,
                data: formattedReviews,
                pagination: {
                    total: totalReviews,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalReviews / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reviews'
            });
        }
    },

    // Get details of a specific review
    getReviewDetails: async (req, res) => {
        try {
            const db = require('../models');
            const { id } = req.params;
            
            const review = await db.Review.findByPk(id, {
                include: [
                    {
                        model: db.User,
                        as: 'reviewer',
                        attributes: ['id', 'name', 'email', 'profilePicture']
                    },
                    {
                        model: db.User,
                        as: 'reviewed',
                        attributes: ['id', 'name', 'email', 'profilePicture']
                    },
                    {
                        model: db.Booking,
                        as: 'booking',
                        include: [
                            {
                                model: db.Listing,
                                as: 'listing',
                                attributes: ['id', 'title', 'hostId', 'propertyTypeId']
                            }
                        ]
                    },
                    {
                        model: db.ReviewResponse,
                        as: 'reviewResponse'
                    }
                ]
            });
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            // Format the review for the response
            const formattedReview = {
                id: review.id,
                bookingId: review.bookingId,
                reviewerId: review.reviewerId,
                reviewedId: review.reviewedId,
                rating: review.rating,
                comment: review.comment,
                type: review.type,
                isPublic: review.isPublic,
                response: review.response,
                responseDate: review.responseDate,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
                reviewer: review.reviewer ? {
                    id: review.reviewer.id,
                    name: review.reviewer.name,
                    email: review.reviewer.email,
                    profilePicture: review.reviewer.profilePicture
                } : null,
                reviewed: review.reviewed ? {
                    id: review.reviewed.id,
                    name: review.reviewed.name,
                    email: review.reviewed.email,
                    profilePicture: review.reviewed.profilePicture
                } : null,
                property: review.booking?.listing ? {
                    id: review.booking.listing.id,
                    title: review.booking.listing.title,
                    hostId: review.booking.listing.hostId,
                    propertyTypeId: review.booking.listing.propertyTypeId
                } : null
            };
            
            res.json({
                success: true,
                data: formattedReview
            });
        } catch (error) {
            console.error('Error fetching review details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch review details'
            });
        }
    },

    // Update review visibility (publish/hide)
    updateReviewVisibility: async (req, res) => {
        try {
            const db = require('../models');
            const { id } = req.params;
            const { isPublic } = req.body;
            
            if (typeof isPublic !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request - isPublic must be a boolean'
                });
            }
            
            const review = await db.Review.findByPk(id);
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            await review.update({ isPublic });
            
            res.json({
                success: true,
                message: `Review ${isPublic ? 'published' : 'hidden'} successfully`,
                data: { id: review.id, isPublic }
            });
        } catch (error) {
            console.error('Error updating review visibility:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update review visibility'
            });
        }
    },

    // Delete a review
    deleteReview: async (req, res) => {
        try {
            const db = require('../models');
            const { id } = req.params;
            
            const review = await db.Review.findByPk(id);
            
            if (!review) {
                return res.status(404).json({
                    success: false,
                    error: 'Review not found'
                });
            }
            
            // Also delete any response
            await db.ReviewResponse.destroy({
                where: { reviewId: id }
            });
            
            // Delete the review
            await review.destroy();
            
            res.json({
                success: true,
                message: 'Review deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete review'
            });
        }
    },

    // List all payments with pagination and filtering
    listPayments: async (req, res) => {
        try {
            const { Op } = require('sequelize');
            const { 
                page = 1, 
                limit = 10,
                status,
                paymentMethod,
                startDate,
                endDate,
                search
            } = req.query;

            console.log('Payment list query params:', req.query);
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Build the where clause based on filters
            const whereClause = {};
            
            if (status && status !== 'all') {
                whereClause.status = status;
            }
            
            if (paymentMethod && paymentMethod !== 'all') {
                whereClause.paymentMethod = paymentMethod;
            }
            
            // Date range filter
            if (startDate || endDate) {
                whereClause.createdAt = {};
                
                if (startDate) {
                    whereClause.createdAt[Op.gte] = new Date(startDate);
                }
                
                if (endDate) {
                    const endDateObj = new Date(endDate);
                    endDateObj.setDate(endDateObj.getDate() + 1); // Include the entire end date
                    whereClause.createdAt[Op.lt] = endDateObj;
                }
            }
            
            console.log('Payment search where clause:', JSON.stringify(whereClause));
            
            // Get total count for pagination with a simple query to avoid eager loading issues
            const totalPayments = await Payment.count({
                where: whereClause,
            });
            
            console.log(`Total payments matching criteria: ${totalPayments}`);
            
            // Simplified query with direct joins, making sure not to reference non-existent columns
            const payments = await sequelize.query(
                `SELECT 
                   p.id, p.amount, p.currency, p.status, p."paymentMethod", 
                   p."idempotencyKey", p."processedAt", p."completedAt", p."refundedAt", 
                   p."failureReason", p."createdAt", p."updatedAt", p."paymentDetails",
                   b.id as "bookingId", b."listingId", b."guestId", b."hostId",
                   g.name as "guestName", g.email as "guestEmail",
                   l.title as "listingTitle"
                 FROM "Payments" p
                 LEFT JOIN "Bookings" b ON p."bookingId" = b.id
                 LEFT JOIN "Users" g ON b."guestId" = g.id
                 LEFT JOIN "Listings" l ON b."listingId" = l.id
                 WHERE ${Object.keys(whereClause).length > 0 
                    ? Object.entries(whereClause).map(([key, value]) => {
                        if (key === 'createdAt') {
                            let dateConditions = [];
                            if (value[Op.gte]) {
                                dateConditions.push(`p."createdAt" >= '${value[Op.gte].toISOString()}'`);
                            }
                            if (value[Op.lt]) {
                                dateConditions.push(`p."createdAt" < '${value[Op.lt].toISOString()}'`);
                            }
                            return dateConditions.join(' AND ');
                        } else {
                            return `p."${key}" = '${value}'`;
                        }
                      }).join(' AND ')
                    : '1=1'}
                 ORDER BY p."createdAt" DESC
                 LIMIT ${parseInt(limit)} OFFSET ${offset}`,
                { 
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            console.log(`Found ${payments.length} payments`);
            
            // Get host information in a separate query for all hosts in the results
            const hostIds = payments
                .map(payment => payment.hostId)
                .filter(id => id);
            
            const hosts = hostIds.length > 0 ? await User.findAll({
                where: { id: hostIds },
                attributes: ['id', 'name', 'email']
            }) : [];
            
            // Create a map for easy lookup
            const hostMap = {};
            hosts.forEach(host => {
                hostMap[host.id] = {
                    id: host.id,
                    name: host.name || 'Unknown Host',
                    email: host.email
                };
            });
            
            // Format payments for response
            const formattedPayments = payments.map(payment => {
                // Calculate fees
                const amount = parseFloat(payment.amount) || 0;
                const platformFee = amount * 0.15; // 15% platform fee
                const hostPayout = amount - platformFee;
                
                // Get host info from map
                const hostId = payment.hostId;
                const host = hostId ? hostMap[hostId] : null;
                
                // Payment details for card info
                let cardInfo;
                try {
                    const paymentDetails = payment.paymentDetails 
                        ? (typeof payment.paymentDetails === 'string' 
                            ? JSON.parse(payment.paymentDetails) 
                            : payment.paymentDetails)
                        : null;
                        
                    if (payment.paymentMethod === 'credit_card' && paymentDetails?.cardInfo) {
                        cardInfo = {
                            cardType: paymentDetails.cardInfo.brand || 'Credit Card',
                            last4: paymentDetails.cardInfo.last4 || '****'
                        };
                    }
                } catch (e) {
                    console.error('Error parsing payment details:', e);
                    cardInfo = undefined;
                }
                
                return {
                    id: payment.id.toString(),
                    bookingId: payment.bookingId ? payment.bookingId.toString() : 'unknown',
                    propertyId: payment.listingId ? payment.listingId.toString() : 'unknown',
                    propertyName: payment.listingTitle || 'Unknown Property',
                    userId: payment.guestId ? payment.guestId.toString() : 'unknown',
                    userName: payment.guestName || 'Unknown User',
                    hostId: hostId ? hostId.toString() : null,
                    hostName: host ? host.name : 'Unknown Host',
                    amount: amount,
                    currency: payment.currency || 'USD',
                    platformFee: parseFloat(platformFee.toFixed(2)),
                    hostPayout: parseFloat(hostPayout.toFixed(2)),
                    status: payment.status || 'unknown',
                    paymentMethod: payment.paymentMethod || 'unknown',
                    transactionId: payment.idempotencyKey || payment.id.toString(),
                    dateProcessed: payment.processedAt || payment.createdAt,
                    refundAmount: payment.status === 'refunded' ? amount : undefined,
                    refundReason: payment.status === 'refunded' ? 'Refunded by admin' : undefined,
                    refundDate: payment.refundedAt,
                    cardInfo: cardInfo
                };
            });
            
            res.json({
                success: true,
                data: formattedPayments,
                pagination: {
                    total: totalPayments,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalPayments / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching payments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch payments',
                details: error.message
            });
        }
    },
    
    // Get payment details
    getPaymentDetails: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`Fetching details for payment ID: ${id}`);
            
            // First check if payment exists with a simple query
            const paymentExists = await sequelize.query(
                `SELECT EXISTS(SELECT 1 FROM "Payments" WHERE id = :id)`,
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT,
                    plain: true
                }
            );
            
            if (!paymentExists.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Payment not found'
                });
            }
            
            // Get payment with its related booking, guest, listing info
            // Removed reference to non-existent guestCount column
            const paymentData = await sequelize.query(
                `SELECT 
                    p.id, p.amount, p.currency, p.status, p."paymentMethod", 
                    p."idempotencyKey", p."processedAt", p."completedAt", p."refundedAt", 
                    p."failureReason", p."createdAt", p."updatedAt", p."paymentDetails", p.metadata,
                    b.id as "bookingId", b."listingId", b."guestId", b."hostId", 
                    b."checkIn", b."checkOut", b.status as "bookingStatus", b."createdAt" as "bookingCreatedAt",
                    g.id as "guestId", g.name as "guestName", g.email as "guestEmail", g."profilePicture" as "guestProfilePicture",
                    l.id as "listingId", l.title as "listingTitle"
                FROM "Payments" p
                LEFT JOIN "Bookings" b ON p."bookingId" = b.id
                LEFT JOIN "Users" g ON b."guestId" = g.id
                LEFT JOIN "Listings" l ON b."listingId" = l.id
                WHERE p.id = :id`,
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT,
                    plain: true
                }
            );
            
            if (!paymentData) {
                return res.status(404).json({
                    success: false,
                    error: 'Payment details could not be retrieved'
                });
            }
            
            // Get host information separately
            let host = null;
            if (paymentData.hostId) {
                host = await User.findByPk(paymentData.hostId, {
                    attributes: ['id', 'name', 'email', 'profilePicture']
                });
            }
            
            // Calculate fees
            const amount = parseFloat(paymentData.amount) || 0;
            const platformFee = amount * 0.15; // 15% platform fee
            const hostPayout = amount - platformFee;
            
            // Parse payment details for card info
            let paymentDetails = null;
            try {
                if (paymentData.paymentDetails) {
                    if (typeof paymentData.paymentDetails === 'string') {
                        paymentDetails = JSON.parse(paymentData.paymentDetails);
                    } else {
                        paymentDetails = paymentData.paymentDetails;
                    }
                }
            } catch (e) {
                console.error('Error parsing payment details:', e);
            }
            
            // Parse metadata
            let metadata = null;
            try {
                if (paymentData.metadata) {
                    if (typeof paymentData.metadata === 'string') {
                        metadata = JSON.parse(paymentData.metadata);
                    } else {
                        metadata = paymentData.metadata;
                    }
                }
            } catch (e) {
                console.error('Error parsing payment metadata:', e);
            }
            
            // Use a default guest count for the booking details
            const defaultGuestCount = 1;
            
            // Format the response
            const formattedPayment = {
                id: paymentData.id.toString(),
                bookingId: paymentData.bookingId ? paymentData.bookingId.toString() : 'unknown',
                propertyId: paymentData.listingId ? paymentData.listingId.toString() : 'unknown',
                propertyName: paymentData.listingTitle || 'Unknown Property',
                userId: paymentData.guestId ? paymentData.guestId.toString() : 'unknown',
                userName: paymentData.guestName || 'Unknown User',
                userEmail: paymentData.guestEmail || 'Unknown',
                userProfilePicture: paymentData.guestProfilePicture,
                hostId: host ? host.id.toString() : null,
                hostName: host ? host.name : 'Unknown Host',
                hostEmail: host ? host.email : null,
                hostProfilePicture: host ? host.profilePicture : null,
                amount: amount,
                currency: paymentData.currency || 'USD',
                platformFee: parseFloat(platformFee.toFixed(2)),
                hostPayout: parseFloat(hostPayout.toFixed(2)),
                status: paymentData.status || 'unknown',
                paymentMethod: paymentData.paymentMethod || 'unknown',
                paymentDetails: paymentDetails,
                transactionId: paymentData.idempotencyKey || paymentData.id.toString(),
                dateProcessed: paymentData.processedAt,
                dateCompleted: paymentData.completedAt,
                refundAmount: paymentData.status === 'refunded' ? amount : undefined,
                refundReason: paymentData.status === 'refunded' && metadata?.refundReason ? 
                    metadata.refundReason : 'No reason provided',
                refundDate: paymentData.refundedAt,
                failureReason: paymentData.failureReason,
                bookingDetails: paymentData.bookingId ? {
                    checkIn: paymentData.checkIn,
                    checkOut: paymentData.checkOut,
                    guestCount: defaultGuestCount, // Using default value since column doesn't exist
                    status: paymentData.bookingStatus,
                    createdAt: paymentData.bookingCreatedAt
                } : null,
                createdAt: paymentData.createdAt,
                updatedAt: paymentData.updatedAt
            };
            
            console.log(`Successfully formatted payment details for ID ${id}`);
            
            res.json({
                success: true,
                data: formattedPayment
            });
        } catch (error) {
            console.error('Error fetching payment details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch payment details',
                details: error.message
            });
        }
    },
    
    // Refund a payment
    refundPayment: async (req, res) => {
        try {
            const db = require('../models');
            const { id } = req.params;
            const { reason } = req.body;
            
            const payment = await db.Payment.findByPk(id, {
                include: [
                    {
                        model: db.Booking,
                        as: 'booking'
                    }
                ]
            });
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'Payment not found'
                });
            }
            
            if (payment.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    error: 'Only completed payments can be refunded'
                });
            }
            
            // Process refund - in a real system, this would call a payment processor API
            await payment.update({
                status: 'refunded',
                refundedAt: new Date(),
                metadata: {
                    ...payment.metadata,
                    refundReason: reason || 'Administrative refund',
                    refundedBy: req.admin.id
                }
            });
            
            // Update booking status if needed
            if (payment.booking) {
                await payment.booking.update({
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancellationReason: 'Payment refunded: ' + (reason || 'Administrative refund')
                });
            }
            
            res.json({
                success: true,
                message: 'Payment refunded successfully',
                data: {
                    id: payment.id,
                    status: 'refunded',
                    refundedAt: payment.refundedAt
                }
            });
        } catch (error) {
            console.error('Error refunding payment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to refund payment'
            });
        }
    },
    
    // Get payment summary statistics
    getPaymentSummary: async (req, res) => {
        try {
            const { Op } = require('sequelize');
            const { 
                startDate,
                endDate,
                period = 'all' // all, day, week, month
            } = req.query;
            
            console.log('Generating payment summary with params:', req.query);
            
            // Build date filter for SQL
            let dateFilter = '1=1'; // Default - no filter
            let dateParams = {};
            
            if (startDate || endDate) {
                const conditions = [];
                
                if (startDate) {
                    conditions.push(`"createdAt" >= :startDate`);
                    dateParams.startDate = new Date(startDate);
                }
                
                if (endDate) {
                    // Include the entire end date by going to the next day
                    const endDateObj = new Date(endDate);
                    endDateObj.setDate(endDateObj.getDate() + 1);
                    conditions.push(`"createdAt" < :endDate`);
                    dateParams.endDate = endDateObj;
                }
                
                dateFilter = conditions.join(' AND ');
            } else if (period !== 'all') {
                const now = new Date();
                let periodStartDate;
                
                switch (period) {
                    case 'day':
                        periodStartDate = new Date(now);
                        periodStartDate.setDate(periodStartDate.getDate() - 1);
                        break;
                    case 'week':
                        periodStartDate = new Date(now);
                        periodStartDate.setDate(periodStartDate.getDate() - 7);
                        break;
                    case 'month':
                        periodStartDate = new Date(now);
                        periodStartDate.setMonth(periodStartDate.getMonth() - 1);
                        break;
                    default:
                        periodStartDate = null;
                }
                
                if (periodStartDate) {
                    dateFilter = `"createdAt" >= :periodStartDate`;
                    dateParams.periodStartDate = periodStartDate;
                }
            }
            
            console.log('Payment summary date filter:', dateFilter);
            
            // Execute SQL queries for summary statistics
            
            // Get status counts and amounts
            const statusStats = await sequelize.query(
                `SELECT 
                    status, 
                    COUNT(*) as count, 
                    COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0) as total
                 FROM "Payments" 
                 WHERE ${dateFilter}
                 GROUP BY status`,
                {
                    replacements: dateParams,
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            console.log(`Found ${statusStats.length} different payment statuses`);
            
            // Get payment method breakdown
            const methodStats = await sequelize.query(
                `SELECT 
                    "paymentMethod", 
                    COUNT(*) as count
                 FROM "Payments"
                 WHERE ${dateFilter}
                 GROUP BY "paymentMethod"`,
                {
                    replacements: dateParams,
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            // Initialize totals
            let totalTransactions = 0;
            let totalIncome = 0;
            let totalExpenses = 0;
            let pendingAmount = 0;
            let pendingCount = 0;
            let completedCount = 0;
            let failedCount = 0;
            let refundedCount = 0;
            
            // Process status statistics
            statusStats.forEach(stat => {
                const status = stat.status;
                const count = parseInt(stat.count || 0);
                const amount = parseFloat(stat.total || 0);
                
                totalTransactions += count;
                
                switch (status) {
                    case 'completed':
                        totalIncome += amount;
                        completedCount = count;
                        break;
                    case 'refunded':
                        totalExpenses += amount;
                        refundedCount = count;
                        break;
                    case 'pending':
                    case 'processing':
                        pendingAmount += amount;
                        pendingCount += (status === 'pending' ? count : 0);
                        break;
                    case 'failed':
                        failedCount = count;
                        break;
                }
            });
            
            // Process payment methods
            const paymentMethods = {
                credit_card: 0,
                paypal: 0,
                bank_transfer: 0,
                stripe: 0
            };
            
            methodStats.forEach(stat => {
                const method = stat.paymentMethod;
                const count = parseInt(stat.count || 0);
                
                if (method && paymentMethods.hasOwnProperty(method)) {
                    paymentMethods[method] = count;
                }
            });
            
            // Calculate previous period statistics for comparison
            let previousTotalIncome = 0;
            let incomeChange = 0;
            
            if (startDate && endDate) {
                // Calculate the duration of the current period
                const start = new Date(startDate);
                const end = new Date(endDate);
                const durationMs = end.getTime() - start.getTime();
                
                // Calculate previous period dates
                const prevEnd = new Date(start);
                const prevStart = new Date(prevEnd);
                prevStart.setTime(prevEnd.getTime() - durationMs);
                
                const prevIncomeResult = await sequelize.query(
                    `SELECT COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0) as total
                     FROM "Payments"
                     WHERE status = 'completed'
                     AND "createdAt" >= :prevStart
                     AND "createdAt" < :prevEnd`,
                    {
                        replacements: {
                            prevStart,
                            prevEnd: start // Previous period ends when current starts
                        },
                        type: sequelize.QueryTypes.SELECT,
                        plain: true
                    }
                );
                
                previousTotalIncome = parseFloat(prevIncomeResult.total || 0);
                
                // Calculate change percentage
                if (previousTotalIncome > 0) {
                    incomeChange = ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100;
                }
            }
            
            console.log('Payment summary calculated successfully');
            
            res.json({
                success: true,
                data: {
                    totalTransactions,
                    totalIncome,
                    totalExpenses,
                    pendingAmount,
                    pendingCount,
                    completedCount,
                    failedCount,
                    refundedCount,
                    netAmount: totalIncome - totalExpenses,
                    incomeChange: parseFloat(incomeChange.toFixed(1)),
                    paymentMethods
                }
            });
        } catch (error) {
            console.error('Error generating payment summary:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate payment summary',
                details: error.message
            });
        }
    }
};

module.exports = adminController; 