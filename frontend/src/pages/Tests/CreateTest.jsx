import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const emptyQuestion = () => ({
  id: Date.now(),
  type: 'multiple-choice',
  text: '',
  points: 1,
  options: ['', '', '', ''],
  correctAnswer: 0,
});

const CreateTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Settings
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(50);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');

  // Questions
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[oIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Test title is required.');
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      setError('All questions must have text.');
      return;
    }
    if (
      questions.some(
        (q) =>
          q.type === 'multiple-choice' &&
          q.options.some((opt) => !opt.trim())
      )
    ) {
      setError('All multiple-choice options must be filled in.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      duration: Number(duration),
      passingScore: Number(passingScore),
      shuffleQuestions,
      showResults,
      scheduledStartTime: scheduledStartTime || undefined,
      scheduledEndTime: scheduledEndTime || undefined,
      questions: questions.map((q) => ({
        type: q.type,
        text: q.text.trim(),
        points: Number(q.points),
        options: q.type === 'multiple-choice' ? q.options : undefined,
        correctAnswer:
          q.type === 'multiple-choice' ? q.options[q.correctAnswer] : undefined,
      })),
    };

    try {
      setLoading(true);
      await api.post('/api/tests', payload);
      navigate('/tests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Test</h1>
            <p className="mt-1 text-gray-500">Design a new test with questions</p>
          </div>
          <button
            onClick={() => navigate('/tests')}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Fundamentals Quiz"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the test..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Start Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled End Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledEndTime}
                  onChange={(e) => setScheduledEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setShuffleQuestions(!shuffleQuestions)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    shuffleQuestions ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      shuffleQuestions ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-700">Shuffle questions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setShowResults(!showResults)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    showResults ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      showResults ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-700">Show results to students after submission</span>
              </label>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-xl p-5 relative"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      Question {qIndex + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-400 hover:text-red-600 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Type & Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Question Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="short-answer">Short Answer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={question.points}
                        onChange={(e) =>
                          updateQuestion(qIndex, 'points', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                      />
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      placeholder="Enter your question..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none"
                    />
                  </div>

                  {/* Multiple choice options */}
                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600">
                        Options (select the correct answer)
                      </label>
                      {question.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            question.correctAnswer === oIndex
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() =>
                              updateQuestion(qIndex, 'correctAnswer', oIndex)
                            }
                            className="text-green-500 focus:ring-green-400"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0"
                          />
                          {question.correctAnswer === oIndex && (
                            <span className="text-xs text-green-600 font-medium">
                              Correct
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview / Summary */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Test Preview</h3>
            <div className="flex flex-wrap gap-4 text-sm text-blue-800">
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
                ❓ {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
                ⭐ {totalPoints} total points
              </span>
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
                ⏱ {duration} minutes
              </span>
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
                🎯 {passingScore}% to pass
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/tests')}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" /> Creating...
                </span>
              ) : (
                'Create Test'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTest;
