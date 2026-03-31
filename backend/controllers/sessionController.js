import Session from '../models/Session.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ courseId: req.params.courseId }).sort({ order: 1 });
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const createSession = async (req, res) => {
  try {
    const { title, description, videoUrl, pdfUrl, order, duration } = req.body;
    const { courseId } = req.params;

    // Verify instructor
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructor.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and video URL required' });
    }

    const session = new Session({
      courseId,
      title,
      description,
      videoUrl,
      pdfUrl,
      order,
      duration: duration || 0,
    });

    await session.save();
    await Course.findByIdAndUpdate(courseId, { $inc: { totalSessions: 1 } });

    res.status(201).json({ message: 'Session created', session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const course = await Course.findById(session.courseId);
    if (course.instructor.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    Object.assign(session, req.body);
    await session.save();
    res.json({ message: 'Session updated', session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const course = await Course.findById(session.courseId);
    if (course.instructor.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Session.findByIdAndDelete(req.params.sessionId);
    await Course.findByIdAndUpdate(session.courseId, { $inc: { totalSessions: -1 } });

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

export const completeSession = async (req, res) => {
  try {
    const { courseId, sessionId } = req.params;

    const enrollment = await Enrollment.findOne({ userId: req.userId, courseId });
    if (!enrollment) return res.status(404).json({ error: 'Not enrolled' });

    if (!enrollment.completedSessions.includes(sessionId)) {
      enrollment.completedSessions.push(sessionId);
    }

    const totalSessions = await Session.countDocuments({ courseId });
    const progressPercent = Math.round((enrollment.completedSessions.length / totalSessions) * 100);
    enrollment.progress = progressPercent;

    if (progressPercent === 100) {
      enrollment.status = 'completed';
      enrollment.certificateEarned = true;
      enrollment.certificateEarnedAt = new Date();
    }

    await enrollment.save();
    res.json({ message: 'Session marked complete', progress: enrollment.progress });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
};
