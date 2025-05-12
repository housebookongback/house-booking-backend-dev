const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Files will be stored in 'uploads' folder
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        cb(null, Date.now() + '-' + file.originalname)
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

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadMultiple = upload.array('photos',10);

module.exports = {
    upload,
    uploadMultiple
}; 