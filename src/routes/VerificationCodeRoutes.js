const express = require('express');
const router = express.Router();
const {sendEmail,verifyCode ,updatePassword,checkEmailExists } = require('../controllers/VerificationCode');

router.post('/send', sendEmail);
router.post('/verifyCode', verifyCode)
router.post('/checkEmailExists', checkEmailExists)
router.post('/updatePassword', updatePassword)
module.exports = router