# Lycee du Muhura - School Website

## Where to Insert School Pictures

### 1. Home Page (`src/pages/Home.js`)
**Location:** Add after the tagline or features section
```jsx
// Add this after line 7 (after the tagline):
<div className="school-images">
  <img src="/images/school-building.jpg" alt="School Building" />
  <img src="/images/campus.jpg" alt="Campus" />
</div>
```

### 2. About Page (`src/pages/About.js`)
**Location:** Add after any content section
```jsx
// Add this after any <div className="content-section">:
<div className="school-images">
  <img src="/images/students.jpg" alt="Our Students" />
  <img src="/images/facilities.jpg" alt="School Facilities" />
</div>
```

### 3. Courses Page (`src/pages/Courses.js`)
**Location:** Add at the top or after courses list
```jsx
// Add this before or after the courses-grid div:
<div className="course-images">
  <img src="/images/software-lab.jpg" alt="Software Lab" />
  <img src="/images/fashion-class.jpg" alt="Fashion Class" />
  <img src="/images/networking-lab.jpg" alt="Networking Lab" />
</div>
```

### 4. Student Info Page (`src/pages/StudentInfo.js`)
**Location:** Add after any info-card
```jsx
// Add this in the info-sections grid or at the end:
<div className="student-images">
  <img src="/images/student-life.jpg" alt="Student Life" />
  <img src="/images/activities.jpg" alt="School Activities" />
</div>
```

### 5. Contact Page (`src/pages/Contact.js`)
**Location:** Add after the map section
```jsx
// Add this after the map-section div:
<div className="campus-gallery">
  <h2>Campus Gallery</h2>
  <img src="/images/campus-1.jpg" alt="Campus View" />
  <img src="/images/campus-2.jpg" alt="Campus Grounds" />
</div>
```

## How to Add Images

### Step 1: Create the Images Folder
```bash
mkdir public/images
```

### Step 2: Add Your Images
Copy your school photos to `public/images/` folder:
- `school-building.jpg`
- `campus.jpg`
- `students.jpg`
- `facilities.jpg`
- `software-lab.jpg`
- `fashion-class.jpg`
- `networking-lab.jpg`
- `student-life.jpg`
- `activities.jpg`
- `campus-1.jpg`
- `campus-2.jpg`

### Step 3: Update CSS
Add to `src/App.css`:
```css
.school-images, .course-images, .student-images, .campus-gallery {
  margin: 30px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.school-images img, .course-images img, .student-images img, .campus-gallery img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.campus-gallery h2 {
  grid-column: 1 / -1;
  color: #1E3A5F;
  font-size: 1.8rem;
  margin-bottom: 10px;
}
```

### Alternative: Add Single Hero Image to Home Page
Replace the entire Home.js content with:
```jsx
import React from 'react';

function Home() {
  return (
    <div className="page">
      <h1>Welcome to Lycee du Muhura</h1>
      <p className="tagline">Excellence in Education, Building Future Leaders</p>
      
      <div className="hero-image">
        <img src="/images/school-main.jpg" alt="Lycee du Muhura School" />
      </div>
      
      {/* rest of content */}
    </div>
  );
}
```

Add to CSS:
```css
.hero-image {
  margin: 30px 0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.hero-image img {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}
```

## Image Size Recommendations
- Hero images: 1200x600 pixels
- Gallery images: 800x600 pixels
- Thumbnail images: 400x300 pixels
- File formats: JPG or PNG
- Max file size: 500KB per image

## Quick Start
1. Copy your school photos to `public/images/`
2. Uncomment the image sections in the page files
3. Update the image filenames to match your files
4. Refresh the browser to see the changes
