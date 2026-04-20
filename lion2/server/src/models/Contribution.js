const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['paid', 'late', 'missing'],
      default: 'paid',
    },
  },
  { timestamps: true }
);

contributionSchema.index({ group: 1, user: 1, month: 1, year: 1 }, { unique: true });

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;

