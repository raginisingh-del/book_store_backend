// middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');

// Middleware to handle the result of validation checks
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    // Return 400 Bad Request with all validation errors
    return res.status(400).json({ errors: errors.array() });
};

// Validation chain for user registration
const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more chars'),
    validate // <- Execute the validation result check
];

module.exports = { registerValidation, validate };