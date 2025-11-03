const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, registerUser, updateUser, deleteUser, loginUser } = require('../controllers/userController');
const { registerValidation } = require('../middleware/validationMiddleware');

// GET all users
router.get('/', getAllUsers);

// GET a single user by ID
router.get('/:id', getUserById);

// POST register a new user (with validation)
router.post('/register', registerValidation, registerUser);

// POST login a user
router.post('/login', loginUser);

// PUT update a user
router.put('/:id', updateUser);

// DELETE a user
router.delete('/:id', deleteUser);

module.exports = router;
