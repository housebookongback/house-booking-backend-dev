const { ValidationError } = require('../utils/errors');

const validVerificationTypes = [
    'identity',
    'address',
    'phone',
    'email',
    'payment',
    'government_id',
    'business_registration',
    'tax_document',
    'other'
];

const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const validateVerificationInput = (input) => {
    const errors = [];

    // Validate verification type
    if (!input.type || !validVerificationTypes.includes(input.type)) {
        errors.push({
            field: 'type',
            message: 'Invalid verification type',
            validTypes: validVerificationTypes
        });
    }

    // Validate documents
    if (!input.documents || typeof input.documents !== 'object') {
        errors.push({
            field: 'documents',
            message: 'Documents are required and must be an object'
        });
    } else {
        // Validate required document fields
        const requiredFields = ['fileUrl', 'fileName', 'fileType'];
        const missingFields = requiredFields.filter(field => !input.documents[field]);
        
        if (missingFields.length > 0) {
            errors.push({
                field: 'documents',
                message: 'Missing required document fields',
                missingFields
            });
        }

        // Validate file type if present
        if (input.documents.fileType && !allowedFileTypes.includes(input.documents.fileType)) {
            errors.push({
                field: 'documents.fileType',
                message: 'Invalid file type',
                allowedTypes: allowedFileTypes
            });
        }
    }

    if (errors.length > 0) {
        throw new ValidationError('Verification validation failed', errors);
    }

    return true;
};

module.exports = {
    validateVerificationInput,
    validVerificationTypes,
    allowedFileTypes
}; 