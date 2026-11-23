const express = require('express');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/complaints
// @desc    Student submits a new complaint
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, priority, description } = req.body;

    if (!title || !category || !description) {
      return res
        .status(400)
        .json({ message: 'Title, category, and description are required' });
    }

    const complaint = await Complaint.create({
      student: req.user._id,
      title,
      category,
      priority: priority || 'Medium',
      description,
    });

    // Notify all admins about the new complaint
    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      message: `New ${category} complaint from ${req.user.name} (${req.user.hostelBlock} - Room ${req.user.roomNumber}): "${title}"`,
      complaintId: complaint._id,
    }));

    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    const populatedComplaint = await Complaint.findById(complaint._id).populate(
      'student',
      'name email rollNumber hostelBlock roomNumber'
    );

    res.status(201).json(populatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/complaints/my
// @desc    Get logged-in student's own complaints
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .populate('student', 'name rollNumber hostelBlock roomNumber')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Student deletes own complaint while still in 'Submitted' status
router.delete('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    if (complaint.status !== 'Submitted') {
      return res
        .status(400)
        .json({ message: 'Only complaints in Submitted status can be cancelled' });
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/complaints/stats
// @desc    Get complaint statistics & reports (Admin)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const submitted = await Complaint.countDocuments({ status: 'Submitted' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({
      summary: { total, submitted, inProgress, resolved },
      byCategory,
      byPriority,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/complaints
// @desc    Admin gets all complaints (with optional status/category/search filters)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email rollNumber hostelBlock roomNumber')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Admin updates complaint status & adds resolution note
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) {
      complaint.status = status;
      if (status === 'Resolved') {
        complaint.resolvedAt = new Date();
      }
    }

    if (adminNote !== undefined) {
      complaint.adminNote = adminNote;
    }

    const updatedComplaint = await complaint.save();

    await Notification.create({
      user: complaint.student,
      message: `Your complaint "${complaint.title}" is now marked as ${complaint.status}.${
        adminNote ? ` Warden Note: "${adminNote}"` : ''
      }`,
      complaintId: complaint._id,
    });

    const populated = await Complaint.findById(updatedComplaint._id).populate(
      'student',
      'name email rollNumber hostelBlock roomNumber'
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;