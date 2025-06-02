const db = require('../models');
const { authenticateJWT } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * User controller for handling user-related operations
 */
const userController = {
  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Find the user
      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updateData = {};
      
      // Handle name fields
      if (req.body.firstName || req.body.lastName) {
        // Either update firstName/lastName directly if the model supports it
        // or combine them into a name field
        const firstName = req.body.firstName || '';
        const lastName = req.body.lastName || '';
        updateData.name = `${firstName} ${lastName}`.trim();
      }
      
      // Handle other simple fields
      if (req.body.phone) updateData.phone = req.body.phone;
      if (req.body.bio) updateData.bio = req.body.bio;
      if (req.body.language) updateData.language = req.body.language;
      
      // Handle address (stored as JSON)
      if (req.body.address) {
        // If address is a string (JSON string from form-data), parse it
        const addressData = typeof req.body.address === 'string' 
          ? JSON.parse(req.body.address) 
          : req.body.address;
        
        updateData.address = addressData;
        
        // If country is sent separately, also update it
        if (req.body.country) {
          updateData.country = req.body.country;
        } else if (addressData.country) {
          updateData.country = addressData.country;
        }
      }
      
      // Handle file upload for avatar
      if (req.file) {
        // Save avatar URL
        updateData.profilePicture = `/uploads/avatars/${req.file.filename}`;
      } else if (req.body.avatar && typeof req.body.avatar === 'string' && req.body.avatar.startsWith('data:image')) {
        // Handle base64 image data
        const base64Data = req.body.avatar.split(',')[1];
        const fileExtension = req.body.avatar.split(';')[0].split('/')[1];
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = path.join(__dirname, '../../uploads/avatars', fileName);
        
        // Ensure directory exists
        if (!fs.existsSync(path.join(__dirname, '../../uploads/avatars'))) {
          fs.mkdirSync(path.join(__dirname, '../../uploads/avatars'), { recursive: true });
        }
        
        // Save the file
        fs.writeFileSync(filePath, base64Data, 'base64');
        updateData.profilePicture = `/uploads/avatars/${fileName}`;
      }
      
      // Update the user
      await user.update(updateData);
      
      // Return updated user data
      const userData = user.toJSON();
      
      // Construct response object with proper naming
      const response = {
        id: userData.id,
        name: userData.name,
        firstName: userData.name.split(' ')[0] || '',
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        phone: userData.phone,
        avatar: userData.profilePicture,
        profilePicture: userData.profilePicture,
        address: userData.address,
        country: userData.country,
        bio: userData.bio,
        language: userData.language,
        isVerified: userData.isVerified
      };
      
      return res.json(response);
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Error updating profile' });
    }
  },
  
  /**
   * Delete user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Find the user
      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Soft delete the user (recommended)
      await user.update({ status: 'deleted' });
      // Or hard delete if you prefer
      // await user.destroy();
      
      return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      return res.status(500).json({ message: 'Error deleting account' });
    }
  },
  
  /**
   * Get host application status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getHostApplicationStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Find the host application
      const application = await db.HostApplication.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      
      if (!application) {
        return res.json({
          status: 'none',
          message: 'No host application found'
        });
      }
      
      return res.json({
        status: application.status,
        applicationId: application.id,
        message: application.statusMessage,
        submittedAt: application.createdAt,
        reviewedAt: application.reviewedAt
      });
    } catch (error) {
      console.error('Error getting host application status:', error);
      return res.status(500).json({ message: 'Error getting host application status' });
    }
  },
  
  /**
   * Submit a host application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  applyForHosting: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user already has a pending application
      const existingApplication = await db.HostApplication.findOne({
        where: { userId, status: 'pending' }
      });
      
      if (existingApplication) {
        return res.status(400).json({
          message: 'You already have a pending host application'
        });
      }
      
      // Create application data
      const applicationData = {
        userId,
        status: 'pending',
        hostingExperience: req.body.hostingExperience
      };
      
      // Handle address
      if (req.body.address) {
        applicationData.address = typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;
      }
      
      // Handle identity document
      if (req.file) {
        applicationData.identityDocumentUrl = `/uploads/documents/${req.file.filename}`;
      } else if (req.body.identityDocumentUrl) {
        applicationData.identityDocumentUrl = req.body.identityDocumentUrl;
      }
      
      // Handle property types
      if (req.body['propertyTypes[]']) {
        applicationData.propertyTypes = Array.isArray(req.body['propertyTypes[]'])
          ? req.body['propertyTypes[]']
          : [req.body['propertyTypes[]']];
      }
      
      // Create the application
      const application = await db.HostApplication.create(applicationData);
      
      return res.status(201).json({
        message: 'Host application submitted successfully',
        applicationId: application.id
      });
    } catch (error) {
      console.error('Error submitting host application:', error);
      return res.status(500).json({ message: 'Error submitting host application' });
    }
  }
};

module.exports = userController; 