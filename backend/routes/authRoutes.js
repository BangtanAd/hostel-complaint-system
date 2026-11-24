const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function to generate JWT token (valid for 7 days)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new student (or admin via server-side secret)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNumber,
      hostelBlock,
      roomNumber,
      adminCode,
    } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Please fill in all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: 'An account with this email already exists' });
    }

    // Assign role securely using Render environment variable
    let role = 'student';
    if (adminCode) {
      if (
        !process.env.WARDEN_SECRET_CODE ||
        adminCode !== process.env.WARDEN_SECRET_CODE
      ) {
        return res
          .status(403)
          .json({ message: 'Invalid or disabled warden registration code' });
      }
      role = 'admin';
    }

    if (role === 'student' && (!rollNumber || !hostelBlock || !roomNumber)) {
      return res.status(400).json({
        message: 'Students must provide Roll Number, Hostel Block, and Room Number',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      rollNumber: role === 'student' ? rollNumber : 'ADMIN',
      hostelBlock: role === 'student' ? hostelBlock : 'Office',
      roomNumber: role === 'student' ? roomNumber : 'Admin',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      hostelBlock: user.hostelBlock,
      roomNumber: user.roomNumber,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;