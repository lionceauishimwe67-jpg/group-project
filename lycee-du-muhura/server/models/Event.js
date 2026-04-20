const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['exam', 'ceremony', 'meeting', 'event', 'holiday', 'announcement'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  organizer: {
    type: String,
    trim: true
  },
  // For specific classes/courses
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'specific-class'],
    default: 'all'
  },
  targetClasses: [{
    type: String
  }],
  // Attendance tracking
  attendees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    attended: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  // Priority for notifications
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  // Attachments or resources
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-update status based on date
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (this.status !== 'cancelled') {
    if (eventDate > now) {
      this.status = 'upcoming';
    } else if (this.endDate && now > new Date(this.endDate)) {
      this.status = 'completed';
    } else {
      this.status = 'ongoing';
    }
  }
  
  next();
});

// Method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  return new Date(this.date) > new Date();
};

// Static method to get upcoming events
eventSchema.statics.getUpcoming = function(limit = 10) {
  return this.find({
    date: { $gte: new Date() },
    status: { $ne: 'cancelled' }
  })
  .sort({ date: 1 })
  .limit(limit);
};

// Index for date queries
eventSchema.index({ date: 1 });
eventSchema.index({ type: 1, date: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
