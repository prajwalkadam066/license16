import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Dice1 as License,
  PieChart,
  Settings,
  LogOut,
  Sun,
  Moon,
  Users,
  Menu,
  X,
  Bell,
  Building2,
} from "lucide-react";
import logo from "../assets/Logo.png";
import { getSession, clearSession } from "../utils/session";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

function Navbar({ darkMode, setDarkMode }: NavbarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUserEmail(session.email);
    } else {
      setUserEmail(null);
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    setUserEmail(null);
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    
    // Trigger auth change event
    window.dispatchEvent(new Event('authchange'));
    
    navigate("/login");
  };

  const getUsername = (email: string) => {
    return email.split("@")[0];
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon, onClick }: { 
    to: string; 
    children: React.ReactNode; 
    icon: React.ComponentType<{ className?: string }>; 
    onClick?: () => void;
  }) => {
    const isActive = isActiveRoute(to);
    return (
      <Link
        to={to}
        onClick={() => {
          closeMobileMenu();
          onClick?.();
        }}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-dark-700'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-white dark:bg-dark-800 shadow-lg transition-colors duration-200">
      <div className="container mx-auto px-3">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={logo}
              alt="CybaEm Tech - LicenseHub Logo"
              className="h-10 w-auto object-contain"
            />
         
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {userEmail ? (
              <>
                <NavLink to="/" icon={Layout}>Dashboard</NavLink>
                <NavLink to="/licenses" icon={License}>Licenses</NavLink>
                <NavLink to="/clients" icon={Users}>Clients</NavLink>
                <NavLink to="/vendors" icon={Building2}>Vendors</NavLink>
                <NavLink to="/reports" icon={PieChart}>Reports</NavLink>
                <NavLink to="/notifications" icon={Bell}>Notifications</NavLink>
                <NavLink to="/settings" icon={Settings}>Settings</NavLink>
                
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200 dark:border-dark-600">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? (
                      <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    Hi {getUsername(userEmail)}!
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-white bg-blue-600 dark:bg-blue-500 px-3 py-1.5 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-white bg-blue-600 dark:bg-blue-500 px-3 py-1.5 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                >
                  <span>Login</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-1">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-2 space-y-1 border-t border-gray-200 dark:border-dark-600">
              {userEmail ? (
                <>
                  <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-600 mb-1">
                    Signed in as <span className="font-medium text-gray-900 dark:text-white">{getUsername(userEmail)}</span>
                  </div>
                  
                  <NavLink to="/" icon={Layout}>Dashboard</NavLink>
                  <NavLink to="/licenses" icon={License}>Licenses</NavLink>
                  <NavLink to="/clients" icon={Users}>Clients</NavLink>
                  <NavLink to="/vendors" icon={Building2}>Vendors</NavLink>
                  <NavLink to="/reports" icon={PieChart}>Reports</NavLink>
                  <NavLink to="/notifications" icon={Bell}>Notifications</NavLink>
                  <NavLink to="/settings" icon={Settings}>Settings</NavLink>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-dark-600 mt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1.5 w-full px-2.5 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-1.5 w-full px-2.5 py-1.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors"
                >
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
