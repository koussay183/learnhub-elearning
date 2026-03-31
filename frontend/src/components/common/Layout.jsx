import { useAuth } from '../../hooks/useAuth';
import useAuthStore from '../../context/authStore';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children, activePage }) => {
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed top navbar */}
      <Navbar user={user} onLogout={logout} />

      {/* Fixed left sidebar (hidden on mobile via Sidebar internals) */}
      <Sidebar activePage={activePage} user={user} />

      {/* Main content area */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
