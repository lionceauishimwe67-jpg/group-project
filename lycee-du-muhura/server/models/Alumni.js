const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  graduationYear: {
    type: Number,
    required: true,
    min: 1980,
    max: 2030
  },
  courseStudied: {
    type: String,
    trim: true,
    default: 'Not Specified'
  },
  currentPosition: {
    type: String,
    trim: true,
    default: 'Not Specified'
  },
  company: {
    type: String,
    trim: true,
    default: 'Not Specified'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  achievements: {
    type: String,
    trim: true
  },
  linkedIn: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  // Reference to original student
  originalStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
alumniSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for searching
alumniSchema.index({ name: 'text', company: 'text', courseStudied: 'text' });
alumniSchema.index({ graduationYear: 1 });
alumniSchema.index({ courseStudied: 1 });

module.exports = mongoose.model('Alumni', alumniSchema);
