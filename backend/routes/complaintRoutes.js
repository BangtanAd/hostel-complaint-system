const express = require('express');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_CATEGORIES = [
  'Water',
  'Electricity',
  'Wi-Fi',
  'Maintenance',
  'Cleanliness',
  'Furniture',
  'Other',
];

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
const ALLOWED_STATUSES = ['Submitted', 'In Progress', 'Resolved'];

function generateComplaintId() {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `HC-${randomDigits}`;
}

function handleServerError(res, context, error) {
  console.error(`${context}:`, error);
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  return res.status(500).json({
    message: 'Something went wrong. Please try again later.',
  });
}

// @route   POST /api/complaints
// @desc    Student submits a new complaint
router.post('/', protect, async (req, res) => {
  try {
    const cleanTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const cleanDescription =
      typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const category = req.body.category;
    const priority = req.body.priority || 'Medium';

    if (!cleanTitle || !cleanDescription || !category) {
      return res
        .status(400)
        .json({ message: 'Title, category, and description are required' });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid complaint category' });
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid complaint priority' });
    }

    let complaint = null;
    let trackingId = '';

    // Retry up to 5 times if a random HC-XXXXXX tracking ID collides
    for (let attempt = 0; attempt < 5; attempt++) {
      trackingId = generateComplaintId();
      try {
        complaint = await Complaint.create({
          complaintId: trackingId,
          student: req.user._id,
          title: cleanTitle,
          category,
          priority,
          description: cleanDescription,
          status: 'Submitted',
          history: [
            {
              status: 'Submitted',
              note: 'Complaint submitted by student',
              updatedBy: req.user.name || 'Student',
              timestamp: new Date(),
            },
          ],
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 4) {
          continue;
        }
        throw err;
      }
    }

    // Notify all admins about the new complaint
    try {
      const admins = await User.find({ role: 'admin' });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `[${trackingId}] New ${category} complaint from ${req.user.name} (${req.user.hostelBlock} - Room ${req.user.roomNumber}): "${cleanTitle}"`,
        complaintId: complaint._id,
      }));

      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    } catch (notifErr) {
      console.error('Admin notification creation failed:', notifErr);
    }

    const populatedComplaint = await Complaint.findById(complaint._id).populate(
      'student',
      'name email rollNumber hostelBlock roomNumber'
    );

    res.status(201).json(populatedComplaint);
  } catch (error) {
    handleServerError(res, 'Create complaint failed', error);
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
    handleServerError(res, 'Fetch student complaints failed', error);
  }
});

// @route   POST /api/complaints/:id/feedback
// @desc    Student submits one-time 1-5 star feedback on a Resolved complaint
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const numericRating = Number(req.body.rating);
    const cleanComment =
      typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ message: 'Please provide a whole number rating between 1 and 5' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.student.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to rate this complaint' });
    }

    if (complaint.status !== 'Resolved') {
      return res
        .status(400)
        .json({ message: 'Feedback can only be submitted for Resolved complaints' });
    }

    if (complaint.feedback?.rating) {
      return res
        .status(400)
        .json({ message: 'Feedback has already been submitted' });
    }

    complaint.feedback = {
      rating: numericRating,
      comment: cleanComment,
      submittedAt: new Date(),
    };

    await complaint.save();

    const populated = await Complaint.findById(complaint._id).populate(
      'student',
      'name email rollNumber hostelBlock roomNumber'
    );

    res.json(populated);
  } catch (error) {
    handleServerError(res, 'Submit feedback failed', error);
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
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this complaint' });
    }

    if (complaint.status !== 'Submitted') {
      return res
        .status(400)
        .json({ message: 'Only complaints in Submitted status can be cancelled' });
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint cancelled successfully' });
  } catch (error) {
    handleServerError(res, 'Delete complaint failed', error);
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
    handleServerError(res, 'Fetch stats failed', error);
  }
});

// @route   GET /api/complaints
// @desc    Admin gets all complaints (with optional status/category/search filters)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = status;
    }

    if (category && category !== 'All') {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'Invalid category filter' });
      }
      filter.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { complaintId: { $regex: escapedSearch, $options: 'i' } },
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email rollNumber hostelBlock roomNumber')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    handleServerError(res, 'Fetch all complaints failed', error);
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

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid complaint status' });
      }

      if (complaint.status === 'Resolved' && status !== 'Resolved') {
        return res.status(400).json({
          message: 'Resolved complaints cannot be moved back to an open status',
        });
      }

      complaint.status = status;
      if (status === 'Resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
    }

    const cleanNote =
      typeof adminNote === 'string' ? adminNote.trim() : undefined;
    if (cleanNote !== undefined) {
      complaint.adminNote = cleanNote;
    }

    complaint.history.push({
      status: complaint.status,
      note: cleanNote || `Status updated to ${complaint.status}`,
      updatedBy: req.user.name || 'Warden',
      timestamp: new Date(),
    });

    // Save with retry if backfilling a missing complaintId on an older document
    const hadComplaintId = Boolean(complaint.complaintId);
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!hadComplaintId) {
        complaint.complaintId = generateComplaintId();
      }
      try {
        await complaint.save();
        break;
      } catch (err) {
        if (!hadComplaintId && err.code === 11000 && attempt < 4) {
          continue;
        }
        throw err;
      }
    }

    // Isolate notification creation so a legacy record never breaks status updates
    if (complaint.student) {
      try {
        await Notification.create({
          user: complaint.student,
          message: `[${complaint.complaintId}] Your complaint "${complaint.title}" is now marked as ${complaint.status}.${
            cleanNote ? ` Warden Note: "${cleanNote}"` : ''
          }`,
          complaintId: complaint._id,
        });
      } catch (notifErr) {
        console.error('Student notification creation failed:', notifErr);
      }
    }

    const populated = await Complaint.findById(complaint._id).populate(
      'student',
      'name email rollNumber hostelBlock roomNumber'
    );

    res.json(populated);
  } catch (error) {
    handleServerError(res, 'Update complaint failed', error);
  }
});

module.exports = router;