const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Create clients
  router.post('/', async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid data: clients array is required.' });
    }

    // Filter out items with an empty 'code' field
    const filteredItems = items.filter(client => client.code && client.code.trim() !== '');

    if (filteredItems.length === 0) {
      return res.status(400).json({ error: 'No valid items to insert: all items have empty code.' });
    }

    try {
      const client = await pool.connect();

      // Truncate the 'clients' table before inserting new data
      await client.query('TRUNCATE TABLE clients RESTART IDENTITY CASCADE');

      // Prepare values for batch insertion
      const values = [];
      filteredItems.forEach((client, index) => {
        values.push(
          `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
        );
      });

      // Construct the batch insert query
      const query = `
        INSERT INTO clients (nomenklatura, skidka, soglashenie, skidkaznachenie, code, vidprice) 
        VALUES ${values.join(', ')} 
        ON CONFLICT (code) DO UPDATE SET
          nomenklatura = EXCLUDED.nomenklatura,
          skidka = EXCLUDED.skidka,
          soglashenie = EXCLUDED.soglashenie,
          skidkaznachenie = EXCLUDED.skidkaznachenie,
          vidprice = EXCLUDED.vidprice
        RETURNING *;
      `;

      // Flatten the client data for query parameters, ensuring all keys are lowercase to match DB fields
      const flattenedValues = filteredItems.reduce((acc, client) => {
        acc.push(
          client.Nomenklatura || null,        // Convert 'Nomenklatura' to 'nomenklatura'
          client.Skidka || null,              // Convert 'Skidka' to 'skidka'
          client.Soglashenie || null,         // Convert 'Soglashenie' to 'soglashenie'
          client.SkidkaZnachenie || null,     // Convert 'SkidkaZnachenie' to 'skidkaznachenie'
          client.code || null,                // Keep 'code' as is
          client.Vidprice || null             // Convert 'Vidprice' to 'vidprice'
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
