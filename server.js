const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_booking_system';

app.use(express.json());

// Connect MongoDB with better logging and options
const mongooseOptions = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(MONGO_URI, mongooseOptions)
  .then(() => console.log('✅ MongoDB connected:', MONGO_URI && (MONGO_URI.length > 60 ? MONGO_URI.slice(0,60)+'...' : MONGO_URI)))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err && (err.message || err));
    console.error('Check that MongoDB is running and MONGO_URI in .env is correct.');
    process.exit(1);
  });

// optional: handle runtime errors
mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
});

// Routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => res.send('Server is running'));

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

