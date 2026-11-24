const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Submitted', 'In Progress', 'Resolved'],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: String,
      trim: true,
      default: 'System',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Submitted', 'In Progress', 'Resolved'],
      default: 'Submitted',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
    history: {
      type: [historySchema],
      default: [],
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        trim: true,
        default: '',
      },
      submittedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);