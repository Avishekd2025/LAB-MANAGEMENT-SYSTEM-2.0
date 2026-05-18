const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function runSchema() {
  const dbPath = path.join(__dirname, 'db', 'database.sqlite');
  
  // Delete old db to reset
  if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Deleted old database file.');
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema-sqlite.sql'), 'utf8');
    
    // SQLite doesn't support executing multiple statements at once if there's complex formatting in all contexts,
    // but db.exec handles multiple statements nicely.
    await db.exec(schemaSql);
    
    console.log('✅ SQLite Schema executed successfully!');
  } catch (error) {
    console.error('❌ Error executing schema:', error);
  } finally {
    await db.close();
  }
}

runSchema();
