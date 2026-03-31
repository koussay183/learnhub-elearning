import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth.js';
import { LoadingSpinner } from './components/LoadingSpinner.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import Layout from './components/common/Layout.jsx';

// Auth pages
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';

// Main pages
import Dashboard from './pages/Dashboard.jsx';

// Course pages
import CourseBrowser from './pages/Courses/CourseBrowser.jsx';
import CourseDetail from './pages/Courses/CourseDetail.jsx';
import CreateCourse from './pages/Courses/CreateCourse.jsx';
import SessionPlayer from './pages/Courses/SessionPlayer.jsx';
import MyCourses from './pages/Courses/MyCourses.jsx';

// Community pages
import Feed from './pages/Community/Feed.jsx';
import PostDetail from './pages/Community/PostDetail.jsx';

// Chat
import ChatRoom from './pages/Chat/ChatRoom.jsx';

// Test pages
import TestBrowser from './pages/Tests/TestBrowser.jsx';
import CreateTest from './pages/Tests/CreateTest.jsx';
import TakeTest from './pages/Tests/TakeTest.jsx';
import TestResults from './pages/Tests/TestResults.jsx';

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import ContentModeration from './pages/Admin/ContentModeration.jsx';

// Settings
import Profile from './pages/Settings/Profile.jsx';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppLayout = ({ children, activePage }) => (
  <ProtectedRoute>
    <Layout activePage={activePage}>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<AppLayout activePage="dashboard"><Dashboard /></AppLayout>} />

          {/* Courses */}
          <Route path="/courses" element={<AppLayout activePage="courses"><CourseBrowser /></AppLayout>} />
          <Route path="/courses/create" element={<AppLayout activePage="courses"><CreateCourse /></AppLayout>} />
          <Route path="/courses/my" element={<AppLayout activePage="courses"><MyCourses /></AppLayout>} />
          <Route path="/courses/:id" element={<AppLayout activePage="courses"><CourseDetail /></AppLayout>} />
          <Route path="/courses/:courseId/sessions/:sessionId" element={
            <ProtectedRoute><SessionPlayer /></ProtectedRoute>
          } />

          {/* Community */}
          <Route path="/community" element={<AppLayout activePage="community"><Feed /></AppLayout>} />
          <Route path="/community/:postId" element={<AppLayout activePage="community"><PostDetail /></AppLayout>} />

          {/* Chat */}
          <Route path="/chat" element={<AppLayout activePage="chat"><ChatRoom /></AppLayout>} />

          {/* Tests */}
          <Route path="/tests" element={<AppLayout activePage="tests"><TestBrowser /></AppLayout>} />
          <Route path="/tests/create" element={<AppLayout activePage="tests"><CreateTest /></AppLayout>} />
          <Route path="/tests/:testId/take" element={
            <ProtectedRoute><TakeTest /></ProtectedRoute>
          } />
          <Route path="/tests/results/:attemptId" element={<AppLayout activePage="tests"><TestResults /></AppLayout>} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Layout activePage="admin"><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <Layout activePage="admin"><UserManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/moderation" element={
            <ProtectedRoute requiredRole="admin">
              <Layout activePage="admin"><ContentModeration /></Layout>
            </ProtectedRoute>
          } />

          {/* Settings */}
          <Route path="/settings" element={<AppLayout activePage="settings"><Profile /></AppLayout>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
