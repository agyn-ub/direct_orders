const express = require('express');
const { Pool } = require('pg');  // PostgreSQL client
const router = express.Router();

// PostgreSQL setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
// Create the items table if it doesn't exist (Only run this in production or setup phase)
(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        quantity INTEGER NOT NULL
      );
    `);
    console.log("Table 'items' is ready.");
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
  }
})();

// POST /api/items endpoint to save items to the database
router.post('/items', async (req, res) => {
  const { name, price, quantity } = req.body;

  if (!name || typeof price !== 'number' || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    // Insert item into the database
    const result = await pool.query(
      'INSERT INTO items (name, price, quantity) VALUES ($1, $2, $3) RETURNING *',
      [name, price, quantity]
    );

    // Return the added item
    res.status(201).json({ message: 'Item added', item: result.rows[0] });
  } catch (err) {
    console.error('Error inserting item:', err);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

// GET /api/items endpoint to retrieve all items
router.get('/items', async (req, res) => {
  try {
    // Retrieve all items from the database
    const result = await pool.query('SELECT * FROM items');

    // Return the list of items
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error retrieving items:', err);
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

module.exports = router;
