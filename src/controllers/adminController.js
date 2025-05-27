const { User, HostVerification, HostProfile, Role, sequelize, Booking, Payment } = require('../models');
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
    }
};

module.exports = adminController; 