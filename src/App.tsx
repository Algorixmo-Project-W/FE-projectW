import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import WhatsAppSettings from './components/pages/WhatsAppSettings';
import Campaigns from './components/pages/Campaigns';
import Messages from './components/pages/Messages';
import Users from './components/pages/Users';
import Settings from './components/pages/Settings';
import Login from './components/pages/Login';
import './styles/dashboard-layout.css';
import './styles/dashboard-home.css';
import './styles/whatsapp-settings.css';
import './styles/campaigns.css';
import './styles/messages.css';
import './styles/users.css';
import './styles/settings.css';
import './styles/login.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardHome />} />
                    <Route path="/api-credentials" element={<WhatsAppSettings />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
