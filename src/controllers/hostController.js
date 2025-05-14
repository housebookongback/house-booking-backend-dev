const { User, HostVerification, HostProfile, Role, sequelize } = require('../models');
const { validateVerificationInput } = require('../utils/validators');

const hostController = {
    // Register as a host
    register: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'roles'
                }]
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check for existing host profile
            const existingProfile = await HostProfile.findOne({
                where: { userId },
                paranoid: false // Include soft-deleted profiles
            });

            if (existingProfile) {
                return res.status(400).json({ 
                    message: 'Host profile already exists',
                    profileId: existingProfile.id
                });
            }

            // Check if user already has host role
            const hasHostRole = user.roles.some(role => role.name === 'host');
            if (hasHostRole) {
                return res.status(400).json({ message: 'User is already registered as a host' });
            }

            // Get host role
            const hostRole = await Role.findOne({ where: { name: 'host' } });
            if (!hostRole) {
                return res.status(500).json({ message: 'Host role not found in system' });
            }

            // Add host role to user
            await user.addRole(hostRole, { transaction: t });

            // Create host profile
            const hostProfile = await HostProfile.create({
                userId: userId,
                displayName: req.body.displayName || `${user.name}'s Hosting`,
                bio: req.body.bio || '',
                phoneNumber: req.body.phoneNumber || user.phone,
                preferredLanguage: req.body.preferredLanguage || 'en',
                verificationStatus: 'unverified',
                notificationPreferences: {
                    email: true,
                    sms: false,
                    push: true,
                    bookingRequests: true,
                    messages: true,
                    reviews: true,
                    updates: true
                }
            }, { transaction: t });

            // Create initial verification record
            await HostVerification.create({
                hostId: userId,
                type: 'identity',
                status: 'pending',
                documents: req.body.documents || {},
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }, { transaction: t });

            await t.commit();

            // Get user with roles for response
            const userWithRoles = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['name']
                }]
            });

            res.status(200).json({
                message: 'Successfully registered as host',
                user: {
                    id: user.id,
                    email: user.email,
                    roles: userWithRoles.roles.map(role => role.name)
                },
                hostProfile: hostProfile.getProfileDetails()
            });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ message: 'Error registering as host', error: error.message });
        }
    },

    // Get host profile
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Get host profile
            const hostProfile = await HostProfile.findOne({
                where: { userId: userId }
            });

            if (!hostProfile) {
                return res.status(404).json({ message: 'Host profile not found' });
            }

            // Get verification status
            const verification = await HostVerification.findOne({
                where: { hostId: userId },
                order: [['createdAt', 'DESC']]
            });

            res.json({
                profile: user,
                hostProfile: hostProfile.getProfileDetails(),
                verification: verification ? verification.getVerificationDetails() : null
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching host profile', error: error.message });
        }
    },

    // Update host profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['name']
                }]
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Get host profile
            const hostProfile = await HostProfile.findOne({
                where: { userId: userId }
            });

            if (!hostProfile) {
                return res.status(404).json({ message: 'Host profile not found' });
            }

            // Update host profile
            await hostProfile.update(req.body);

            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles.map(role => role.name)
                },
                hostProfile: hostProfile.getProfileDetails()
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating profile', error: error.message });
        }
    },

    // Submit verification documents
    submitVerification: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Validate input using the new validator
            try {
                validateVerificationInput(req.body);
            } catch (error) {
                if (error.name === 'ValidationError') {
                    return res.status(400).json({
                        message: error.message,
                        errors: error.errors
                    });
                }
                throw error;
            }

            // Expire previous pending verifications of the same type
            await HostVerification.update(
                { status: 'expired' },
                {
                    where: {
                        hostId: userId,
                        type: req.body.type,
                        status: 'pending'
                    }
                }
            );

            // Create new verification record
            const verification = await HostVerification.create({
                hostId: userId,
                type: req.body.type,
                status: 'pending',
                documents: {
                    ...req.body.documents,
                    uploadedAt: new Date()
                },
                metadata: {
                    ...req.body.metadata,
                    submittedFrom: req.headers['user-agent'] || 'unknown',
                    ipAddress: req.ip
                },
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            });

            // Update host profile verification status
            const hostProfile = await HostProfile.findOne({
                where: { userId: userId }
            });

            if (hostProfile) {
                await hostProfile.update({
                    verificationStatus: 'pending'
                });
            }

            res.status(201).json({
                message: 'Verification submitted successfully',
                verification: verification.getVerificationDetails()
            });
        } catch (error) {
            res.status(500).json({ message: 'Error submitting verification', error: error.message });
        }
    },

    // Get verification status
    getVerificationStatus: async (req, res) => {
        try {
            const userId = req.user.id;
            const verifications = await HostVerification.findAll({
                where: { hostId: userId },
                order: [['createdAt', 'DESC']]
            });

            // Get host profile verification status
            const hostProfile = await HostProfile.findOne({
                where: { userId: userId }
            });

            res.json({
                verifications: verifications.map(v => v.getVerificationDetails()),
                profileVerificationStatus: hostProfile ? hostProfile.verificationStatus : null
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching verification status', error: error.message });
        }
    },

    // Update notification preferences
    updateNotificationPreferences: async (req, res) => {
        try {
            const userId = req.user.id;
            const hostProfile = await HostProfile.findOne({
                where: { userId: userId }
            });

            if (!hostProfile) {
                return res.status(404).json({ message: 'Host profile not found' });
            }

            // Validate notification preferences
            const validPreferences = [
                'email',
                'sms',
                'push',
                'bookingRequests',
                'messages',
                'reviews',
                'updates'
            ];

            const invalidPreferences = Object.keys(req.body).filter(
                pref => !validPreferences.includes(pref)
            );

            if (invalidPreferences.length > 0) {
                return res.status(400).json({
                    message: 'Invalid notification preferences',
                    invalidPreferences: invalidPreferences,
                    validPreferences: validPreferences
                });
            }

            // Update preferences
            await hostProfile.updateNotificationPreferences(req.body);

            res.json({
                message: 'Notification preferences updated successfully',
                preferences: hostProfile.notificationPreferences
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error updating notification preferences', 
                error: error.message 
            });
        }
    }
};

module.exports = hostController; 