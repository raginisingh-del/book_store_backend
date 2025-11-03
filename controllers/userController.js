const bcrypt = require('bcrypt'); // Required for password hashing and comparison
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Use model pre-save hook to hash password
        const newUser = new User({ name, email, password });
        await newUser.save();

        const token = generateToken(newUser._id, newUser.role || 'user');

        res.status(201).json({
            message: 'Registration successful',
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            token
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error during registration: ' + err.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id, user.role);

        res.json({
            message: 'Login successful',
            token,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // copy allowed fields
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.password) user.password = req.body.password; // pre-save will hash
        if (req.body.role) user.role = req.body.role;

        await user.save();
        const out = user.toObject();
        delete out.password;
        res.json(out);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    registerUser,
    loginUser,
    updateUser,
    deleteUser
};