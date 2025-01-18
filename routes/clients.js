const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Create clients
  router.post('/', async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid data: clients array is required.' });
    }

    try {
      const client = await pool.connect();

      // Truncate the 'clients' table before inserting new data
      await client.query('TRUNCATE TABLE clients RESTART IDENTITY CASCADE');

      // Prepare values for batch insertion
      const values = [];
      items.forEach((client, index) => {
        values.push(
          `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
        );
      });

      // Construct the batch insert query
      const query = `
        INSERT INTO clients (nomenklatura, skidka, soglashenie, skidkaZnachenie, code) 
        VALUES ${values.join(', ')} 
        RETURNING *;
      `;

      // Flatten the client data for query parameters
      const flattenedValues = items.reduce((acc, client) => {
        acc.push(
          client.nomenklatura,
          client.skidka,
          client.soglashenie,
          client.skidkaZnachenie,
          client.code
        );
        return acc;
      }, []);

      // Execute the batch insert
      const result = await client.query(query, flattenedValues);
      client.release();

      // Respond with the inserted clients
      res.json({ items: result.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all clients
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY nomenklatura DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
