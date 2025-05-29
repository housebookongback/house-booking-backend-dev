require('dotenv').config();
const axios = require('axios');
const { sequelize } = require('./src/models');

async function testHostApi() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    // Set up axios with auth token (you'll need to replace this with a valid token)
    // You can get a token by logging in to the admin panel
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNjkwNTQ2MzQ4LCJleHAiOjE2OTA1ODIzNDh9.h1JJ9ckl1DvxrX_zBCcNnbOm_XEYqKbTekvGPgCBaQg';
    
    const api = axios.create({
      baseURL: 'http://localhost:5174/api',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Test the host listing endpoint
    console.log('Testing GET /admin/hosts endpoint...');
    try {
      const hostsResponse = await api.get('/admin/hosts');
      console.log('Host listing response:', JSON.stringify(hostsResponse.data, null, 2));
    } catch (error) {
      console.error('Error fetching hosts:', error.response?.data || error.message);
    }

    // Test getting a specific host
    console.log('\nTesting GET /admin/hosts/1 endpoint...');
    try {
      const hostResponse = await api.get('/admin/hosts/1');
      console.log('Host details response:', JSON.stringify(hostResponse.data, null, 2));
    } catch (error) {
      console.error('Error fetching host details:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Error testing host API:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

// Run the function
testHostApi(); 