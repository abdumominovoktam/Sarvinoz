import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { I18nProvider } from './i18n/translations';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { RulesPage } from './pages/RulesPage';
import { DashboardPage } from './pages/DashboardPage';
import { GameArenaPage } from './pages/GameArenaPage';
import { FinalResultPage } from './pages/FinalResultPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireRules?: boolean;
  requireAdmin?: boolean;
}> = ({ children, requireRules = true, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FBFA] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#007A63] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRules && !user.profile?.rules_accepted && user.role !== 'admin') {
    return <Navigate to="/rules" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FBFA] text-[#17211F]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/rules"
            element={
              <ProtectedRoute requireRules={false}>
                <RulesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/play/:order"
            element={
              <ProtectedRoute>
                <GameArenaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/final-result"
            element={
              <ProtectedRoute>
                <FinalResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute requireAdmin={true} requireRules={false}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              user ? (
                user.profile?.rules_accepted ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/rules" replace />
                )
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
