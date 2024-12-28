async function initializeDb(pool) {
    try {
      const client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          balance INTEGER NOT NULL
        )
      `);
      client.release();
      console.log('Database initialized');
    } catch (err) {
      console.error('Database initialization failed:', err);
      process.exit(1);
    }
  }
  
  module.exports = { initializeDb };
  