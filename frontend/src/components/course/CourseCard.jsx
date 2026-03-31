import { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Button } from './Button.jsx';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export const CourseCard = ({ course, onEnroll, isEnrolled }) => {
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await onEnroll(course._id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      )}
      <div className="mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
          {course.level}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-blue-500">
          {course.price === 0 ? 'Free' : `$${course.price}`}
        </span>
        <span className="text-sm text-gray-500">{course.totalSessions} sessions</span>
      </div>

      <div className="pt-4 border-t border-gray-200">
        {isEnrolled ? (
          <Button variant="secondary" className="w-full" disabled>
            Enrolled
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleEnroll}
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Enroll Now'}
          </Button>
        )}
      </div>
    </div>
  );
};
