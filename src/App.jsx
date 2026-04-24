import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute, DeveloperRoute, GuestRoute } from './components/ProtectedRoute';

// Route Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DeveloperApplyPage from './pages/auth/DeveloperApplyPage';
import ApprovedDeveloperPage from './pages/auth/ApprovedDeveloperPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import EditorPage from './pages/editor/EditorPage';
import ViewerPage from './pages/viewer/ViewerPage';
import AdminPage from './pages/admin/AdminPage';
import AdminActionPage from './pages/admin/AdminActionPage';
import CollabEditorPage from './pages/collab/CollabEditorPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="page">
          <Navbar />
          <div className="page-content">
            <Routes>
              {/* Public / Guest Routes */}
              <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/oauth/callback" element={<GuestRoute><OAuthCallbackPage /></GuestRoute>} />
              <Route path="/apply" element={<GuestRoute><DeveloperApplyPage /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
              <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

              {/* Developer registration — no GuestRoute guard (email link can arrive while tokens exist) */}
              <Route path="/register-developer" element={<ApprovedDeveloperPage />} />
              <Route path="/admin/login" element={<GuestRoute><AdminLoginPage /></GuestRoute>} />

              {/* Protected Routes — any logged-in user */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
              <Route path="/viewer" element={<ProtectedRoute><ViewerPage /></ProtectedRoute>} />

              {/* Developer-only Routes */}
              <Route path="/editor" element={<DeveloperRoute><EditorPage /></DeveloperRoute>} />
              <Route path="/collab" element={<DeveloperRoute><CollabEditorPage /></DeveloperRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/admin/action" element={<AdminRoute><AdminActionPage /></AdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
