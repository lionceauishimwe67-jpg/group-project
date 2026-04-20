const { Student, Grade, Course } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const { search, status, class: className } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { class: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (className) query.class = className;
    
    const students = await Student.find(query)
      .select('-password')
      .sort({ name: 1 });
    
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Get single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('courses', 'name code');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

// Create student
exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body;
    
    // Generate student ID if not provided
    if (!studentData.studentId) {
      const lastStudent = await Student.findOne().sort({ createdAt: -1 });
      const lastNumber = lastStudent ? parseInt(lastStudent.studentId.replace('STD', '')) : 0;
      studentData.studentId = `STD${String(lastNumber + 1).padStart(3, '0')}`;
    }
    
    // Hash default password
    if (!studentData.password) {
      studentData.password = await bcrypt.hash('student123', 10);
    }
    
    const student = new Student(studentData);
    await student.save();
    
    // If graduated, auto-add to alumni
    if (student.status === 'Graduated' || student.status === 'Inactive') {
      await autoAddToAlumni(student);
    }
    
    res.status(201).json({ 
      message: 'Student created successfully', 
      student: student.toObject({ getters: true, transform: (doc, ret) => { delete ret.password; return ret; } })
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't update password through this route
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // If status changed to graduated/inactive
    if (updates.status === 'Graduated' || updates.status === 'Inactive') {
      await autoAddToAlumni(student);
    }
    
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

// Student login
exports.login = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, student.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: student._id, studentId: student.studentId, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      student: student.toObject({ getters: true, transform: (doc, ret) => { delete ret.password; return ret; } })
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

// Get student grades
exports.getStudentGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.id })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });
    
    res.json({ grades });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grades', error: error.message });
  }
};

// Get student attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('attendance');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ attendance: student.attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { date, status, course, notes } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    student.attendance.push({ date, status, course, notes });
    await student.save();
    
    res.json({ message: 'Attendance marked successfully', attendance: student.attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// Get student stats
exports.getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    
    const byClass = await Student.aggregate([
      { $match: { class: { $exists: true, $ne: null } } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $project: { class: '$_id', count: 1, _id: 0 } }
    ]);
    
    const byGrade = await Student.aggregate([
      { $match: { grade: { $exists: true, $ne: null } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $project: { grade: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.json({
      totalStudents,
      activeStudents,
      byClass,
      byGrade
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// Helper function to auto-add to alumni
async function autoAddToAlumni(student) {
  const { Alumni } = require('../models');
  
  // Check if already exists
  const existing = await Alumni.findOne({ 
    $or: [
      { originalStudent: student._id },
      { email: student.email, name: student.name }
    ]
  });
  
  if (!existing) {
    await Alumni.create({
      name: student.name,
      photo: student.photo,
      graduationYear: student.graduationYear || new Date().getFullYear(),
      courseStudied: student.class || 'Not Specified',
      currentPosition: student.currentPosition || 'Not Specified',
      company: student.company || 'Not Specified',
      email: student.email,
      phone: student.phone,
      bio: student.bio || `Graduated from ${student.class || 'Lycée du Muhura'}`,
      achievements: student.achievements || student.skills,
      originalStudent: student._id
    });
  }
}
