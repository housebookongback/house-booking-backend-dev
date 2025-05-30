require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function checkHostProfiles() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Check how many host profiles exist
    const profiles = await db.HostProfile.findAll({
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });
    
    console.log(`Found ${profiles.length} host profiles:`);
    profiles.forEach(profile => {
      console.log(`- ID: ${profile.id}, User: ${profile.user?.name || 'Unknown'} (${profile.user?.email || 'Unknown'}), Status: ${profile.verificationStatus}`);
    });

    // Check verifications
    const verifications = await db.HostVerification.findAll();
    console.log(`\nFound ${verifications.length} verifications:`);
    verifications.forEach(v => {
      console.log(`- ID: ${v.id}, HostID: ${v.hostId}, Type: ${v.type}, Status: ${v.status}`);
    });

  } catch (error) {
    console.error('Error checking host profiles:', error);
  } finally {
    process.exit();
  }
}

// Run the function
checkHostProfiles(); 