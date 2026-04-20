# Lycée du Muhura - School Management System
## Complete Presentation Guide

---

## 1. INTRODUCTION

### Ikigo (School Overview)
- **Name**: Lycée Saint Alexandre Sauli TVET - MUHURA
- **Type**: Technical and Vocational Education and Training (TVET)
- **Location**: Muhura, Rwanda
- **Mission**: Excellence in Technical Education

### System Overview
A comprehensive web-based school management system built with:
- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Authentication**: JWT + bcrypt

---

## 2. SYSTEM FEATURES

### 2.1 Core Modules

| Module | Description | Access |
|--------|-------------|--------|
| **Student Management** | Add, edit, delete students | Admin |
| **Student Information** | View all student details | Public |
| **Alumni Management** | Track graduated students | Admin |
| **Course Management** | Manage school courses | Admin |
| **Authentication** | Secure login system | Admin |

### 2.2 Student Data Fields

#### Basic Information
- Photo
- Name
- Age
- Grade
- Class
- Email
- Phone
- Address
- Enrollment Date
- Status (Active/Graduated/Inactive)
- GPA

#### Guardian Information
- Guardian Name
- Guardian Phone

#### Skills & Experience (5 Fields)
1. **Skills** - Technical abilities (React, Node.js, Python, etc.)
2. **Experience** - Work/internship history
3. **Education Background** - Schools attended
4. **Project Link** - GitHub/Portfolio URL
5. **Languages** - Languages spoken

---

## 3. USER ROLES & ACCESS

### 3.1 Public Users (No Login Required)
- View Student Information page
- Search students by name or class
- View detailed student profiles
- See alumni information
- Access About, Courses, and Contact pages

### 3.2 Admin (Login Required)
**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**Admin Capabilities:**
- Add new students
- Edit student information
- Delete students
- Manage alumni records
- Add/edit courses
- View all student data

---

## 4. SYSTEM WORKFLOW

### 4.1 Adding a New Student (Admin)

```
1. Login → Admin Dashboard
2. Click "Add Student" tab
3. Fill Basic Information:
   - Name, Age, Photo, Class, Grade
   - Email, Phone, Address
   - Enrollment Date, GPA, Status
4. Fill Guardian Information:
   - Guardian Name, Guardian Phone
5. Fill Skills & Experience:
   - Skills, Experience, Education Background
   - Project Link, Languages
6. Click "Add Student" button
7. Student saved to database
```

### 4.2 Viewing Student Information (Public)

```
1. Go to "Student Info" page
2. See list of all students
3. Search by name or class
4. Click "View Details" on any student
5. See complete profile:
   - Photo and basic info
   - Academic information
   - Personal information
   - Guardian information
   - Skills & experience
   - Alumni badge (if applicable)
```

### 4.3 Alumni Integration

```
When student status = "Graduated":
1. System auto-saves to alumni table
2. Alumni info appears on Alumni page
3. Student Info shows "Alumni" badge
4. Link to view alumni profile
```

---

## 5. DATABASE STRUCTURE

### Tables

#### 1. students Table
```sql
- id (PRIMARY KEY)
- name
- photo
- age, grade, class
- email, phone, address
- enrollment_date
- guardian, guardian_phone
- status, gpa
- skills, experiences
- education_background
- project_link, languages
- created_at, updated_at
```

#### 2. alumni Table
```sql
- id (PRIMARY KEY)
- name, photo
- graduation_year
- course_studied
- current_position, company
- email, phone, bio
- achievements
```

#### 3. users Table (Admin)
```sql
- id (PRIMARY KEY)
- username, password
- role
```

#### 4. courses Table
```sql
- id (PRIMARY KEY)
- name, description
- duration
```

---

## 6. USER INTERFACE

### 6.1 Navigation Structure

```
Header
├── Logo (Lycée Saint Alexandre Sauli)
├── Navigation Menu
│   ├── Home
│   ├── About
│   ├── Courses
│   ├── Student Info (Public)
│   ├── Contact Us
│   └── Admin (Login)
└── Footer
    ├── Quick Links
    ├── Contact Info
    └── Social Links
```

