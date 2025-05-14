const { User, HostVerification, HostProfile, Role, sequelize } = require('../models');

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
                    as: 'host'
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
                return res.status(400).json({ message: 'Rejection reason is required' });
            }

            const verification = await HostVerification.findByPk(req.params.id, {
                include: [{
                    model: User,
                    as: 'host'
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
            const { verificationStatus, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (verificationStatus) where.verificationStatus = verificationStatus;

            const hosts = await HostProfile.findAndCountAll({
                where,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'name']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                hosts: hosts.rows.map(h => h.getProfileDetails()),
                total: hosts.count,
                page: parseInt(page),
                totalPages: Math.ceil(hosts.count / limit)
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching hosts', error: error.message });
        }
    },

    // Update host verification status
    updateHostVerificationStatus: async (req, res) => {
        try {
            const { status } = req.body;
            if (!status || !['unverified', 'pending', 'verified', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Invalid verification status' });
            }

            const hostProfile = await HostProfile.findOne({
                where: { userId: req.params.id },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'name', 'phone', 'isVerified', 'status']
                }]
            });

            if (!hostProfile) {
                return res.status(404).json({ message: 'Host profile not found' });
            }

            await hostProfile.update({ verificationStatus: status });

            res.json({
                message: 'Host verification status updated successfully',
                hostProfile: hostProfile.getProfileDetails()
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating host verification status', error: error.message });
        }
    }
};

module.exports = adminController; 