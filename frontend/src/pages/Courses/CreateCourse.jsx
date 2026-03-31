import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import { Button } from '../../components/Button.jsx';
import { Input } from '../../components/Input.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const CATEGORIES = [
  'Development',
  'Business',
  'Design',
  'Marketing',
  'Science',
  'Language',
  'Music',
  'Other',
];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const emptySession = { title: '', videoUrl: '', pdfUrl: '', order: 1 };

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Development',
    level: 'Beginner',
    price: 0,
    thumbnail: '',
    language: 'English',
  });

  const [sessions, setSessions] = useState([{ ...emptySession }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSessionChange = (index, field, value) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      { ...emptySession, order: prev.length + 1 },
    ]);
  };

  const removeSession = (index) => {
    if (sessions.length <= 1) return;
    setSessions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const moveSession = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sessions.length) return;
    setSessions((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (form.price < 0) newErrors.price = 'Price cannot be negative';

    sessions.forEach((s, i) => {
      if (!s.title.trim()) newErrors[`session_${i}_title`] = 'Session title is required';
    });

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const courseRes = await api.post('/api/courses', form);
      const courseId = courseRes.data.course?._id || courseRes.data._id;

      // Create sessions
      for (const session of sessions) {
        if (session.title.trim()) {
          await api.post(`/api/courses/${courseId}/sessions`, {
            title: session.title,
            videoUrl: session.videoUrl,
            pdfUrl: session.pdfUrl,
            order: session.order,
          });
        }
      }

      navigate(`/courses/${courseId}`);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            <p className="text-gray-500 mt-1">Share your knowledge with the community</p>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              {/* Course Details Card */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Course Details</h2>

                <Input
                  label="Course Title"
                  name="title"
                  placeholder="e.g. Introduction to Web Development"
                  value={form.title}
                  onChange={handleChange}
                  error={errors.title}
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={5}
                    placeholder="Describe what students will learn in this course..."
                    value={form.description}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 bg-white transition-colors"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      name="level"
                      value={form.level}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 bg-white transition-colors"
                    >
                      {LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Price ($)"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={form.price}
                    onChange={handleChange}
                    error={errors.price}
                  />

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <input
                      name="language"
                      value={form.language}
                      onChange={handleChange}
                      placeholder="English"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors"
                    />
                  </div>
                </div>

                <Input
                  label="Thumbnail URL"
                  name="thumbnail"
                  placeholder="https://example.com/image.jpg"
                  value={form.thumbnail}
                  onChange={handleChange}
                />
              </div>

              {/* Sessions Card */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sessions ({sessions.length})
                  </h2>
                  <Button variant="ghost" onClick={addSession} type="button">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Session
                    </span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {sessions.map((session, index) => (
                    <div
                      key={index}
                      className="p-5 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Session {index + 1}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSession(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSession(index, 1)}
                            disabled={index === sessions.length - 1}
                            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSession(index)}
                              className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                              title="Remove session"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <input
                            placeholder="Session title"
                            value={session.title}
                            onChange={(e) => handleSessionChange(index, 'title', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors bg-white ${
                              errors[`session_${index}_title`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`session_${index}_title`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`session_${index}_title`]}
                            </p>
                          )}
                        </div>
                        <input
                          placeholder="Video URL (YouTube, Vimeo, etc.)"
                          value={session.videoUrl}
                          onChange={(e) => handleSessionChange(index, 'videoUrl', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors bg-white"
                        />
                        <input
                          placeholder="PDF URL (optional)"
                          value={session.pdfUrl}
                          onChange={(e) => handleSessionChange(index, 'pdfUrl', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="px-8 py-3 text-base"
                  disabled={submitting}
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Create Course'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                  className="px-8 py-3 text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Preview
              </h3>
              <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="h-44 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
                  {form.thumbnail ? (
                    <img
                      src={form.thumbnail}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                      {form.level}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {form.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5 line-clamp-1">
                    {form.title || 'Course Title'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {form.description || 'Course description will appear here...'}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-blue-500">
                      {form.price === 0 ? 'Free' : `$${form.price}`}
                    </span>
                    <span className="text-sm text-gray-500">
                      {sessions.filter((s) => s.title.trim()).length} sessions
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {(user?.firstName || 'Y')[0]}
                    </div>
                    <span>
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName || ''}`
                        : 'You'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
