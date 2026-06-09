import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import JobDetail from './pages/JobDetail';
import Apply from './pages/Apply';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminJobs from './pages/AdminJobs';
import AdminApplications from './pages/AdminApplications';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/job/:id" element={<PublicLayout><JobDetail /></PublicLayout>} />
          <Route path="/apply/:id" element={<PublicLayout><Apply /></PublicLayout>} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute><AdminJobs /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute><AdminApplications /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
