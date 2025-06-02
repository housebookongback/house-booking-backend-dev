const db = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for host application documents
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/host-verification');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and user ID if available
    const userId = req.user ? req.user.id : 'anonymous';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    cb(null, `host-${userId}-${timestamp}${fileExtension}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const uploadHostDocs = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'personalPhoto', maxCount: 1 }
]);

// Convert file path to URL
const filePathToUrl = (filePath) => {
  // Replace backslashes with forward slashes for URLs
  const normalizedPath = filePath.replace(/\\/g, '/');
  // Extract just the filename from the path
  const filename = normalizedPath.split('/').pop();
  // Get the directory structure after 'uploads/'
  const uploadIndex = normalizedPath.indexOf('uploads/');
  const relativePath = uploadIndex !== -1 ? normalizedPath.substring(uploadIndex + 8) : `host-verification/${filename}`;
  return `/api/uploads/${relativePath}`;
};

const hostApplicationController = {
  // Middleware to handle file uploads
  uploadFiles: (req, res, next) => {
    uploadHostDocs(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({
          success: false,
          error: `Server error: ${err.message}`
        });
      }
      // Everything went fine
      next();
    });
  },

  submitApplication: async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get user from database
      const user = await db.User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Parse application data from JSON string
      let applicationData;
      try {
        applicationData = JSON.parse(req.body.applicationData);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid application data format'
        });
      }

      // Check for required files
      if (!req.files || !req.files.idDocument || !req.files.personalPhoto) {
        return res.status(400).json({
          success: false,
          error: 'ID document and personal photo are required'
        });
      }

      // Extract file paths
      const idDocumentPath = req.files.idDocument[0].path;
      const personalPhotoPath = req.files.personalPhoto[0].path;
      
      // Convert file paths to URLs for validation
      const idDocumentUrl = filePathToUrl(idDocumentPath);
      const personalPhotoUrl = filePathToUrl(personalPhotoPath);

      // Create or update host profile
      let hostProfile = await db.HostProfile.findOne({
        where: { userId: user.id }
      });

      // Construct a full URL for the profile picture to pass isUrl validation
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fullProfilePictureUrl = `${baseUrl}${personalPhotoUrl}`;

      if (!hostProfile) {
        // Create new host profile
        hostProfile = await db.HostProfile.create({
          userId: user.id,
          displayName: `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`,
          bio: '',
          phoneNumber: applicationData.personalInfo.phone,
          profilePicture: fullProfilePictureUrl,
          preferredLanguage: 'en',
          verificationStatus: 'pending',
          verificationDocuments: {
            idDocument: idDocumentPath,
            idDocumentUrl: idDocumentUrl,
            personalPhoto: personalPhotoPath,
            personalPhotoUrl: personalPhotoUrl,
            idVerificationNumber: applicationData.personalInfo.idVerification
          }
        });
      } else {
        // Update existing host profile
        await hostProfile.update({
          displayName: `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`,
          phoneNumber: applicationData.personalInfo.phone,
          profilePicture: fullProfilePictureUrl,
          verificationStatus: 'pending',
          verificationDocuments: {
            idDocument: idDocumentPath,
            idDocumentUrl: idDocumentUrl,
            personalPhoto: personalPhotoPath,
            personalPhotoUrl: personalPhotoUrl,
            idVerificationNumber: applicationData.personalInfo.idVerification
          }
        });
      }

      // Create host verification record
      const hostVerification = await db.HostVerification.create({
        hostId: user.id,
        type: 'identity',
        status: 'pending',
        documents: {
          idDocument: idDocumentPath,
          idDocumentUrl: idDocumentUrl,
          personalPhoto: personalPhotoPath,
          personalPhotoUrl: personalPhotoUrl,
          idVerificationNumber: applicationData.personalInfo.idVerification,
          hostingExperience: applicationData.hostingDetails.hostingExperience,
          propertyTypes: applicationData.hostingDetails.propertyTypes,
          locationCity: applicationData.hostingDetails.locationCity,
          locationCountry: applicationData.hostingDetails.locationCountry,
          taxId: applicationData.legalInfo.taxId,
          businessRegistered: applicationData.legalInfo.businessRegistered
        },
        metadata: {
          applicationData: applicationData,
          submittedAt: new Date().toISOString()
        }
      });

      // Add host role to user
      const hostRole = await db.Role.findOne({ where: { name: 'host' } });
      if (hostRole) {
        await db.UserRoles.findOrCreate({
          where: {
            userId: user.id,
            roleId: hostRole.id
          }
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Your host application has been submitted successfully and is pending approval.',
        applicationId: hostVerification.id,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error submitting host application:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit host application',
        details: error.message
      });
    }
  },

  // Get application status
  getApplicationStatus: async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get host profile
      const hostProfile = await db.HostProfile.findOne({
        where: { userId: req.user.id }
      });

      if (!hostProfile) {
        return res.status(404).json({
          success: false,
          status: 'none',
          message: 'No host application found'
        });
      }

      // Get latest verification
      const verification = await db.HostVerification.findOne({
        where: { hostId: req.user.id },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        status: hostProfile.verificationStatus,
        applicationId: verification ? verification.id : null,
        submittedAt: verification ? verification.createdAt : null,
        verifiedAt: verification ? verification.verifiedAt : null,
        rejectedAt: verification ? verification.rejectedAt : null,
        rejectionReason: verification ? verification.rejectionReason : null
      });
    } catch (error) {
      console.error('Error getting application status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get application status',
        details: error.message
      });
    }
  }
};

module.exports = hostApplicationController; 