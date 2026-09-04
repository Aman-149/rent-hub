import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { BrowsePropertiesPage } from './pages/BrowsePropertiesPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { MessagesPage } from './pages/MessagesPage';
import { LandlordDashboard } from './pages/LandlordDashboard';
import { AddEditPropertyPage } from './pages/AddEditPropertyPage';
import { RenterDashboard } from './pages/RenterDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserRole } from './types';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'landlord') return <Navigate to="/dashboard/landlord" replace />;
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    return <Navigate to="/dashboard/renter" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen font-sans antialiased text-zinc-900 bg-white selection:bg-emerald-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/properties" element={<BrowsePropertiesPage />} />
                <Route path="/properties/:id" element={<PropertyDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Common Protected Routes */}
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Landlord Specific Routes */}
                <Route
                  path="/dashboard/landlord"
                  element={
                    <ProtectedRoute allowedRoles={['landlord', 'admin']}>
                      <LandlordDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/properties/new"
                  element={
                    <ProtectedRoute allowedRoles={['landlord', 'admin']}>
                      <AddEditPropertyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/properties/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['landlord', 'admin']}>
                      <AddEditPropertyPage />
                    </ProtectedRoute>
                  }
                />

                {/* Renter Specific Route */}
                <Route
                  path="/dashboard/renter"
                  element={
                    <ProtectedRoute allowedRoles={['renter', 'admin']}>
                      <RenterDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Specific Route */}
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
