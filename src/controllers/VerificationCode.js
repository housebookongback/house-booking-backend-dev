require("dotenv").config({ path: "../../.env" });
const { MailerSend, Sender, Recipient } = require("mailersend");
const bcrypt = require("bcrypt");

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

const sendEmail = async (req, res) => {
  try {
    // Extract email and optional name from req.body
    const { email, recipientName = "Recipient" } = req.body;

    // Validate inputs
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

    // Initialize MailerSend
    const mailersend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });

    const sentFrom = new Sender("info@test-r83ql3p2k20gzw1j.mlsender.net", "House Booking");
    const recipients = [new Recipient(email, recipientName)];

    const emailParams = {
      from: sentFrom,
      to: recipients,
      subject: "Your Verification Code",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding: 40px 24px; text-align: center;">
                <!-- Logo with updated URL and proper styling -->
                <img src="https://scontent.ftun10-1.fna.fbcdn.net/v/t39.30808-6/311382177_185859360646849_7153349400666887402_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=UcdTe4vf2bwQ7kNvwGA-KhQ&_nc_oc=AdnVKO1QFcpjmXISVHlXg8-yug-gxB8im09iBnd63s6jzDHO59RU8HMD5kAB1EgmCS8&_nc_zt=23&_nc_ht=scontent.ftun10-1.fna&_nc_gid=rrqzhr1ZvZw1aSTpyM-5sA&oh=00_AfKm6HgXdnHE5uQ-F4evmsQth2fhqfHskKR813Bq1hTUgw&oe=682922C8" alt="House Booking Logo" style="width: 150px; height: auto; margin-bottom: 24px; display: block; margin-left: auto; margin-right: auto;">
                <h1 style="color: #1a202c; font-size: 26px; font-weight: 600; margin: 0 0 16px;">Verify Your Account</h1>
                <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 24px;">Hello ${recipientName},<br>Thank you for joining House Booking! Use the code below to verify your email address.</p>
                <div style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 2px; border-radius: 8px; margin: 24px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${verificationCode}
                </div>
                <p style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 24px 0 16px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                <p style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 16px 0 0;">Best regards,<br>The House Booking Team</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px; text-align: center; background-color: #f8fafc; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 House Booking. All rights reserved.</p>
                <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
                  <a href="https://your-app.com/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> | 
                  <a href="https://your-app.com/support" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hello ${recipientName},\n\nYour verification code is: ${verificationCode}\n\nThank you for joining House Booking! This code expires in 10 minutes. If you didn't request this, please ignore this email.\n\nBest regards,\nThe House Booking Team`,
    };

    const response = await mailersend.email.send(emailParams);
    console.log("MailerSend response:", response);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
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
    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
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
    const isValid = await bcrypt.compare(code, storedData.code);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Code is valid; clean up
    verificationCodes.delete(email);
    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ error: "Failed to verify code", details: error.message });
  }
};

module.exports = { sendEmail, verifyCode };