### 6.2 Admin Dashboard Layout

```
Admin Dashboard
├── Students Tab
│   ├── View All Students
│   ├── Edit Student
│   └── Delete Student
├── Add Student Tab
│   └── Complete Registration Form
├── Alumni Tab
│   ├── View All Alumni
│   └── Edit Alumni
└── Add Alumni Tab
```

---

## 7. TECHNICAL ARCHITECTURE

### 7.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router, CSS3 |
| Backend | Node.js, Express.js |
| Database | SQLite3 |
| Authentication | bcryptjs, JWT |
| HTTP Client | Fetch API |

### 7.2 Project Structure

```
lycee-du-muhura/
├── public/
│   └── index.html
├── server/
│   ├── database/
│   │   └── db.js
│   └── routes/
│       └── students.js
└── src/
    ├── components/
    │   └── Logo.js
    ├── context/
    │   └── AuthContext.js
    ├── pages/
    │   ├── AdminDashboard.js
    │   ├── StudentInfo.js
    │   ├── Home.js
    │   ├── About.js
    │   ├── Courses.js
    │   ├── Contact.js
    │   ├── Login.js
    │   └── Alumni.js
    ├── services/
    │   └── api.js
    ├── App.js
    └── App.css
```

---

## 8. KEY FEATURES DEMONSTRATION

### 8.1 Student Registration Form
**Location**: Admin Dashboard → Add Student

**Sections**:
1. Personal Information
2. Academic Information
3. Guardian Information
4. Skills & Experience Information

**Features**:
- Photo upload with preview
- Real-time validation
- Auto-save to alumni (if graduated)
- Complete data capture

### 8.2 Student Profile View
**Location**: Student Info → View Details

**Displays**:
- Profile photo
- All personal information
- Academic records
- Guardian details
- Skills & experience
- Alumni status (if applicable)

### 8.3 Search & Filter
**Location**: Student Info page

**Features**:
- Search by name
- Search by class
- Real-time filtering
- Complete student list

---

## 9. ALUMNI MANAGEMENT

### 9.1 Automatic Alumni Creation
When a student's status is set to "Graduated":
- System automatically creates alumni record
- Preserves all student information
- Adds graduation-specific fields

### 9.2 Alumni Fields
- Graduation Year
- Course Studied
- Current Position
- Company
- Bio
- Achievements

### 9.3 Alumni Display
- Dedicated Alumni page
- Badge on Student Info
- Link between student and alumni profiles

---

## 10. SECURITY FEATURES

### 10.1 Authentication
- Secure password hashing (bcrypt)
- JWT token-based sessions
- Protected admin routes
- Login required for admin functions

### 10.2 Data Protection
- SQL injection prevention
- Input validation
- Secure file uploads
- Password encryption

---

## 11. USAGE INSTRUCTIONS

### 11.1 Starting the System

**Backend**:
```bash
cd server
npm install
npm start
```

**Frontend**:
```bash
npm install
npm start
```

### 11.2 Accessing the System

- **Public Site**: http://localhost:3000
- **Admin Login**: http://localhost:3000/login
- **Default Admin**: admin / admin123

---

## 12. SUMMARY

### System Capabilities
✅ Complete student data management
✅ Public student information access
✅ Alumni tracking and integration
✅ Secure admin authentication
✅ Photo upload and storage
✅ Search and filter functionality
✅ Responsive web design
✅ Multi-language support ready

### Data Fields (20+ per student)
- Personal: 8 fields
- Academic: 4 fields
- Guardian: 2 fields
- Skills & Experience: 5 fields
- System: 4 fields

### Key Achievement
A comprehensive school management system that connects current students with alumni, tracks skills and experience, and provides public access to student information while maintaining secure admin controls.

---

**End of Presentation**

*Lycée Saint Alexandre Sauli TVET - MUHURA*
*Excellence in Technical Education*
