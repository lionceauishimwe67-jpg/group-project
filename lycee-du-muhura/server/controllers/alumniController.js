const { Alumni, Student } = require('../models');

// Get all alumni
exports.getAllAlumni = async (req, res) => {
  try {
    const { search, year, course } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { currentPosition: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (year) query.graduationYear = parseInt(year);
    if (course) query.courseStudied = { $regex: course, $options: 'i' };
    
    const alumni = await Alumni.find(query)
      .sort({ graduationYear: -1, name: 1 });
    
    res.json({ alumni });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
};

// Get single alumnus
exports.getAlumnus = async (req, res) => {
  try {
    const alumnus = await Alumni.findById(req.params.id)
      .populate('originalStudent', 'name studentId');
    
    if (!alumnus) {
      return res.status(404).json({ message: 'Alumnus not found' });
    }
    
    // Increment views
    alumnus.views += 1;
    await alumnus.save();
    
    res.json({ alumnus });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumnus', error: error.message });
  }
};

// Create alumnus
exports.createAlumnus = async (req, res) => {
  try {
    const alumnus = new Alumni(req.body);
    await alumnus.save();
    
    res.status(201).json({
      message: 'Alumnus created successfully',
      alumnus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating alumnus', error: error.message });
  }
};

// Update alumnus
exports.updateAlumnus = async (req, res) => {
  try {
    const alumnus = await Alumni.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!alumnus) {
      return res.status(404).json({ message: 'Alumnus not found' });
    }
    
    res.json({ message: 'Alumnus updated successfully', alumnus });
  } catch (error) {
    res.status(500).json({ message: 'Error updating alumnus', error: error.message });
  }
};

// Delete alumnus
exports.deleteAlumnus = async (req, res) => {
  try {
    const alumnus = await Alumni.findByIdAndDelete(req.params.id);
    
    if (!alumnus) {
      return res.status(404).json({ message: 'Alumnus not found' });
    }
    
    res.json({ message: 'Alumnus deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alumnus', error: error.message });
  }
};

// Get alumni statistics
exports.getAlumniStats = async (req, res) => {
  try {
    const totalAlumni = await Alumni.countDocuments();
    
    const byYear = await Alumni.aggregate([
      { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 10 },
      { $project: { graduationYear: '$_id', count: 1, _id: 0 } }
    ]);
    
    const byCourse = await Alumni.aggregate([
      { $group: { _id: '$courseStudied', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { courseStudied: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Top companies
    const topCompanies = await Alumni.aggregate([
      { $match: { company: { $ne: 'Not Specified' } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { company: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.json({
      totalAlumni,
      byYear,
      byCourse,
      topCompanies
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni stats', error: error.message });
  }
};

// Search alumni
exports.searchAlumni = async (req, res) => {
  try {
    const { q } = req.query;
    
    const alumni = await Alumni.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20);
    
    res.json({ alumni });
  } catch (error) {
    res.status(500).json({ message: 'Error searching alumni', error: error.message });
  }
};
