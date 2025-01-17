async function initializeDb(pool) {
  try {
    const client = await pool.connect();
    // postgresql
    // Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        balance INTEGER NOT NULL,
        ed VARCHAR(10),
        vidprice VARCHAR(100) NOT NULL
      )
    `);

    // Create clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        nomenklatura VARCHAR(255) NOT NULL,
        skidka TEXT NOT NULL,
        soglashenie TEXT NOT NULL,
        skidka_znachenie DECIMAL(5, 2) NOT NULL,
        code VARCHAR(20) NOT NULL
      )
    `);

    client.release();
    console.log('Database initialized with items and clients tables');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

module.exports = { initializeDb };
