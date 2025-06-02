require("dotenv").config({ path: "../../.env" });
const { MailerSend, Sender, Recipient } = require("mailersend");
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const { User } = require('../models');

// Simulated storage (replace with MongoDB/Redis in production)
const verificationCodes = new Map();

// Basic email validation regex
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate a 6-digit verification code (always 100000 to 999999)
const generateVerificationCode = () => {
  const min = 100000; // Smallest 6-digit number
  const max = 999999; // Largest 6-digit number
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString(); // Always 6 digits
};

// const sendEmail = async (req, res) => {
//   try {
//     // Extract email and optional name from req.body
//     const { email, recipientName = "Recipient" } = req.body;

//     // Validate inputs
//     if (!email || !isValidEmail(email)) {
//       return res.status(400).json({ error: "Invalid or missing email address" });
//     }

//     // Generate verification code
//     const verificationCode = generateVerificationCode();

//     // Store the code with expiration (10 minutes)
//     const hashedCode = await bcrypt.hash(verificationCode, 10); // Hash for security
//     verificationCodes.set(email, {
//       code: hashedCode,
//       expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
//     });

//     // Initialize MailerSend
//     const mailersend = new MailerSend({
//       apiKey: process.env.MAILERSEND_API_KEY,
//     });

//     const sentFrom = new Sender("info@test-r83ql3p2k20gzw1j.mlsender.net", "House Booking");
//     const recipients = [new Recipient(email, recipientName)];

//     const emailParams = {
//       from: sentFrom,
//       to: recipients,
//       subject: "Your Verification Code",
//       html: `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Verification Code</title>
//         </head>
//         <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc;">
//           <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
//             <tr>
//               <td style="padding: 40px 24px; text-align: center;">
//                 <!-- Logo with updated URL and proper styling -->
//                 <img src="https://scontent.ftun10-1.fna.fbcdn.net/v/t39.30808-6/311382177_185859360646849_7153349400666887402_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=UcdTe4vf2bwQ7kNvwGA-KhQ&_nc_oc=AdnVKO1QFcpjmXISVHlXg8-yug-gxB8im09iBnd63s6jzDHO59RU8HMD5kAB1EgmCS8&_nc_zt=23&_nc_ht=scontent.ftun10-1.fna&_nc_gid=rrqzhr1ZvZw1aSTpyM-5sA&oh=00_AfKm6HgXdnHE5uQ-F4evmsQth2fhqfHskKR813Bq1hTUgw&oe=682922C8" alt="House Booking Logo" style="width: 150px; height: auto; margin-bottom: 24px; display: block; margin-left: auto; margin-right: auto;">
//                 <h1 style="color: #1a202c; font-size: 26px; font-weight: 600; margin: 0 0 16px;">Verify Your Account</h1>
//                 <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 24px;">Hello ${recipientName},<br>Thank you for joining House Booking! Use the code below to verify your email address.</p>
//                 <div style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 2px; border-radius: 8px; margin: 24px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
//                   ${verificationCode}
//                 </div>
//                 <p style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 24px 0 16px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
//                 <p style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 16px 0 0;">Best regards,<br>The House Booking Team</p>
//               </td>
//             </tr>
//             <tr>
//               <td style="padding: 24px; text-align: center; background-color: #f8fafc; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
//                 <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 House Booking. All rights reserved.</p>
//                 <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
//                   <a href="https://your-app.com/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> | 
//                   <a href="https://your-app.com/support" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
//                 </p>
//               </td>
//             </tr>
//           </table>
//         </body>
//         </html>
//       `,
//       text: `Hello ${recipientName},\n\nYour verification code is: ${verificationCode}\n\nThank you for joining House Booking! This code expires in 10 minutes. If you didn't request this, please ignore this email.\n\nBest regards,\nThe House Booking Team`,
//     };

//     const response = await mailersend.email.send(emailParams);
//     console.log("MailerSend response:", response);

//     res.status(200).json({ message: "Email sent successfully" });
//   } catch (error) {
//     console.error("Error sending email:", error);
//     res.status(500).json({ error: "Failed to send email", details: error.message });
//   }
// };
const sendEmail = async (req, res) => {
  try {
    const { email, recipientName = "Recipient" } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid or missing email address" });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Store the code with expiration (10 minutes)
    const hashedCode = await bcrypt.hash(verificationCode, 10); // Hash for security
    verificationCodes.set(email, {
      code: hashedCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Set up NodeMailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Replace with your SMTP provider
      port: 587, // or 465 for SSL
      secure: false, // true for 465, false for other ports
      auth: {
        user:process.env.USER_EMAIL, // Replace with your email
        pass:process.env.PASS    // Replace with your password
      },
    });

    // Email content
    const mailOptions = {
      from: 'House Booking <no-reply@housebooking.com>', // Branded sender
      to: email, // Recipient
      subject: "Your House Booking Password Reset Code",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Code</title>
          <style>
            body { background: #f7f7f9; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
            .container { max-width: 420px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px 24px; }
            .logo { font-size: 28px; color: #007bff; font-weight: bold; margin-bottom: 12px; letter-spacing: 1px; }
            .code { font-size: 32px; font-weight: bold; color: #007bff; background: #f0f4ff; padding: 16px 0; border-radius: 8px; letter-spacing: 6px; margin: 24px 0; }
            .footer { color: #888; font-size: 13px; margin-top: 32px; }
            .btn { display: inline-block; background: #007bff; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 500; margin-top: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏠 House Booking</div>
            <h2 style="color:#222;">Reset Your Password</h2>
            <p style="color:#444;">Hi ${recipientName},</p>
            <p style="color:#444;">We received a request to reset your password. Use the code below to set a new password for your House Booking account:</p>
            <div class="code">${verificationCode}</div>
            <p style="color:#444;">This code will expire in <b>10 minutes</b>. If you did not request a password reset, you can safely ignore this email.</p>
            <div class="footer">Need help? Contact our support team.<br/>Thank you for using House Booking!</div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${recipientName},\n\nWe received a request to reset your House Booking password.\n\nYour password reset code is: ${verificationCode}\n\nThis code expires in 10 minutes. If you did not request a password reset, you can ignore this email.\n\nThank you for using House Booking!`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error.message);
        return res.status(500).json({ error: "Failed to send email", details: error.message });
      }
      console.log("Email sent successfully:", info.messageId);
      res.status(200).json({ message: "Email sent successfully" });
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ error: "Failed to send email", details: error.message });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid or missing email address" });
    }

    // Accept code as string or number, and always convert to string for validation
    const codeStr = String(code);

    if (!/^\d{6}$/.test(codeStr)) {
      return res.status(400).json({ error: "Invalid verification code. Must be a 6-digit number" });
    }

    // Retrieve stored code
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ error: "No verification code found for this email" });
    }

    if (storedData.expiresAt < Date.now()) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: "Code has expired" });
    }

    // Compare hashed code
    const isValid = await bcrypt.compare(codeStr, storedData.code);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Code is valid; clean up
    verificationCodes.delete(email);
    res.status(200).json({ data: { message: "Verification successful" } });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ error: "Failed to verify code", details: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate email and new password
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid or missing email address" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "No user found with this email" });
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password", details: error.message });
  }
};

const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    // Basic validation
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: "Email is required" });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(200).json({ exists: true, message: "Email already exists" });
    } else {
      return res.status(200).json({ exists: false, message: "Email is available" });
    }
  } catch (error) {
    console.error("Error checking email existence:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


module.exports = { sendEmail, verifyCode, updatePassword,checkEmailExists };