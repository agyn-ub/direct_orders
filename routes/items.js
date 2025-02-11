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
          `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
        );
      });

      // Create a query to insert all items at once
      const query = `
        INSERT INTO items (name, price, balance, vidprice, ed, coefficient) 
        VALUES ${values.join(', ')} 
        RETURNING *;
      `;

      // Flatten the values array to pass as query parameters
      const flattenedValues = items.reduce((acc, item) => {
        const sanitizedPrice = parseFloat(item.price.replace(/\s+/g, ''));
        acc.push(item.name, sanitizedPrice, item.balance, item.vidprice, item.ed, item.coefficient);
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

  // Get items with client discounts
  router.get('/', async (req, res) => {
    console.log('GET /items request received');
    try {
      const { code } = req.query;
      console.log('Client code:', code);
      
      const query = `
        SELECT 
          i.name,
          i.price,
          i.balance,
          i.ed,
          i.vidprice,
          i.coefficient,
          c.skidkaznachenie,
          c.vidprice as client_vidprice
        FROM items i
        LEFT JOIN clients c 
          ON i.name = c.nomenklatura 
          AND i.vidprice = c.vidprice
        WHERE 
          (c.code = $1)
          OR 
          (i.vidprice = 'Розничная')
          AND i.price != 0
      `;
      console.log('Executing query with code:', code);
      const result = await pool.query(query, [code]);
      console.log('Query results count:', result.rows.length);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in GET /items:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
