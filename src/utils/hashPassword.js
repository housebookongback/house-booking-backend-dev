// hashPassword.js
const bcrypt = require('bcryptjs');
const password = 'Password123!'; // Change this
const hash = bcrypt.hashSync(password, 10);
console.log('Hashed password:', hash);
