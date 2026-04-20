const { Grade, Student, Course } = require('../models');

// Get all grades
exports.getAllGrades = async (req, res) => {
  try {
    const { student, course, term } = req.query;
    
    let query = {};
    if (student) query.student = student;
    if (course) query.course = course;
    if (term) query.term = term;
    
    const grades = await Grade.find(query)
      .populate('student', 'name studentId')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });
    
    res.json({ grades });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grades', error: error.message });
  }
};

// Get single grade
exports.getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'name studentId')
      .populate('course', 'name code');
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json({ grade });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grade', error: error.message });
  }
};

// Create grade
exports.createGrade = async (req, res) => {
  try {
    const gradeData = req.body;
    
    // Check if grade already exists for this student/course/term
    const existingGrade = await Grade.findOne({
      student: gradeData.student,
      course: gradeData.course,
      term: gradeData.term,
      academicYear: gradeData.academicYear
    });
    
    if (existingGrade) {
      return res.status(400).json({ 
        message: 'Grade already exists for this student/course/term. Use update instead.' 
      });
    }
    
    const grade = new Grade(gradeData);
    await grade.save();
    
    // Update student's GPA
    const student = await Student.findById(gradeData.student);
    if (student) {
      await student.calculateGPA();
    }
    
    res.status(201).json({
      message: 'Grade created successfully',
      grade: await grade.populate('student course')
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating grade', error: error.message });
  }
};

// Update grade
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student course');
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    // Update student's GPA
    if (grade.student) {
      await Student.findById(grade.student._id).then(s => s.calculateGPA());
    }
    
    res.json({ message: 'Grade updated successfully', grade });
  } catch (error) {
    res.status(500).json({ message: 'Error updating grade', error: error.message });
  }
};

// Delete grade
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    // Update student's GPA
    const student = await Student.findById(grade.student);
    if (student) {
      await student.calculateGPA();
    }
    
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting grade', error: error.message });
  }
};

// Publish grades (make visible to students)
exports.publishGrades = async (req, res) => {
  try {
    const { gradeIds } = req.body;
    
    await Grade.updateMany(
      { _id: { $in: gradeIds } },
      { isPublished: true, publishedAt: new Date() }
    );
    
    res.json({ message: 'Grades published successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing grades', error: error.message });
  }
};

// Get grade statistics
exports.getGradeStats = async (req, res) => {
  try {
    const { course, term } = req.query;
    
    let matchQuery = {};
    if (course) matchQuery.course = course;
    if (term) matchQuery.term = term;
    
    const stats = await Grade.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' },
          totalGrades: { $sum: 1 }
        }
      }
    ]);
    
    const gradeDistribution = await Grade.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      statistics: stats[0] || {},
      distribution: gradeDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grade stats', error: error.message });
  }
};

// Bulk create grades
exports.bulkCreateGrades = async (req, res) => {
  try {
    const grades = req.body.grades;
    
    const createdGrades = await Grade.insertMany(grades, { ordered: false });
    
    // Update GPAs for affected students
    const studentIds = [...new Set(grades.map(g => g.student.toString()))];
    for (const studentId of studentIds) {
      const student = await Student.findById(studentId);
      if (student) await student.calculateGPA();
    }
    
    res.status(201).json({
      message: `${createdGrades.length} grades created successfully`,
      grades: createdGrades
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating grades', error: error.message });
  }
};
