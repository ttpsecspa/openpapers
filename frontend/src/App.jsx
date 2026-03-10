import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import HomePage from './pages/public/HomePage';
import CFPPage from './pages/public/CFPPage';
import SubmitPage from './pages/public/SubmitPage';
import TrackStatusPage from './pages/public/TrackStatusPage';
import LoginPage from './pages/public/LoginPage';
import OverviewPage from './pages/dashboard/OverviewPage';
import SubmissionsPage from './pages/dashboard/SubmissionsPage';
import SubmissionDetailPage from './pages/dashboard/SubmissionDetailPage';
import ReviewsPage from './pages/dashboard/ReviewsPage';
import ReviewFormPage from './pages/dashboard/ReviewFormPage';
import UsersPage from './pages/dashboard/UsersPage';
import ConferencesPage from './pages/dashboard/ConferencesPage';
import ConferenceFormPage from './pages/dashboard/ConferenceFormPage';
import EmailLogPage from './pages/dashboard/EmailLogPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/ui/LoadingSpinner';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cfp/:slug" element={<CFPPage />} />
        <Route path="/enviar/:slug" element={<SubmitPage />} />
        <Route path="/estado" element={<TrackStatusPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="submissions" element={<SubmissionsPage />} />
        <Route path="submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="reviews/:submissionId" element={<ReviewFormPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="conferences" element={<ConferencesPage />} />
        <Route path="conferences/new" element={<ConferenceFormPage />} />
        <Route path="conferences/:id/edit" element={<ConferenceFormPage />} />
        <Route path="email-log" element={<EmailLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
