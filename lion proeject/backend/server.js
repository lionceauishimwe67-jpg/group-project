const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection - Try real MongoDB first, fallback to in-memory
async function connectDB() {
  try {
    // Try to connect to real MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('MongoDB Connected (Real Database)');
  } catch (err) {
    console.log('Real MongoDB not available, switching to In-Memory Database...');
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB Connected (In-Memory Database)');
      console.log('Note: Data will be lost when server restarts');
      
      // Auto-seed the database
      console.log('Seeding database with demo data...');
      const seedData = require('./seedData');
      await seedData();
    } catch (memErr) {
      console.error('Failed to connect to any database:', memErr);
    }
  }
}

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'School Management System API' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
