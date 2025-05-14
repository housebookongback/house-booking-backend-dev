const express = require('express');
const router = express.Router();
const {sendEmail,verifyCode} = require('../controllers/VerificationCode');

router.post('/send', sendEmail);
router.post('/verifyCode', verifyCode)

module.exports = router;