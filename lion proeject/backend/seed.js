const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Course = require('./models/Course');
const Grade = require('./models/Grade');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Course.deleteMany({});
    await Grade.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin User
    const adminUser = new User({
      username: 'admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '1234567890',
      address: 'School Admin Office'
    });
    await adminUser.save();
    console.log('Admin user created');

    // Create Teacher Users
    const teacherUsers = [];
    const teacherData = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@school.com', username: 'jsmith', department: 'Mathematics', subjects: ['Algebra', 'Calculus'], qualification: 'M.Sc. Mathematics' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@school.com', username: 'sjohnson', department: 'Science', subjects: ['Physics', 'Chemistry'], qualification: 'Ph.D. Physics' },
      { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@school.com', username: 'mbrown', department: 'English', subjects: ['Literature', 'Composition'], qualification: 'M.A. English' }
    ];

    for (const data of teacherData) {
      const user = new User({
        username: data.username,
        email: data.email,
        password: 'teacher123',
        role: 'teacher',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: '555' + Math.floor(1000 + Math.random() * 9000)
      });
      const savedUser = await user.save();
      teacherUsers.push({ user: savedUser, ...data });
    }
    console.log('Teacher users created');

    // Create Teacher Profiles
    const teachers = [];
    for (let i = 0; i < teacherUsers.length; i++) {
      const data = teacherUsers[i];
      const teacher = new Teacher({
        userId: data.user._id,
        teacherId: `TCH${2024}${String(i + 1).padStart(3, '0')}`,
        department: data.department,
        subjects: data.subjects,
        qualification: data.qualification,
        experience: 5 + i * 2
      });
      const savedTeacher = await teacher.save();
      teachers.push(savedTeacher);
    }
    console.log('Teacher profiles created');

    // Create Courses
    const courses = [];
    const courseData = [
      { code: 'MATH101', name: 'Algebra I', department: 'Mathematics', credits: 3 },
      { code: 'MATH201', name: 'Calculus', department: 'Mathematics', credits: 4 },
      { code: 'SCI101', name: 'General Physics', department: 'Science', credits: 4 },
      { code: 'SCI201', name: 'Chemistry', department: 'Science', credits: 4 },
      { code: 'ENG101', name: 'English Literature', department: 'English', credits: 3 },
      { code: 'ENG201', name: 'Creative Writing', department: 'English', credits: 3 }
    ];

    for (let i = 0; i < courseData.length; i++) {
      const data = courseData[i];
      const course = new Course({
        courseCode: data.code,
        courseName: data.name,
        department: data.department,
        credits: data.credits,
        description: `${data.name} course for high school students`,
        teacher: teachers[i % teachers.length]._id,
        schedule: {
          day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i % 5],
          startTime: '09:00',
          endTime: '10:30',
          room: `Room ${101 + i}`
        }
      });
      const savedCourse = await course.save();
      courses.push(savedCourse);
    }
    console.log('Courses created');

    // Create Student Users and Profiles
    const students = [];
    const studentNames = [
      ['Emma', 'Wilson'], ['Liam', 'Davis'], ['Olivia', 'Martinez'],
      ['Noah', 'Anderson'], ['Ava', 'Taylor'], ['Ethan', 'Thomas'],
      ['Sophia', 'Jackson'], ['Mason', 'White'], ['Isabella', 'Harris'],
      ['William', 'Martin']
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const [firstName, lastName] = studentNames[i];
      const user = new User({
        username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.school.com`,
        password: 'student123',
        role: 'student',
        firstName,
        lastName,
        phone: '777' + String(Math.floor(1000 + Math.random() * 9000))
      });
      const savedUser = await user.save();

      const grades = ['9', '10', '11', '12'];
      const sections = ['A', 'B', 'C'];

      const student = new Student({
        userId: savedUser._id,
        studentId: `STU${2024}${String(i + 1).padStart(4, '0')}`,
        grade: grades[i % 4],
        section: sections[i % 3],
        dateOfBirth: new Date(2005 + (i % 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'female' : 'male',
        parentName: `Parent ${lastName}`,
        parentPhone: '999' + String(Math.floor(1000 + Math.random() * 9000)),
        parentEmail: `parent.${lastName.toLowerCase()}@email.com`,
        courses: [
          courses[i % courses.length]._id,
          courses[(i + 1) % courses.length]._id,
          courses[(i + 2) % courses.length]._id
        ]
      });
      const savedStudent = await student.save();
      students.push(savedStudent);
    }
    console.log('Student users and profiles created');

    // Create Grades
    const examTypes = ['quiz', 'midterm', 'final', 'assignment', 'project'];
    const semesters = ['Fall 2023', 'Spring 2024'];
    const academicYear = '2023-2024';

    for (const student of students) {
      for (const courseId of student.courses) {
        // Create 2-3 grades per course
        const numGrades = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numGrades; i++) {
          const grade = new Grade({
            student: student._id,
            course: courseId,
            teacher: courses.find(c => c._id.toString() === courseId.toString())?.teacher || teachers[0]._id,
            examType: examTypes[Math.floor(Math.random() * examTypes.length)],
            score: 60 + Math.floor(Math.random() * 40), // Score between 60-100
            maxScore: 100,
            semester: semesters[Math.floor(Math.random() * semesters.length)],
            academicYear,
            remarks: 'Good performance'
          });
          await grade.save();
        }
      }
    }
    console.log('Grades created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@school.com / admin123');
    console.log('Teacher: john.smith@school.com / teacher123');
    console.log('Student: emma.wilson@student.school.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
