import React from 'react';

const coursesData = [
  {
    id: 1,
    name: "Software Development",
    icon: "💻",
    description: "Learn programming fundamentals, web development, mobile apps, and software engineering principles. Covers Python, JavaScript, Java, and modern frameworks."
  },
  {
    id: 2,
    name: "Computer System and Architecture",
    icon: "🖥️",
    description: "Understand computer hardware, system design, microprocessors, memory management, and digital logic. Hands-on lab experience with hardware components."
  },
  {
    id: 3,
    name: "Fashion and Design",
    icon: "👗",
    description: "Explore textile design, garment construction, fashion illustration, and the fashion industry. Practical training in pattern making and sewing techniques."
  },
  {
    id: 4,
    name: "Accounting",
    icon: "📊",
    description: "Master financial accounting, cost accounting, taxation, auditing, and business finance. Preparation for professional accounting certifications."
  },
  {
    id: 5,
    name: "Networking",
    icon: "🌐",
    description: "Study network infrastructure, cybersecurity, server administration, and IT support. Includes Cisco and CompTIA certification preparation."
  }
];

function Courses() {
  return (
    <div className="page courses-page">
      <h1>Our Courses</h1>
      <p className="tagline">Comprehensive curriculum designed for academic excellence</p>
      
      <div className="courses-grid">
        {coursesData.map((course) => (
          <div className="course-card" key={course.id}>
            <div className="course-icon">{course.icon}</div>
            <h3>{course.id}. {course.name}</h3>
            <p>{course.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Courses;
