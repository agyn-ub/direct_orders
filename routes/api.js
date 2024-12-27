const express = require('express');
const router = express.Router();

// In-memory storage for items
let items = [];

// Get all items
router.get('/items', (req, res) => {
    res.json(items);
});

// Add new item
router.post('/items', (req, res) => {
    const { name, price, quantity } = req.body;

    if (!name || typeof price !== 'number' || typeof quantity !== 'number') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const newItem = { name, price, quantity };
    items.push(newItem);
    res.status(201).json({ message: 'Item added successfully', item: newItem });
});

// Clear all items
router.delete('/items', (req, res) => {
    items = [];
    res.json({ message: 'All items cleared' });
});

module.exports = router;
