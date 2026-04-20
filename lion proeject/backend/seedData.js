const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Course = require('./models/Course');
const Grade = require('./models/Grade');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Course.deleteMany({});
    await Grade.deleteMany({});

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@school.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      phone: '123-456-7890',
      address: '123 Admin Street'
    });
    await adminUser.save();

    // Create teacher users
    const teacherUsers = [];
    const teacherData = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@school.com', username: 'jsmith', subject: 'Mathematics', department: 'Science' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@school.com', username: 'sjohnson', subject: 'English', department: 'Arts' },
      { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@school.com', username: 'mbrown', subject: 'Physics', department: 'Science' }
    ];

    for (const data of teacherData) {
      const user = new User({
        username: data.username,
        email: data.email,
        password: 'teacher123',
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'teacher',
        phone: '555-0000',
        address: '456 Teacher Ave'
      });
      await user.save();
      teacherUsers.push(user);

      const teacher = new Teacher({
        user: user._id,
        employeeId: `TCH${1000 + teacherUsers.length}`,
        department: data.department,
        subjects: [data.subject],
        joiningDate: new Date('2020-09-01'),
        qualification: 'Masters Degree',
        experience: 5 + teacherUsers.length,
        phone: user.phone,
        address: user.address
      });
      await teacher.save();
    }

    // Create student users
    const studentUsers = [];
    const studentData = [
      { firstName: 'Alice', lastName: 'Cooper', email: 'alice@school.com', username: 'acooper', grade: '10th' },
      { firstName: 'Bob', lastName: 'Davis', email: 'bob@school.com', username: 'bdavis', grade: '11th' },
      { firstName: 'Carol', lastName: 'Evans', email: 'carol@school.com', username: 'cevans', grade: '9th' },
      { firstName: 'David', lastName: 'Foster', email: 'david@school.com', username: 'dfoster', grade: '12th' }
    ];

    for (const data of studentData) {
      const user = new User({
        username: data.username,
        email: data.email,
        password: 'student123',
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'student',
        phone: '555-1111',
        address: '789 Student Blvd'
      });
      await user.save();
      studentUsers.push(user);

      const student = new Student({
        user: user._id,
        studentId: `STU${2000 + studentUsers.length}`,
        dateOfBirth: new Date('2005-06-15'),
        grade: data.grade,
        section: 'A',
        enrollmentDate: new Date('2021-09-01'),
        guardianName: 'Parent Name',
        guardianPhone: '555-2222',
        guardianEmail: 'parent@email.com',
        address: user.address,
        bloodGroup: 'O+',
        emergencyContact: '555-3333'
      });
      await student.save();
    }

    // Create courses
    const courses = [];
    const courseData = [
      { name: 'Mathematics 101', code: 'MATH101', description: 'Basic Mathematics', credits: 3 },
      { name: 'English Literature', code: 'ENG102', description: 'English Literature Studies', credits: 3 },
      { name: 'Physics', code: 'PHY103', description: 'Introduction to Physics', credits: 4 },
      { name: 'Chemistry', code: 'CHE104', description: 'Basic Chemistry', credits: 4 }
    ];

    for (let i = 0; i < courseData.length; i++) {
      const course = new Course({
        name: courseData[i].name,
        code: courseData[i].code,
        description: courseData[i].description,
        teacher: teacherUsers[i % teacherUsers.length]._id,
        credits: courseData[i].credits,
        schedule: {
          day: ['Monday', 'Wednesday', 'Friday'][i % 3],
          time: '09:00 AM - 10:30 AM',
          room: `Room ${101 + i}`
        },
        enrolledStudents: studentUsers.map(u => u._id),
        maxCapacity: 30
      });
      await course.save();
      courses.push(course);
    }

    // Create grades
    const gradeTypes = ['Midterm', 'Final', 'Quiz', 'Assignment'];
    for (const student of studentUsers) {
      for (const course of courses) {
        const grade = new Grade({
          student: student._id,
          course: course._id,
          teacher: course.teacher,
          score: Math.floor(Math.random() * 30) + 70, // Random score 70-100
          maxScore: 100,
          grade: 'B+',
          examType: gradeTypes[Math.floor(Math.random() * gradeTypes.length)],
          date: new Date('2024-01-15'),
          remarks: 'Good performance'
        });
        await grade.save();
      }
    }

    console.log('Database seeded successfully!');
    console.log('Demo Accounts:');
    console.log('  Admin: admin@school.com / admin123');
    console.log('  Teacher: john.smith@school.com / teacher123');
    console.log('  Student: alice@school.com / student123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedData;
