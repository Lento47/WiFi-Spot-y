import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, memo } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UserPage from './pages/UserPage.jsx';
import NetworkStatusPage from './pages/NetworkStatusPage.jsx';
import Spinner from './components/common/Spinner.jsx';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import Icon from './components/common/Icon.jsx';
import AIChatbot from './components/common/AIChatbot.jsx';
import PerformanceMonitor from './components/common/PerformanceMonitor.jsx';

// --- Theme Management ---
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = memo(({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Use lazy initialization to avoid localStorage access on every render
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Memoize theme toggle function
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme, toggleTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Debounce localStorage updates
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});

ThemeProvider.displayName = 'ThemeProvider';

// Memoize the header component to prevent re-renders
const AppHeader = memo(({ theme, toggleTheme, onPageChange, currentPage }) => (
  <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Icon 
            path="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
            className="w-6 h-6 text-blue-600" 
          />
          <span className="text-xl font-bold text-gray-800 dark:text-white">WiFi Costa Rica</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button 
            onClick={() => onPageChange(currentPage === 'network-status' ? 'main' : 'network-status')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            {currentPage === 'network-status' ? 'Volver al Login' : 'Estado de la Red'}
          </button>
        </div>
      </div>
    </div>
  </div>
));

AppHeader.displayName = 'AppHeader';

// Memoize the loading spinner
const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Cargando...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// --- Main App Component ---
function App() {
  const { user, isAdmin, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('main');
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(import.meta.env.DEV);

  // Memoize page change handler
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Memoize the current page component
  const CurrentPageComponent = useMemo(() => {
    if (currentPage === 'network-status') {
      return NetworkStatusPage;
    }
    if (!user) {
      return AuthPage;
    }
    return isAdmin ? AdminPage : UserPage;
  }, [currentPage, user, isAdmin]);

  // Performance monitor toggle
  const togglePerformanceMonitor = useCallback(() => {
    setShowPerformanceMonitor(prev => !prev);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const Page = () => {
    const { theme, toggleTheme } = useTheme();
    
    // Public Network Status Page
    if (currentPage === 'network-status') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <AppHeader 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onPageChange={handlePageChange}
            currentPage={currentPage}
          />
          <NetworkStatusPage />
        </div>
      );
    }

    // Main app with authentication
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <AppHeader 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onPageChange={handlePageChange}
            currentPage={currentPage}
          />
          <AuthPage auth={auth} />
        </div>
      );
    }
    
    // Authenticated user - render appropriate page
    return <CurrentPageComponent />;
  };

  return (
    <ThemeProvider>
      <Page />
      
      {/* Performance Monitor - Only in development */}
      {import.meta.env.DEV && (
        <PerformanceMonitor 
          isVisible={showPerformanceMonitor}
          onToggle={togglePerformanceMonitor}
        />
      )}
      
      {/* Performance Monitor Toggle Button - Only in development */}
      {import.meta.env.DEV && (
        <button
          onClick={togglePerformanceMonitor}
          className="fixed bottom-4 left-4 z-50 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
          title="Toggle Performance Monitor"
        >
          📊
        </button>
      )}
    </ThemeProvider>
  );
}

export default memo(App);