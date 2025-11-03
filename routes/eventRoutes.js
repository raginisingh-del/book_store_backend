const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');

// GET all events
router.get('/', getAllEvents);

// GET a single event by ID
router.get('/:id', getEventById);

// POST create a new event (protected)
router.post('/', authMiddleware, createEvent);

// PUT update an event
router.put('/:id', authMiddleware, updateEvent);

// DELETE an event
router.delete('/:id', authMiddleware, deleteEvent);

module.exports = router;
