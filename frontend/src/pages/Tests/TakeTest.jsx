import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Clock, HelpCircle, AlertTriangle, ChevronLeft, ChevronRight, Send, WifiOff, Play, Calendar, Lock, Timer } from 'lucide-react';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import useTimer from '../../hooks/useTimer.js';

const ANSWERS_KEY = 'test_answers';
const ATTEMPT_KEY = 'test_attempt';

// Format a countdown from milliseconds
const formatCountdown = (ms) => {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

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

  // Schedule countdown
  const [now, setNow] = useState(new Date());

  // Timer
  const handleExpire = useCallback(() => {
    submitTest(true);
  }, []);

  const { timeRemaining, isRunning, start: startTimer, formatTime, reset: resetTimer } =
    useTimer(0, handleExpire);

  // Tick every second for schedule countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Auto-submit when scheduledEndTime is reached during an active test
  useEffect(() => {
    if (!started || !test || submitting) return;
    const endTime = test.settings?.scheduledEndTime ? new Date(test.settings.scheduledEndTime) : null;
    if (!endTime) return;

    const msUntilEnd = endTime.getTime() - now.getTime();
    if (msUntilEnd <= 0) {
      // End time has passed, auto-submit
      submitTest(true);
    }
  }, [started, test, now, submitting]);

  // Socket.io setup
  useEffect(() => {
    if (!started || !attemptId) return;

    const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
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

  // Compute schedule status
  const scheduledStart = test?.settings?.scheduledStartTime ? new Date(test.settings.scheduledStartTime) : null;
  const scheduledEnd = test?.settings?.scheduledEndTime ? new Date(test.settings.scheduledEndTime) : null;
  const isBeforeStart = scheduledStart && now < scheduledStart;
  const isAfterEnd = scheduledEnd && now > scheduledEnd;
  const countdownToStart = isBeforeStart ? scheduledStart.getTime() - now.getTime() : 0;

  // Start test
  const handleStart = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/api/tests/start', { testId });
      const attempt = data.attemptId || data.attempt?._id;
      const qs = data.questions || [];

      // Calculate effective duration: min of test duration and time until scheduledEndTime
      let durationMs = (data.duration || test?.settings?.duration || test?.duration || 30) * 60 * 1000;
      if (scheduledEnd) {
        const msUntilEnd = scheduledEnd.getTime() - Date.now();
        if (msUntilEnd > 0 && msUntilEnd < durationMs) {
          durationMs = msUntilEnd;
        }
      }

      setAttemptId(attempt);
      setQuestions(qs);
      setStarted(true);
      resetTimer(durationMs);
      startTimer();

      // Save attempt info for refresh recovery
      localStorage.setItem(
        `${ATTEMPT_KEY}_${testId}`,
        JSON.stringify({ attemptId: attempt, questions: qs, remainingTime: durationMs })
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

      navigate(`/tests/results/${attemptId}`);
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

  // Timer progress percentage
  const totalDuration = test?.settings?.duration ? test.settings.duration * 60 * 1000 : (test?.duration ? test.duration * 60 * 1000 : 1);
  const timerProgress = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));

  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading && !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error && !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="bg-surface-card border-2 border-bdr rounded-2xl p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-red-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-red-400 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/tests')}
            className="btn-primary"
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
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="bg-surface-card border-2 border-bdr rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-black text-txt mb-2">{test?.title}</h1>
          <p className="text-txt-muted mb-6">{test?.description || 'Good luck!'}</p>

          <div className="flex justify-center gap-3 mb-6">
            <span className="badge badge-accent inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {test?.settings?.duration || test?.duration || 30} minutes
            </span>
            <span className="badge badge-purple inline-flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> {test?.questions?.length || test?.questionCount || '?'} questions
            </span>
          </div>

          {/* Schedule Time Window */}
          {(scheduledStart || scheduledEnd) && (
            <div className="mb-6 p-4 rounded-xl bg-surface border-2 border-bdr text-left space-y-2">
              <h3 className="text-sm font-bold text-txt-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" /> Test Schedule
              </h3>
              {scheduledStart && (
                <div className="flex items-center gap-2 text-sm text-txt-secondary">
                  <span className="text-green-400 font-semibold">Opens:</span>
                  <span>{formatScheduleDate(test.settings.scheduledStartTime)}</span>
                </div>
              )}
              {scheduledEnd && (
                <div className="flex items-center gap-2 text-sm text-txt-secondary">
                  <span className="text-red-400 font-semibold">Closes:</span>
                  <span>{formatScheduleDate(test.settings.scheduledEndTime)}</span>
                </div>
              )}
            </div>
          )}

          {/* Countdown to start */}
          {isBeforeStart && (
            <div className="mb-6 p-4 rounded-xl bg-blue-400/5 border-2 border-blue-400/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold text-blue-400">Test hasn't started yet</span>
              </div>
              <div className="text-2xl font-mono font-black text-blue-400">
                {formatCountdown(countdownToStart)}
              </div>
              <p className="text-xs text-blue-400/70 mt-1">until test opens</p>
            </div>
          )}

          {/* Test has ended */}
          {isAfterEnd && (
            <div className="mb-6 p-4 rounded-xl bg-red-400/5 border-2 border-red-400/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-red-400" />
                <span className="text-sm font-bold text-red-400">This test has ended</span>
              </div>
              <p className="text-xs text-red-400/70">The submission window has closed.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading || isBeforeStart || isAfterEnd}
            className={`w-full py-3 ${isBeforeStart || isAfterEnd ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Starting...
              </span>
            ) : isAfterEnd ? (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Test Closed
              </span>
            ) : isBeforeStart ? (
              <span className="flex items-center justify-center gap-2">
                <Timer className="w-4 h-4" /> Waiting to Open...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start Test
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Test view
  return (
    <div className="min-h-screen bg-surface">
      {/* Reconnection notice */}
      {showReconnectNotice && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-black text-center py-2 text-sm font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> Connection lost. Reconnecting... Your answers are saved locally.
        </div>
      )}

      {/* Timer bar */}
      <div
        className={`sticky top-0 z-40 bg-surface-card border-b-2 border-bdr ${
          showReconnectNotice ? 'mt-10' : ''
        }`}
      >
        {/* Yellow gradient progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isLowTime ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
            }`}
            style={{ width: `${timerProgress}%` }}
          />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-txt-secondary truncate max-w-xs">
            {test?.title}
          </h2>
          <div
            className={`text-lg font-mono font-black px-4 py-1.5 rounded-xl flex items-center gap-2 ${
              isLowTime
                ? 'bg-red-400/10 text-red-400 border border-red-400/20 animate-pulse'
                : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
            }`}
          >
            <Clock className="w-4 h-4" /> {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-txt-muted">
            {answeredCount}/{questions.length} answered
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Question navigation sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-surface-card border-2 border-bdr rounded-2xl p-4 sticky top-24">
            <h3 className="text-sm font-bold text-txt-secondary mb-3">Questions</h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((q, index) => {
                const qId = q._id || q.id || index;
                const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
                const isCurrent = index === currentIndex;
                return (
                  <button
                    key={qId}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      isCurrent
                        ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black'
                        : isAnswered
                        ? 'bg-green-400/10 text-green-400 border-2 border-green-400/30'
                        : 'bg-surface-input text-txt-muted border-2 border-bdr hover:border-bdr-hover'
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
              className="btn-primary w-full mt-4 py-2.5 text-sm"
            >
              <span className="flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" /> Submit Test
              </span>
            </button>
          </div>
        </div>

        {/* Current question */}
        <div className="flex-1">
          {currentQuestion && (
            <div className="bg-surface-card border-2 border-bdr rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="badge badge-accent">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-txt-muted">
                  {currentQuestion.points || 1} point{(currentQuestion.points || 1) !== 1 ? 's' : ''}
                </span>
              </div>

              <h3 className="text-lg font-bold text-txt mb-6">
                {currentQuestion.question || currentQuestion.text}
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
                            ? 'border-yellow-400/50 bg-yellow-400/5'
                            : 'border-bdr hover:border-bdr-hover hover:bg-surface-input'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${qId}`}
                          checked={isSelected}
                          onChange={() => setAnswer(qId, option)}
                          className="accent-yellow-400"
                        />
                        <span className={`${isSelected ? 'text-txt' : 'text-txt-secondary'}`}>{option}</span>
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
                  className="input-field resize-none"
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Finish Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border-2 border-bdr rounded-2xl p-6 max-w-sm w-full mx-4 animate-scaleIn">
            <h3 className="text-lg font-black text-txt mb-2">Submit Test?</h3>
            <p className="text-txt-secondary text-sm mb-1">
              You have answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-amber-400 text-sm mb-4">
                {questions.length - answeredCount} question(s) are unanswered.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => submitTest(false)}
                disabled={submitting}
                className="btn-primary flex-1"
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
