import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      about: 'About',
      academics: 'Academics',
      admissions: 'Admissions',
      studentLife: 'Student Life',
      news: 'News',
      contact: 'Contact',
      login: 'Login',
      
      // Common
      welcome: 'Welcome',
      logout: 'Logout',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      
      // Student Portal
      myGrades: 'My Grades',
      myCourses: 'My Courses',
      attendance: 'Attendance',
      notifications: 'Notifications',
      profile: 'Profile',
      
      // Admin
      dashboard: 'Dashboard',
      students: 'Students',
      teachers: 'Teachers',
      courses: 'Courses',
      grades: 'Grades',
      settings: 'Settings',
      
      // Messages
      loginSuccess: 'Login successful!',
      loginError: 'Invalid credentials',
      saveSuccess: 'Saved successfully!',
      deleteConfirm: 'Are you sure you want to delete?',
      
      // Footer
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      followUs: 'Follow Us',
      quickLinks: 'Quick Links',
      
      // Landing
      heroTitle: 'Excellence in Education',
      heroSubtitle: 'Shaping the future leaders of Rwanda',
      learnMore: 'Learn More',
      ourPrograms: 'Our Programs',
      whyChooseUs: 'Why Choose Us',
      
      // Features
      feature1Title: 'Academic Excellence',
      feature1Desc: 'Top-performing school with outstanding results',
      feature2Title: 'Modern Facilities',
      feature2Desc: 'State-of-the-art classrooms and laboratories',
      feature3Title: 'Expert Teachers',
      feature3Desc: 'Highly qualified and experienced educators',
    }
  },
  rw: {
    translation: {
      // Navigation
      home: 'Ahabanza',
      about: 'Ibijyanye natwe',
      academics: 'Amasomo',
      admissions: 'Kwiyandikisha',
      studentLife: 'Ubuzima bw\'umunyeshuri',
      news: 'Amakuru',
      contact: 'Twandikire',
      login: 'Kwinjira',
      
      // Common
      welcome: 'Murakaza neza',
      logout: 'Gusohoka',
      submit: 'Ohereza',
      cancel: 'Reka',
      save: 'Bika',
      delete: 'Siba',
      edit: 'Hindura',
      view: 'Reba',
      search: 'Shakisha',
      filter: 'Sefatira',
      
      // Student Portal
      myGrades: 'Amanota yanjye',
      myCourses: 'Amasomo yanjye',
      attendance: 'Iyitabira',
      notifications: 'Imenyesha',
      profile: 'Umwirondoro',
      
      // Admin
      dashboard: 'Dashboard',
      students: 'Abanyeshuri',
      teachers: 'Abarimu',
      courses: 'Amasomo',
      grades: 'Amanota',
      settings: 'Igenamiterere',
      
      // Messages
      loginSuccess: 'Kwinjira byagenze neza!',
      loginError: 'Amakuru ntago ariyo',
      saveSuccess: 'Byabitswe neza!',
      deleteConfirm: 'Wizeye ko ushaka gusiba?',
      
      // Footer
      address: 'Aderesi',
      phone: 'Telefoni',
      email: 'Imeli',
      followUs: 'Dukurikire',
      quickLinks: 'Amahuriro akoreshwa',
      
      // Landing
      heroTitle: 'Kwigira mu bumenyi',
      heroSubtitle: 'Tubaka abayobozi b\'ejo hazaza b\'u Rwanda',
      learnMore: 'Menya byinshi',
      ourPrograms: 'Imishinga yacu',
      whyChooseUs: 'Kuki utorera Lycée du Muhura?',
      
      // Features
      feature1Title: 'Kwigira neza',
      feature1Desc: 'Ishuri riri mu bishoboye kurusha ibindi',
      feature2Title: 'Ibikorwa remezo',
      feature2Desc: 'Amashuri n\'amat labouratoire ya none',
      feature3Title: 'Abarimu b\'inzobere',
      feature3Desc: 'Abarimu bafite ubuhanga n\'ubwato',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
