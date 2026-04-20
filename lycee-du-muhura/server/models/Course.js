const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  instructor: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  maxStudents: {
    type: Number,
    default: 30
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }],
    startTime: {
      type: String
    },
    endTime: {
      type: String
    },
    room: {
      type: String
    }
  },
  syllabus: {
    type: String
  },
  icon: {
    type: String,
    default: '📚'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed'],
    default: 'Active'
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
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
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get enrollment count
courseSchema.methods.getEnrollmentCount = function() {
  return this.enrolledStudents.length;
};

// Method to check if course is full
courseSchema.methods.isFull = function() {
  return this.enrolledStudents.length >= this.maxStudents;
};

module.exports = mongoose.model('Course', courseSchema);
