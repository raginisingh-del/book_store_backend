// middleware/errorMiddleware.js

// Custom error handler for specific errors (e.g., when an ID is badly formatted)
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the next middleware (the errorHandler)
};

const errorHandler = (err, req, res, next) => {
    // Use the status code set earlier (e.g., res.status(400) or res.status(403))
    // or default to 500 if no status was set (meaning it was an unexpected error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 

    res.status(statusCode).json({
        message: err.message,
        // Only show the stack trace if not in production
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };