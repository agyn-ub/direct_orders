const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Create items
  router.post('/', async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid data: items array is required.' });
    }

    try {
      const client = await pool.connect();

      // Truncate the 'items' table before inserting new items
      await client.query('TRUNCATE TABLE items RESTART IDENTITY CASCADE');

      // Create a list of values for the batch insert
      const values = [];
      items.forEach((item, index) => {
        values.push(
          `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
        );
      });

      // Create a query to insert all items at once
      const query = `
        INSERT INTO items (name, price, balance, vidprice, ed) 
        VALUES ${values.join(', ')} 
        RETURNING *;
      `;

      // Flatten the values array to pass as query parameters
      const flattenedValues = items.reduce((acc, item) => {
        const sanitizedPrice = parseFloat(item.price.replace(/\s+/g, ''));
        acc.push(item.name, sanitizedPrice, item.balance, item.vidprice, item.ed);
        return acc;
      }, []);

      // Execute the batch insert query
      const result = await client.query(query, flattenedValues);
      client.release();

      // Return the inserted items
      res.json({ items: result.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all items
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM items ORDER BY name DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
