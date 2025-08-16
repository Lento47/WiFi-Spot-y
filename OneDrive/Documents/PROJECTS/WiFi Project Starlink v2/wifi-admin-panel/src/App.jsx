import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UserPage from './pages/UserPage.jsx';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const Page = () => {
    if (!user) {
      return <AuthPage auth={auth} />;
    }
    return isAdmin ? <AdminPage user={user} /> : <UserPage user={user} />;
  }

  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

export default App;