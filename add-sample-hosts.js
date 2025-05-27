require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function addSampleHostData() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Get users who don't have host profiles yet
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'email'],
      limit: 5,
      order: [['id', 'ASC']]
    });

    if (!users.length) {
      console.log('No users found.');
      return;
    }

    // For each user, check if they already have a host profile
    for (const user of users) {
      // Check if host profile already exists
      const existingProfile = await db.HostProfile.findOne({ where: { userId: user.id } });
      
      if (existingProfile) {
        console.log(`Host profile already exists for ${user.email} with ID ${existingProfile.id}`);
        continue;
      }
      
      console.log(`Creating host profile for ${user.email}...`);
      
      // Create host profile with random verification status
      const statuses = ['unverified', 'pending', 'verified', 'rejected'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const hostProfile = await db.HostProfile.create({
        userId: user.id,
        displayName: `${user.name}'s Hosting`,
        bio: `Welcome to ${user.name}'s properties. We offer comfortable stays for all travelers.`,
        verificationStatus: randomStatus,
        preferredLanguage: 'en',
        responseRate: Math.floor(Math.random() * 50) + 50, // 50-100%
        responseTime: Math.floor(Math.random() * 24) + 1, // 1-24 hours
        isSuperhost: Math.random() > 0.7, // 30% chance of being superhost
      });
      
      console.log(`Created host profile with ID ${hostProfile.id} and status ${randomStatus}`);
      
      // Create verification record
      const verification = await db.HostVerification.create({
        hostId: user.id,
        type: 'identity',
        status: randomStatus === 'verified' ? 'verified' : 
               randomStatus === 'rejected' ? 'rejected' : 'pending',
        documents: {
          idCard: 'uploads/sample/id_card.jpg',
          selfie: 'uploads/sample/selfie.jpg'
        },
        verifiedAt: randomStatus === 'verified' ? new Date() : null,
        rejectedAt: randomStatus === 'rejected' ? new Date() : null,
        rejectionReason: randomStatus === 'rejected' ? 'Documents were unclear or invalid' : null,
        expiresAt: randomStatus === 'verified' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
      });
      
      console.log(`Created verification record with ID ${verification.id} and status ${verification.status}`);
    }

    console.log('Sample host data created successfully!');
  } catch (error) {
    console.error('Error creating sample host data:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addSampleHostData(); 