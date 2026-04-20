const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: String,
    trim: true
  },
  // Assessment breakdown
  assessments: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'midterm', 'final', 'project', 'participation', 'other'],
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    weight: {
      type: Number,
      default: 100
    },
    date: {
      type: Date,
      default: Date.now
    },
    feedback: {
      type: String
    }
  }],
  // Overall grade
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']
  },
  remarks: {
    type: String,
    trim: true
  },
  term: {
    type: String,
    required: true,
    enum: ['Term 1', 'Term 2', 'Term 3', 'Final']
  },
  academicYear: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
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
gradeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate final score from assessments if they exist
  if (this.assessments && this.assessments.length > 0) {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    this.assessments.forEach(assessment => {
      totalWeightedScore += (assessment.score * assessment.weight);
      totalWeight += assessment.weight;
    });
    
    this.score = Math.round(totalWeightedScore / totalWeight);
  }
  
  // Auto-assign letter grade
  const score = this.score;
  if (score >= 90) this.grade = 'A';
  else if (score >= 85) this.grade = 'A-';
  else if (score >= 80) this.grade = 'B+';
  else if (score >= 75) this.grade = 'B';
  else if (score >= 70) this.grade = 'B-';
  else if (score >= 65) this.grade = 'C+';
  else if (score >= 60) this.grade = 'C';
  else if (score >= 55) this.grade = 'C-';
  else if (score >= 50) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

// Static method to calculate GPA
gradeSchema.statics.calculateGPA = async function(studentId) {
  const grades = await this.find({ student: studentId });
  
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
  
  return (totalPoints / grades.length).toFixed(2);
};

// Index for faster queries
gradeSchema.index({ student: 1, course: 1, term: 1 });
gradeSchema.index({ student: 1, academicYear: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
