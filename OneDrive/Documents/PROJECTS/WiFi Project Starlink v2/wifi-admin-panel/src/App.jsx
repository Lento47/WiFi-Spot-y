import React from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import UserPage from './pages/UserPage.jsx';
import Spinner from './components/common/Spinner.jsx';
import { auth } from './firebase';

function App() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <AuthPage auth={auth} />;
  }

  return isAdmin ? <AdminPage user={user} /> : <UserPage user={user} />;
}

export default App;
