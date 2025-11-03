// controllers/bookingController.js

const Booking = require('../models/Booking');
const Event = require('../models/Event');

// GET all bookings (admin/debug)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('event', 'title date location').populate('user', 'name email');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- GET Booking by ID (Admin or Owner) ---

// @route   GET /api/bookings/:id
// @access  Private (Admin or Owner)
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('event', 'title date location').populate('user', 'name email');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- GET Bookings (Protected - for the logged-in user only) ---

// @route   GET /api/bookings/my-history
// @access  Private
const getUserBookings = async (req, res) => {
    try {
        // Find bookings associated with the authenticated user's ID
        const bookings = await Booking.find({ user: req.user.id })
            // Populate the event details for a user-friendly view
            .populate('event', 'title date location'); 

        res.json(bookings);
    } catch (err) {
        // 500 status for server errors
        res.status(500).json({ message: err.message });
    }
};

// --- POST Create Booking (Capacity Management Logic) ---

// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { eventId, seatsBooked } = req.body;
    const userId = req.user.id;

    try {
        if (!eventId) return res.status(400).json({ message: 'eventId is required' });
        if (!seatsBooked || seatsBooked < 1) return res.status(400).json({ message: 'Must reserve at least 1 seat.' });

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const available = typeof event.availableSeats === 'number' ? event.availableSeats : (typeof event.totalSeats === 'number' ? event.totalSeats : 0);

        if (available < seatsBooked) {
            return res.status(400).json({ message: `Booking failed. Only ${available} seats remaining.` });
        }

        const newBooking = new Booking({
            user: userId,
            event: eventId,
            seatsBooked
        });
        await newBooking.save();

        event.availableSeats = available - seatsBooked;
        await event.save();

        res.status(201).json({ message: 'Booking successful', booking: newBooking });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- PUT Update Booking (Admin or Owner) ---

// @route   PUT /api/bookings/:id
// @access  Private (Admin or Owner)
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // 1. AUTHORIZATION CHECK (Admin can update any, user can only update their own)
        if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this booking.' });
        }

        // 2. If changing seatsBooked, adjust event.availableSeats accordingly
        if (req.body.seatsBooked && req.body.seatsBooked !== booking.seatsBooked) {
            const event = await Event.findById(booking.event);
            if (!event) return res.status(404).json({ message: 'Event not found' });

            const delta = req.body.seatsBooked - booking.seatsBooked; // positive => need more seats
            const available = typeof event.availableSeats === 'number' ? event.availableSeats : (typeof event.totalSeats === 'number' ? event.totalSeats : 0);

            if (delta > 0 && available < delta) {
                return res.status(400).json({ message: `Not enough seats. Only ${available} remaining.` });
            }

            event.availableSeats = available - delta;
            await event.save();
            booking.seatsBooked = req.body.seatsBooked;
        }

        // allow status update
        if (req.body.status) booking.status = req.body.status;

        await booking.save();
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- DELETE Booking (Capacity Restoration Logic) ---

// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // 1. AUTHORIZATION CHECK (Ensure user only deletes their own booking)
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
        }

        // 2. Restore Capacity to the Event (Increment)
        const event = await Event.findById(booking.event);
        if (event) { // Only restore if the event still exists
            event.availableSeats = (typeof event.availableSeats === 'number' ? event.availableSeats : (typeof event.totalSeats === 'number' ? event.totalSeats : 0)) + booking.seatsBooked;
            await event.save();
        }

        // 3. Delete the Booking Record
        await Booking.deleteOne({ _id: req.params.id });
        
        // 204 No Content is standard for successful deletion
        res.status(204).send(); 

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    getUserBookings,
    createBooking,
    updateBooking,
    deleteBooking
};