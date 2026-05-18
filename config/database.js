require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mysite',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0
});

module.exports = {
  getConnection: async () => {
    // Return a lightweight wrapper so existing code can call `conn.query(sql, params)` and `conn.release()`
    return {
      query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          pool.query(sql, params, (err, results, fields) => {
            if (err) return reject(err);
            resolve([results, fields]);
          });
        });
      },
      release: () => {
        // No-op when using pool.query; kept for API compatibility
      }
    };
  },
  // Export raw pool for advanced use if needed
  pool
};
