require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'lab_booking_system',
  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d'
};
