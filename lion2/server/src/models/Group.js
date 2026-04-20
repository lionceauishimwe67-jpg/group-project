const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rotationPosition: {
      type: Number,
      required: true,
    },
    cycleNumber: {
      type: Number,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthlyContributionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    payoutDayOfMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
    },
    startDate: {
      type: Date,
      required: true,
    },
    payouts: [payoutSchema],
  },
  { timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;

