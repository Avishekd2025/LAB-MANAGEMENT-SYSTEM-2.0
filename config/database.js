const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: path.join(__dirname, '../db/database.sqlite'),
      driver: sqlite3.Database
    });
    // Enable foreign keys
    await dbInstance.run('PRAGMA foreign_keys = ON');
  }
  return dbInstance;
}

module.exports = {
  getConnection: async () => {
    const db = await getDb();
    return {
      query: async (sql, params = []) => {
        // Simple regex to determine query type
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        
        try {
          if (isSelect) {
            const rows = await db.all(sql, params);
            return [rows, []];
          } else {
            const result = await db.run(sql, params);
            // Mock MySQL return object structure
            result.insertId = result.lastID;
            result.affectedRows = result.changes;
            return [result, []];
          }
        } catch (error) {
          console.error("DB Error on query:", sql);
          throw error;
        }
      },
      release: () => {
        // No-op for SQLite
      }
    };
  }
};
