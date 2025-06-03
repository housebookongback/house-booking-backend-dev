const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoriesExist = () => {
    const directories = [
        'uploads',
        'uploads/avatars',
        'uploads/properties',
        'uploads/documents',
        'uploads/temp'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Call this when the app starts
ensureDirectoriesExist();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Route uploads to different folders based on field name
        if (file.fieldname === 'avatar') {
            cb(null, 'uploads/avatars/');
        } else if (file.fieldname === 'identityDocument') {
            cb(null, 'uploads/documents/');
        } else if (file.fieldname === 'photos') {
            cb(null, 'uploads/properties/');
        } else {
            cb(null, 'uploads/temp/'); // Default location
        }
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp and original extension
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        cb(null, fileName);
    }
});

// File filter to accept only images and documents
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'identityDocument') {
        // For identity documents, allow images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Please upload valid document format (image or PDF)'), false);
        }
    } else {
        // For other uploads, only allow images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload only images.'), false);
        }
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware for handling multiple files
const uploadMultiple = (req, res, next) => {
    // Configuration for single or multiple files
    const uploadConfig = upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'photos', maxCount: 10 },
        { name: 'identityDocument', maxCount: 1 }
    ]);
    
    uploadConfig(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            return res.status(400).json({ 
                message: 'File upload error', 
                error: err.message 
            });
        } else if (err) {
            // An unknown error occurred
            return res.status(500).json({ 
                message: 'Error uploading file', 
                error: err.message 
            });
        }
        
        // If there's a single file, make it accessible in req.file for simplicity
        if (req.files) {
            const fieldNames = Object.keys(req.files);
            if (fieldNames.length === 1 && req.files[fieldNames[0]].length === 1) {
                req.file = req.files[fieldNames[0]][0];
            }
        }
        
        // Everything went fine
        next();
    });
};

module.exports = {
    upload,
    uploadMultiple
}; 