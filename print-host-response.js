require('dotenv').config();
const { HostProfile, User, sequelize } = require('./src/models');

async function printHostResponse() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    // Replicate the exact query used in the adminController.listHosts function
    const hostProfiles = await HostProfile.findAndCountAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt']
      }],
      order: [[sequelize.col('user.createdAt'), 'DESC']],
      limit: 10,
      offset: 0
    });
    
    // Transform the data just like in the controller
    const hosts = hostProfiles.rows.map(profile => {
      const user = profile.user || {};
      return {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || 'Unknown',
        phone: user.phone || 'N/A',
        status: user.status || 'unknown',
        createdAt: user.createdAt,
        verificationStatus: profile.verificationStatus,
        displayName: profile.displayName || user.name || 'Unknown',
        profileId: profile.id
      };
    });

    const response = {
      hosts,
      total: hostProfiles.count,
      page: 1,
      totalPages: Math.ceil(hostProfiles.count / 10)
    };

    console.log("Backend response structure:");
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('Error printing host response:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

// Run the function
printHostResponse(); 