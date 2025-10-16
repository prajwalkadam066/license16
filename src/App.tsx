import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AuthWrapper from './components/AuthWrapper';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Vendors from './pages/Vendors';
import Licenses from './pages/Licenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotificationCenter from './pages/NotificationCenter';

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      return JSON.parse(savedDarkMode);
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const location = useLocation();
  const showNavbar = location.pathname !== '/login';

  // Apply dark mode to document and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode 
        ? 'bg-dark-900 text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {showNavbar && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
      <AuthWrapper>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/License/" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<NotificationCenter />} />
        </Routes>
      </AuthWrapper>
    </div>
  );
}

function App() {
  return (
  <Router basename="/License">
      <AppContent />
    </Router>
  );
}

export default App;