import { Test, TestAttempt } from '../models/Test.js';
import { v4 as uuidv4 } from 'uuid';

export const getTests = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const tests = await Test.find({ status: 'published' })
      .populate('createdBy', 'firstName lastName avatar')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Test.countDocuments({ status: 'published' });

    res.json({ tests, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
};

export const getTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).populate('createdBy', 'firstName lastName avatar');
    if (!test) return res.status(404).json({ error: 'Test not found' });

    res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
};

export const createTest = async (req, res) => {
  try {
    const { title, description, questions, settings } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title and questions required' });
    }

    const test = new Test({
      title,
      description,
      questions,
      settings,
      createdBy: req.userId,
    });

    await test.save();
    res.status(201).json({ message: 'Test created', test });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
};

export const updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    if (test.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    Object.assign(test, req.body);
    await test.save();
    res.json({ message: 'Test updated', test });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    if (test.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Test.findByIdAndDelete(req.params.testId);
    res.json({ message: 'Test deleted' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
};

export const startTest = async (req, res) => {
  try {
    const { testId } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Check if test is scheduled and time is valid
    const now = new Date();
    if (test.settings.scheduledStartTime && now < test.settings.scheduledStartTime) {
      return res.status(400).json({ error: 'Test not started yet' });
    }
    if (test.settings.scheduledEndTime && now > test.settings.scheduledEndTime) {
      return res.status(400).json({ error: 'Test has ended' });
    }

    const sessionId = uuidv4();
    const attempt = new TestAttempt({
      testId,
      userId: req.userId,
      responses: [],
      startedAt: new Date(),
      sessionId,
      status: 'in-progress',
    });

    await attempt.save();

    const questionsForStudent = test.questions.map(q => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points,
    }));

    res.json({
      attemptId: attempt._id,
      sessionId,
      questions: questionsForStudent,
      duration: test.settings?.duration,
      testTitle: test.title,
    });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ error: 'Failed to start test' });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, answer } = req.body;

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ error: 'Test is not in progress' });
    }

    const test = await Test.findById(attempt.testId);
    const question = test.questions.id(questionId);
    const isCorrect = question.correctAnswer === answer;

    const existingResponse = attempt.responses.find(r => r.questionId?.toString() === questionId);
    if (existingResponse) {
      existingResponse.answer = answer;
      existingResponse.isCorrect = isCorrect;
    } else {
      attempt.responses.push({ questionId, answer, isCorrect });
    }

    await attempt.save();
    res.json({ message: 'Answer saved', isCorrect });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

export const submitTest = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    // answers is an object like { "questionIndex": "answer", ... }

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.userId.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status === 'completed') return res.status(400).json({ error: 'Test already submitted' });

    const test = await Test.findById(attempt.testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Normalize answers - support both array [{questionId, answer}] and object {"0":"answer"} formats
    let answersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach(a => { answersMap[a.questionId ?? a.questionIndex ?? ''] = a.answer; });
    } else if (answers && typeof answers === 'object') {
      answersMap = answers;
    }

    // Grade each answer
    let totalPoints = 0;
    let earnedPoints = 0;
    const responses = [];

    test.questions.forEach((q, index) => {
      totalPoints += (q.points || 1);
      const userAnswer = answersMap[index.toString()] || answersMap[index] || answersMap[q._id?.toString()] || '';
      const isCorrect = userAnswer.toString().toLowerCase().trim() === q.correctAnswer?.toString().toLowerCase().trim();
      if (isCorrect) earnedPoints += (q.points || 1);

      responses.push({
        questionIndex: index,
        answer: userAnswer,
        isCorrect,
        points: isCorrect ? (q.points || 1) : 0,
      });
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= (test.settings?.passingScore || 50);

    attempt.responses = responses;
    attempt.score = earnedPoints;
    attempt.totalPoints = totalPoints;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    await attempt.save();

    res.json({
      attemptId: attempt._id,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      responses,
      testTitle: test.title,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttempt = async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.userId.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    const test = await Test.findById(attempt.testId);

    // Build detailed results
    const detailedResults = attempt.responses?.map((r, i) => {
      const question = test?.questions?.[r.questionIndex || i];
      return {
        question: question?.question || `Question ${i + 1}`,
        type: question?.type,
        options: question?.options,
        userAnswer: r.answer,
        correctAnswer: question?.correctAnswer,
        isCorrect: r.isCorrect,
        points: r.points,
      };
    }) || [];

    res.json({
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        passed: attempt.passed,
        status: attempt.status,
        completedAt: attempt.completedAt,
        createdAt: attempt.createdAt,
      },
      testTitle: test?.title || 'Unknown Test',
      results: detailedResults,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
