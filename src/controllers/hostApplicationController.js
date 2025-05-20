const db = require('../models');

const hostApplicationController = {
  submitApplication: async (req, res) => {
    try {
      // Extract fields from request body
      const {
        firstName, lastName, email, phone, address, city, state, zipCode, country,
        identificationDocument, identificationNumber, identificationExpiryDate,
        hostingExperience, languagesSpoken, termsAccepted, profilePicture
      } = req.body;

      // TODO: Save to DB (e.g., db.HostApplication.create({...}))
      // For now, just simulate admin approval request

      // Simulate sending to admin for approval
      // You can add notification logic here if needed

      return res.status(201).json({
        success: true,
        message: 'Votre demande a été envoyée à l\'administrateur pour approbation.',
        // applicationId: application.id, // Uncomment if you save to DB
      });
    } catch (error) {
      console.error('Error submitting host application:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit host application',
      });
    }
  }
};

module.exports = hostApplicationController; 