import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UserPage from './pages/UserPage.jsx';
import NetworkStatusPage from './pages/NetworkStatusPage.jsx';
import Spinner from './components/common/Spinner.jsx';
import { auth } from './firebase';
import Icon from './components/common/Icon.jsx';

// --- Theme Management ---
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Main App Component ---
function App() {
  const { user, isAdmin, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('main');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const Page = () => {
    // Public Network Status Page
    if (currentPage === 'network-status') {
      return (
        <div>
          <div className="bg-slate-800 text-white p-4">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">WiFi Admin Panel</h1>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentPage('main')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Volver al Login
                </button>
                <button 
                  onClick={() => setCurrentPage('network-status')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Estado de la Red
                </button>
              </div>
            </div>
          </div>
          <NetworkStatusPage />
        </div>
      );
    }





    // Main app with authentication
    if (!user) {
      return (
        <div>
          <div className="bg-slate-800 text-white p-4">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">WiFi Admin Panel</h1>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentPage('network-status')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Estado de la Red
                </button>
              </div>
            </div>
          </div>
          <AuthPage auth={auth} />
        </div>
      );
    }
    
    return (
      <div>
        <div className="bg-slate-800 text-white p-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">WiFi Admin Panel</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage('network-status')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Estado de la Red
              </button>
              <button 
                onClick={() => setCurrentPage('main')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {isAdmin ? 'Panel de Admin' : 'Panel de Usuario'}
              </button>
            </div>
          </div>
        </div>
        {isAdmin ? <AdminPage user={user} /> : <UserPage user={user} />}
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

export default App;