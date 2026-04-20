const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  age: {
    type: Number,
    min: 10,
    max: 100
  },
  grade: {
    type: String,
    trim: true
  },
  class: {
    type: String,
    trim: true
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
  address: {
    type: String,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  guardian: {
    type: String,
    trim: true
  },
  guardianPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Suspended'],
    default: 'Active'
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0,
    default: 0
  },
  // Skills & Experience
  skills: {
    type: String,
    trim: true
  },
  experiences: {
    type: String,
    trim: true
  },
  educationBackground: {
    type: String,
    trim: true
  },
  projectLink: {
    type: String,
    trim: true
  },
  languages: {
    type: String,
    trim: true
  },
  // Alumni fields (when graduated)
  graduationYear: {
    type: Number,
    min: 1980,
    max: 2030
  },
  currentPosition: {
    type: String,
    trim: true
  },
  company: {
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
  // For student login
  password: {
    type: String,
    required: true
  },
  // Attendance tracking
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    },
    course: {
      type: String,
      required: true
    },
    notes: {
      type: String
    }
  }],
  // Enrolled courses
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
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
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate GPA from grades
studentSchema.methods.calculateGPA = async function() {
  const Grade = mongoose.model('Grade');
  const grades = await Grade.find({ student: this._id });
  
  if (grades.length === 0) return 0;
  
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };
  
  let totalPoints = 0;
  grades.forEach(g => {
    totalPoints += gradePoints[g.grade] || 0;
  });
  
  this.gpa = (totalPoints / grades.length).toFixed(2);
  await this.save();
  
  return this.gpa;
};

// Method to get attendance percentage
studentSchema.methods.getAttendancePercentage = function() {
  if (this.attendance.length === 0) return 0;
  const present = this.attendance.filter(a => a.status === 'present').length;
  return Math.round((present / this.attendance.length) * 100);
};

module.exports = mongoose.model('Student', studentSchema);
