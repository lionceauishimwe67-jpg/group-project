# Student Photo Guide - Lycee du Muhura

## Photo Locations for Each Student

All student photos should be placed in: `public/images/students/`

### Student Photo File Names:

| Student ID | Name | Photo File Path |
|------------|------|-----------------|
| 0001 | John Mugabo | `public/images/students/student-001.jpg` |
| 0002 | Marie Uwase | `public/images/students/student-002.jpg` |
| 0003 | Patrick Ndayisaba | `public/images/students/student-003.jpg` |
| 0004 | Claire Iradukunda | `public/images/students/student-004.jpg` |
| 0005 | David Habineza | `public/images/students/student-005.jpg` |
| 0006 | Alice Mukamana | `public/images/students/student-006.jpg` |
| 0007 | Emmanuel Kayitare | `public/images/students/student-007.jpg` |
| 0008 | Diane Tuyishime | `public/images/students/student-008.jpg` |

## Where Photos Appear:

### 1. Student List (Table View)
**Location:** `src/pages/StudentInfo.js` - Line 263-275

Each row shows a thumbnail photo (50x50px circle) next to the student's name.

**To add photos:**
1. Create folder: `public/images/students/`
2. Add student photos with exact filenames above
3. Photos will automatically appear in the table

### 2. Student Detail View
**Location:** `src/pages/StudentInfo.js` - Line 156-168

Shows a larger profile photo (100x100px circle) at the top of the student details.

## Photo Specifications:

### Recommended Sizes:
- **Thumbnail (List View):** 50x50 pixels minimum
- **Profile (Detail View):** 200x200 pixels minimum
- **Aspect Ratio:** Square (1:1)

### Supported Formats:
- JPG/JPEG
- PNG
- WebP

### File Naming:
Use the pattern: `student-XXX.jpg` where XXX is the 3-digit student ID:
- student-001.jpg (for John Mugabo)
- student-002.jpg (for Marie Uwase)
- etc.

## How to Add Photos:

### Step 1: Create Directory Structure
```
public/
  images/
    students/
      student-001.jpg
      student-002.jpg
      student-003.jpg
      ...
```

### Step 2: Add Photos
Copy your student photos to the `public/images/students/` folder with the exact filenames listed above.

### Step 3: Verify
Refresh the browser and go to Student Info page. Photos will appear:
- Small circular thumbnails in the student list table
- Larger circular photo in the student detail view

## Fallback Behavior:
If a photo is missing or fails to load:
- The system shows initials (e.g., "JM" for John Mugabo)
- Displayed in a sky blue circle
- No broken image icons appear

## Quick Commands:

### Create the folder structure:
```bash
mkdir -p public/images/students
```

### Example: Adding a photo for John Mugabo:
```bash
cp john-mugabo-photo.jpg public/images/students/student-001.jpg
```

## CSS Classes for Photos:

- `.student-thumbnail` - Table view photos (50x50px)
- `.thumbnail-fallback` - Initials when photo missing
- `.profile-photo` - Detail view photos (100x100px)
- `.profile-avatar` - Fallback initials in detail view

## Photo Styling:

All photos have:
- Circular shape (border-radius: 50%)
- Sky blue border (#87CEEB)
- Object-fit: cover (maintains aspect ratio)
- Shadow effects on profile photos

## Troubleshooting:

**Photos not showing?**
1. Check file is in `public/images/students/`
2. Verify filename matches exactly (student-001.jpg, etc.)
3. Ensure file extension is .jpg, .png, or .webp
4. Check browser console for 404 errors

**Want to change photo size?**
Edit `src/App.css`:
- Line 518-523: `.student-thumbnail` for list view
- Line 542-549: `.profile-photo` for detail view
