// Mock Database for Demo Mode
const mockDB = {
  students: [
    { _id: '1', name: 'Jean Claude', email: 'jean@school.com', class: 'S4', status: 'Active', gpa: 3.5, studentId: 'STU001' },
    { _id: '2', name: 'Marie Claire', email: 'marie@school.com', class: 'S5', status: 'Active', gpa: 3.8, studentId: 'STU002' },
    { _id: '3', name: 'Peter Ndayisaba', email: 'peter@school.com', class: 'S6', status: 'Graduated', gpa: 3.2, studentId: 'STU003' }
  ],
  teachers: [
    { _id: '1', name: 'Teacher One', email: 'teacher1@school.com', subject: 'Mathematics', teacherId: 'TEA001' },
    { _id: '2', name: 'Teacher Two', email: 'teacher2@school.com', subject: 'Physics', teacherId: 'TEA002' }
  ],
  users: [
    { _id: '1', username: 'admin', password: '$2a$10$yourhash', name: 'Admin User', role: 'admin' }
  ],
  courses: [
    { _id: '1', name: 'Mathematics', code: 'MATH101', description: 'Advanced Mathematics', credits: 4, teacher: '1' },
    { _id: '2', name: 'Physics', code: 'PHY101', description: 'Physics Fundamentals', credits: 3, teacher: '2' },
    { _id: '3', name: 'Chemistry', code: 'CHEM101', description: 'Chemistry Basics', credits: 3, teacher: '1' }
  ],
  grades: [
    { _id: '1', student: '1', course: '1', semester: 'Term 1', score: 85, letterGrade: 'A', gpa: 4.0 },
    { _id: '2', student: '1', course: '2', semester: 'Term 1', score: 78, letterGrade: 'B', gpa: 3.0 },
    { _id: '3', student: '2', course: '1', semester: 'Term 1', score: 92, letterGrade: 'A', gpa: 4.0 },
    { _id: '4', student: '2', course: '3', semester: 'Term 1', score: 88, letterGrade: 'B+', gpa: 3.5 }
  ],
  attendance: [
    { _id: '1', student: '1', date: new Date('2024-01-15'), status: 'Present', course: 'Mathematics' },
    { _id: '2', student: '1', date: new Date('2024-01-16'), status: 'Present', course: 'Physics' },
    { _id: '3', student: '1', date: new Date('2024-01-17'), status: 'Absent', course: 'Chemistry' },
    { _id: '4', student: '2', date: new Date('2024-01-15'), status: 'Present', course: 'Mathematics' },
    { _id: '5', student: '2', date: new Date('2024-01-16'), status: 'Present', course: 'Physics' }
  ],
  notifications: [
    { _id: '1', user: '1', title: 'Welcome Back!', message: 'Welcome to the new semester!', type: 'info', read: false, createdAt: new Date() },
    { _id: '2', user: '1', title: 'Exam Schedule', message: 'Mid-term exams start next week', type: 'warning', read: false, createdAt: new Date() },
    { _id: '3', user: '2', title: 'New Book Available', message: 'A new physics book has been added to the library', type: 'info', read: true, createdAt: new Date() }
  ],
  books: [
    { _id: '1', title: 'Advanced Mathematics', author: 'Dr. Smith', subject: 'Mathematics', class: 'S4', description: 'Comprehensive math textbook', content: 'This is the content of Advanced Mathematics book...', pages: 450, addedBy: '1' },
    { _id: '2', title: 'Physics Fundamentals', author: 'Prof. Johnson', subject: 'Physics', class: 'S5', description: 'Basic physics concepts', content: 'This is the content of Physics Fundamentals book...', pages: 320, addedBy: '1' },
    { _id: '3', title: 'Chemistry Basics', author: 'Dr. Williams', subject: 'Chemistry', class: 'S4', description: 'Introduction to chemistry', content: 'This is the content of Chemistry Basics book...', pages: 280, addedBy: '2' }
  ],
  notes: [
    { _id: '1', title: 'Math Study Guide', subject: 'Mathematics', content: 'Important formulas for calculus...', author: '1', class: 'S4', createdAt: new Date() },
    { _id: '2', title: 'Physics Lab Notes', subject: 'Physics', content: 'Lab experiment procedures...', author: '1', class: 'S5', createdAt: new Date() }
  ],
  payments: [
    { _id: '1', student: '1', amount: 50000, type: 'Tuition', status: 'Paid', date: new Date('2024-01-10') },
    { _id: '2', student: '2', amount: 50000, type: 'Tuition', status: 'Pending', date: new Date('2024-01-15') },
    { _id: '3', student: '1', amount: 15000, type: 'Library Fee', status: 'Paid', date: new Date('2024-01-12') }
  ],
  alumni: [
    { _id: '1', name: 'Peter Ndayisaba', graduation_year: 2023, course_studied: 'Science', current_position: 'Software Engineer', company: 'TechCorp', email: 'peter@alumni.com' },
    { _id: '2', name: 'Jane Uwase', graduation_year: 2022, course_studied: 'Arts', current_position: 'Teacher', company: 'Green Hills School', email: 'jane@alumni.com' }
  ],
  events: [
    { _id: '1', title: 'Graduation Ceremony', date: new Date('2024-12-15'), type: 'ceremony', status: 'upcoming', description: 'Annual graduation ceremony' },
    { _id: '2', title: 'Parent Meeting', date: new Date('2024-11-20'), type: 'meeting', status: 'upcoming', description: 'Quarterly parent meeting' },
    { _id: '3', title: 'Science Fair', date: new Date('2024-10-25'), type: 'academic', status: 'completed', description: 'Annual science exhibition' }
  ]
};

module.exports = mockDB;
