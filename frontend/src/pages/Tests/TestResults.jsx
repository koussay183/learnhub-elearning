import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const TestResults = () => {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/tests/attempts/${attemptId}`);
        setResult(data.attempt || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <span className="text-4xl block mb-3">⚠️</span>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/tests')}
            className="px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const score = result?.score ?? 0;
  const totalPoints = result?.totalPoints ?? 0;
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = result?.passed ?? percentage >= (result?.passingScore ?? 50);
  const timeTaken = result?.timeTaken
    ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`
    : 'N/A';
  const showResults = result?.showResults ?? true;
  const questions = result?.questions || result?.answers || [];
  const answeredCount = questions.filter(
    (q) => q.userAnswer !== undefined && q.userAnswer !== null && q.userAnswer !== ''
  ).length;

  // Score circle dimensions
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-8">
          {/* Score Circle */}
          <div className="inline-flex items-center justify-center mb-6">
            <svg width="140" height="140" className="-rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke={passed ? '#22C55E' : '#EF4444'}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute">
              <span className="text-4xl font-bold text-gray-900">{percentage}%</span>
            </div>
          </div>

          {/* Pass/Fail Badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${
                passed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {passed ? '🎉 Passed' : '❌ Failed'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {result?.testTitle || result?.test?.title || 'Test Results'}
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {score}/{totalPoints}
            </p>
            <p className="text-xs text-gray-500 mt-1">Score</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{timeTaken}</p>
            <p className="text-xs text-gray-500 mt-1">Time Taken</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{answeredCount}</p>
            <p className="text-xs text-gray-500 mt-1">Answered</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Questions</p>
          </div>
        </div>

        {/* Detailed Results */}
        {showResults && questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Detailed Results</h2>
            <div className="space-y-4">
              {questions.map((q, index) => {
                const isCorrect = q.isCorrect ?? q.correct ?? false;
                return (
                  <div
                    key={q._id || q.questionId || index}
                    className={`border-2 rounded-xl p-4 ${
                      isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">
                        Q{index + 1}. {q.text || q.questionText}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isCorrect
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Wrong'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1 mt-2">
                      <p className="text-gray-600">
                        <span className="font-medium">Your answer:</span>{' '}
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {q.userAnswer || q.answer || 'No answer'}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-gray-600">
                          <span className="font-medium">Correct answer:</span>{' '}
                          <span className="text-green-700">
                            {q.correctAnswer || 'N/A'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/tests')}
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
          >
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
