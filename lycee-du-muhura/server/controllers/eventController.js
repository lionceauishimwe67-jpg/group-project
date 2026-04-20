const { Event, Student } = require('../models');

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const { type, status } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    
    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const events = await Event.getUpcoming(limit);
    
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming events', error: error.message });
  }
};

// Get single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('attendees.student', 'name studentId');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
};

// Create event
exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event: await event.populate('createdBy', 'name')
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, attended, notes } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if student already marked
    const existingIndex = event.attendees.findIndex(
      a => a.student.toString() === studentId
    );
    
    if (existingIndex >= 0) {
      event.attendees[existingIndex].attended = attended;
      event.attendees[existingIndex].notes = notes;
    } else {
      event.attendees.push({ student: studentId, attended, notes });
    }
    
    await event.save();
    
    res.json({ message: 'Attendance marked successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// Get events for specific student
exports.getStudentEvents = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const events = await Event.find({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' },
        { targetClasses: student.class }
      ],
      date: { $gte: new Date() }
    }).sort({ date: 1 });
    
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student events', error: error.message });
  }
};

// Cancel event
exports.cancelEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event cancelled successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling event', error: error.message });
  }
};
