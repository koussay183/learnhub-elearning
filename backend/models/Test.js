import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  type: { type: String, enum: ['multiple-choice', 'short-answer', 'essay'], required: true },
  question: { type: String, required: true },
  options: [String],
  correctAnswer: { type: String },
  points: { type: Number, default: 1 },
});

const TestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [QuestionSchema],
    settings: {
      duration: { type: Number, required: true },
      passingScore: { type: Number, default: 60 },
      shuffleQuestions: { type: Boolean, default: false },
      showResults: { type: Boolean, default: true },
      scheduledStartTime: { type: Date, default: null },
      scheduledEndTime: { type: Date, default: null },
      openToPublic: { type: Boolean, default: true },
    },
    totalAttempts: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  },
  { timestamps: true }
);

const TestAttemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responses: [{
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
      isCorrect: Boolean,
    }],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ['in-progress', 'submitted', 'graded'], default: 'in-progress' },
    sessionId: { type: String },
  },
  { timestamps: true }
);

export const Test = mongoose.model('Test', TestSchema);
export const TestAttempt = mongoose.model('TestAttempt', TestAttemptSchema);
