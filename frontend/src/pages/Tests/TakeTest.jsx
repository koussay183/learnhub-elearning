import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import useTimer from '../../hooks/useTimer.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const ANSWERS_KEY = 'test_answers';
const ATTEMPT_KEY = 'test_attempt';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Test data
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Question navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Socket
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(true);
  const [showReconnectNotice, setShowReconnectNotice] = useState(false);

  // Timer
  const handleExpire = useCallback(() => {
    submitTest(true);
  }, []);

  const { timeRemaining, isRunning, start: startTimer, formatTime, reset: resetTimer } =
    useTimer(0, handleExpire);

  // Fetch test info
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/tests/${testId}`);
        setTest(data.test || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  // Restore saved answers and attempt from localStorage on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`${ANSWERS_KEY}_${testId}`);
    const savedAttempt = localStorage.getItem(`${ATTEMPT_KEY}_${testId}`);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch {}
    }
    if (savedAttempt) {
      try {
        const parsed = JSON.parse(savedAttempt);
        setAttemptId(parsed.attemptId);
        setQuestions(parsed.questions || []);
        setStarted(true);
        resetTimer(parsed.remainingTime || 0);
        startTimer();
      } catch {}
    }
  }, [testId]);

  // Persist answers to localStorage
  useEffect(() => {
    if (started && Object.keys(answers).length > 0) {
      localStorage.setItem(`${ANSWERS_KEY}_${testId}`, JSON.stringify(answers));
    }
  }, [answers, started, testId]);

  // Socket.io setup
  useEffect(() => {
    if (!started || !attemptId) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(API_URL);

    socketRef.current.emit('test:join-room', { testId, attemptId, userId: user?._id });

    socketRef.current.on('connect', () => {
      setSocketConnected(true);
      setShowReconnectNotice(false);
    });

    socketRef.current.on('disconnect', () => {
      setSocketConnected(false);
      setShowReconnectNotice(true);
    });

    socketRef.current.on('test:timer-sync', (data) => {
      if (data && typeof data.remainingTime === 'number') {
        resetTimer(data.remainingTime);
        if (!isRunning) startTimer();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [started, attemptId, testId, user]);

  // Start test
  const handleStart = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/api/tests/start', { testId });
      const attempt = data.attemptId || data.attempt?._id;
      const qs = data.questions || [];
      const duration = (data.duration || test?.duration || 30) * 60 * 1000;

      setAttemptId(attempt);
      setQuestions(qs);
      setStarted(true);
      resetTimer(duration);
      startTimer();

      // Save attempt info for refresh recovery
      localStorage.setItem(
        `${ATTEMPT_KEY}_${testId}`,
        JSON.stringify({ attemptId: attempt, questions: qs, remainingTime: duration })
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  // Submit test
  const submitTest = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      await api.post('/api/tests/submit-test', {
        attemptId,
        testId,
        answers: formattedAnswers,
        autoSubmit: auto,
      });

      // Clean up localStorage
      localStorage.removeItem(`${ANSWERS_KEY}_${testId}`);
      localStorage.removeItem(`${ATTEMPT_KEY}_${testId}`);
      localStorage.removeItem('test_timer_remaining');

      navigate(`/tests/${testId}/results/${attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  // Set answer for current question
  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeRemaining < 60000 && timeRemaining > 0;

  // Loading state
  if (loading && !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && !test) {
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

  // Start screen
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg w-full text-center">
          <span className="text-5xl block mb-4">📝</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{test?.title}</h1>
          <p className="text-gray-500 mb-6">{test?.description || 'Good luck!'}</p>

          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">
              ⏱ {test?.duration || 30} minutes
            </div>
            <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-medium">
              ❓ {test?.questions?.length || test?.questionCount || '?'} questions
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" /> Starting...
              </span>
            ) : (
              'Start Test'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Test view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reconnection notice */}
      {showReconnectNotice && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-medium">
          Connection lost. Reconnecting... Your answers are saved locally.
        </div>
      )}

      {/* Timer bar */}
      <div
        className={`sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm ${
          showReconnectNotice ? 'mt-10' : ''
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 truncate max-w-xs">
            {test?.title}
          </h2>
          <div
            className={`text-lg font-mono font-bold px-4 py-1.5 rounded-xl ${
              isLowTime
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            ⏱ {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-gray-500">
            {answeredCount}/{questions.length} answered
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Question navigation sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-20">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Questions</h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((q, index) => {
                const qId = q._id || q.id || index;
                const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
                const isCurrent = index === currentIndex;
                return (
                  <button
                    key={qId}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      isCurrent
                        ? 'bg-blue-500 text-white shadow-sm'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="w-full mt-4 py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Current question */}
        <div className="flex-1">
          {currentQuestion && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-gray-500">
                  {currentQuestion.points || 1} point{(currentQuestion.points || 1) !== 1 ? 's' : ''}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {currentQuestion.text}
              </h3>

              {/* Multiple choice */}
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, oIndex) => {
                    const qId = currentQuestion._id || currentQuestion.id || currentIndex;
                    const isSelected = answers[qId] === option;
                    return (
                      <label
                        key={oIndex}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${qId}`}
                          checked={isSelected}
                          onChange={() => setAnswer(qId, option)}
                          className="text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-gray-800">{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Short answer */}
              {currentQuestion.type === 'short-answer' && (
                <textarea
                  value={
                    answers[currentQuestion._id || currentQuestion.id || currentIndex] || ''
                  }
                  onChange={(e) =>
                    setAnswer(
                      currentQuestion._id || currentQuestion.id || currentIndex,
                      e.target.value
                    )
                  }
                  placeholder="Type your answer here..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-none"
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  Previous
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 transition-colors"
                  >
                    Finish Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Test?</h3>
            <p className="text-gray-500 text-sm mb-1">
              You have answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-amber-600 text-sm mb-4">
                {questions.length - answeredCount} question(s) are unanswered.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => submitTest(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;
