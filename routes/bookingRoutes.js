const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getAllBookings, getBookingById, getUserBookings, createBooking, updateBooking, deleteBooking } = require('../controllers/bookingController');

// GET all bookings (admin/debug)
router.get('/', getAllBookings);

// GET a single booking by ID
router.get('/:id', getBookingById);

// GET bookings for logged-in user
router.get('/my-history', authMiddleware, getUserBookings);

// POST create a new booking
router.post('/', authMiddleware, createBooking);

// PUT update a booking
router.put('/:id', authMiddleware, updateBooking);

// DELETE a booking
router.delete('/:id', authMiddleware, deleteBooking);

module.exports = router;
