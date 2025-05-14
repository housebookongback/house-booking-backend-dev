// utils/twilioClient.js
require("dotenv").config({path:"../../.env"});
const twilio = require("twilio");
console.log("dekfjrbfkjrbgk",process.env.TWILIO_AUTH_TOKEN)
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


module.exports = client;
