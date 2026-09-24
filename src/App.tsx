import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPage } from './components/auth/AuthPage';
import { BmWelcomeDashboard } from './components/bm/BmWelcomeDashboard';
import { SuperadminDashboard } from './components/superadmin/SuperadminDashboard';
import { ToastContainer } from './components/ToastContainer';

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, logout, showToast } = useApp();

  // If not logged in: display direct login & registration authentication page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        <AuthPage onLogin={(user) => setCurrentUser(user)} />
        <ToastContainer />
      </div>
    );
  }

  // If Branch Manager logged in: strictly show welcome greeting only (no features)
  if (currentUser.role === 'branch_manager') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <BmWelcomeDashboard
          currentUser={currentUser}
          onLogout={logout}
        />
        <ToastContainer />
      </div>
    );
  }

  // If Superadmin logged in: show Superadmin Management Console (CRUD & Database Operations)
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      <SuperadminDashboard
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
