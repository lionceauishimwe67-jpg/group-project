# School Management System (SMS)

A comprehensive full-stack web application for managing educational institutions, built with React.js, Node.js, Express, and MongoDB.

![School Management System](https://img.shields.io/badge/School-Management%20System-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?logo=mongodb)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?logo=express)

## Features

### Core Functionality
- **Multi-Role Authentication** - Secure login system for Admins, Teachers, and Students
- **Student Management** - Complete CRUD operations for student records
- **Teacher Management** - Manage teacher profiles, departments, and assignments
- **Course Management** - Create and manage courses, schedules, and enrollments
- **Grade Management** - Record and track student grades across multiple assessment types
- **Dashboard Analytics** - Visual statistics and reports with charts and graphs
- **Role-Based Access Control** - Secure access to features based on user roles

### Technical Features
- Responsive design for all devices
- JWT-based authentication
- RESTful API architecture
- MongoDB database with Mongoose ODM
- Real-time statistics and reporting
- Modern UI with Tailwind CSS
- Data visualization with Recharts

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd school-management-system
```

2. **Install all dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. **Seed the database with sample data** (optional)
```bash
cd backend
npm run seed
```

5. **Start the development servers**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Demo Credentials

After seeding the database, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Teacher | john.smith@school.com | teacher123 |
| Student | emma.wilson@student.school.com | student123 |

## Available Scripts

### Root Directory
```bash
npm run install:all    # Install all dependencies
npm run dev            # Start both frontend and backend
npm run dev:backend    # Start backend only
npm run dev:frontend   # Start frontend only
```

### Backend
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run seed           # Seed database with sample data
```

### Frontend
```bash
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
```

## Project Structure

```
school-management-system/
├── backend/                 # Node.js + Express API
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── .env                # Environment variables
│   ├── package.json
│   ├── server.js           # Entry point
│   └── seed.js             # Database seeder
│
├── frontend/               # React application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS styles
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── package.json            # Root package.json
├── README.md
└── DOCUMENTATION.md        # Full project documentation
```

## Technology Stack

### Frontend
- React.js 18.2.0
- React Router DOM 6.20.0
- Tailwind CSS 3.3.6
- Recharts 2.10.3
- Lucide React 0.294.0
- Axios 1.6.2

### Backend
- Node.js 18+
- Express.js 4.18.2
- MongoDB 6.0+
- Mongoose 8.0.0
- JSON Web Token 9.0.2
- Bcrypt.js 2.4.3
- Express Validator 7.0.1
- CORS 2.8.5

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/password` - Change password

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll student

### Grades
- `GET /api/grades` - Get all grades
- `GET /api/grades/student/:id` - Get grades by student
- `POST /api/grades` - Create grade
- `PUT /api/grades/:id` - Update grade
- `DELETE /api/grades/:id` - Delete grade

### Dashboard
- `GET /api/dashboard/stats` - Get admin statistics
- `GET /api/dashboard/grade-distribution` - Get grade distribution
- `GET /api/dashboard/student-stats` - Get student dashboard data
- `GET /api/dashboard/teacher-stats` - Get teacher dashboard data

## Features by Role

### Administrator
- Full access to all features
- Manage users, students, teachers, and courses
- View system-wide analytics and reports
- Create and manage all records

### Teacher
- View assigned courses and enrolled students
- Record and manage student grades
- Access student academic history
- Update personal profile

### Student
- View personal grades and academic performance
- Access enrolled courses and schedules
- Update personal profile information
- View course information

## Screenshots

### Login Page
Clean, modern authentication interface with secure login functionality.

### Admin Dashboard
Comprehensive overview with statistics cards, grade distribution charts, and recent activity feeds.

### Student Management
Complete student records management with search, filter, add, edit, and delete capabilities.

### Course Management
Card-based course display with scheduling information and enrollment tracking.

### Grade Management
Grade recording interface with multiple assessment types and automatic grade calculations.

## Security Features

- JWT-based authentication with secure token storage
- Bcrypt password hashing (10 rounds)
- Role-based access control middleware
- Input validation and sanitization
- Protected API routes
- CORS configuration
- HTTP-only cookies support

## Database Schema

The system uses MongoDB with the following collections:
- **Users** - Authentication and profile data
- **Students** - Student information and enrollment
- **Teachers** - Teacher profiles and assignments
- **Courses** - Course details and scheduling
- **Grades** - Student grade records

See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed schema information.

## Future Enhancements

- [ ] Mobile application (iOS/Android)
- [ ] Attendance tracking system
- [ ] Fee management module
- [ ] Parent portal
- [ ] Library management integration
- [ ] Push notifications
- [ ] Offline mode support
- [ ] AI-based performance analytics
- [ ] Multi-language support
- [ ] Advanced reporting and analytics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [React.js](https://react.dev/) - Frontend library
- [Express.js](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts and graphs
- [Lucide Icons](https://lucide.dev/) - Icons

## Support

For support, email [your-email@example.com] or open an issue on GitHub.

## Documentation

For complete project documentation including system design, methodology, testing, and more, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

**Built with love by [Your Name]**
