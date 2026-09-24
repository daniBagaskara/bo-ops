import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPage } from './components/auth/AuthPage';
import { AppMainLayout } from './components/layout/AppMainLayout';
import { ToastContainer } from './components/ToastContainer';

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, logout, showToast } = useApp();

  // If not logged in: display direct login authentication page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        <AuthPage onLogin={(user) => setCurrentUser(user)} />
        <ToastContainer />
      </div>
    );
  }

  // Authenticated: Unified Operational System with Sidebar and strict RBAC
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <AppMainLayout
        currentUser={currentUser}
        onLogout={logout}
        showToast={showToast}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
