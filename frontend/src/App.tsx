import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import HomePage from './pages/HomePage';
import { FarmerAuth } from './Auth/FarmerAuth';
import { BuyerAuth } from './Auth/BuyerAuth';
import { CUSAFAAuth } from './Auth/CUSAFAAuth';
import { OfficerAuth } from './Auth/OfficerAuth';
import MAOComponent from './components/MAO/MAOComponent';
import AssociationComponent from './components/Association/AssociationComponent';
import FarmersComponent from './components/Farmers/FarmersComponent';
import BuyersComponent from './components/Buyers/BuyersComponent';
import { validateAuthData, initActivityTracking } from './utils/authToken';
import MaintenanceChecker from './components/MaintenanceChecker';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

// ... rest of the code remains the same ...
// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredUserType?: string }> = ({
  children,
  requiredUserType
}) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userType, setUserType] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    const type = localStorage.getItem('userType');

    if (token && user && type) {
      setIsAuthenticated(true);
      setUserType(type);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to homepage for farmers/buyers, MAO login for others
    const redirectPath = userType === 'farmer' || userType === 'buyer' ? '/' : '/mao';
    return <Navigate to={redirectPath} replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to homepage for farmers/buyers, MAO login for others
    const redirectPath = userType === 'farmer' || userType === 'buyer' ? '/' : '/mao';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// Dashboard Component
const Dashboard: React.FC = () => {
  const [userType, setUserType] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Use validation function to ensure auth data consistency
    const { isValid, userType: validatedUserType } = validateAuthData();

    console.log('Dashboard - Auth validation:', { isValid, userType: validatedUserType });

    if (isValid && validatedUserType) {
      setUserType(validatedUserType);
    } else {
      console.warn('Dashboard - Invalid auth data, will redirect to login');
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    // Get user type before clearing localStorage
    const currentUserType = localStorage.getItem('userType');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');

    // Redirect based on user type
    if (currentUserType === 'farmer' || currentUserType === 'buyer' || currentUserType === 'association_officer') {
      navigate('/'); // Redirect farmers, buyers, and association officers to homepage
    } else {
      navigate('/mao'); // Redirect MAO officers to MAO login
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userType === 'officer') {
    return <MAOComponent />;
  }

  if (userType === 'association_officer') {
    return <AssociationComponent />;
  }

  if (userType === 'farmer') {
    return <FarmersComponent onLogout={handleLogout} />;
  }

  if (userType === 'buyer') {
    return <BuyersComponent onLogout={handleLogout} />;
  }

  // If no valid userType found, redirect to home
  console.log('Dashboard - No valid userType found, redirecting to home. UserType:', userType);
  return <Navigate to="/" replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = (role: string) => {
    if (role === 'farmer') {
      navigate('/farmer-login');
    } else if (role === 'buyer') {
      navigate('/buyer-login');
    } else if (role === 'cusafa') {
      navigate('/cusafa-login');
    } else if (role === 'association') {
      navigate('/association-login');
    }
  };

  const handleLoginSuccess = () => {
    console.log('Login success - navigating to dashboard');
    navigate('/dashboard');
  };

  return (
    <Routes>
      {/* Public Routes - WITH reCAPTCHA */}
      <Route
        path="/"
        element={
          <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
            <HomePage onLoginClick={handleLoginClick} />
          </GoogleReCaptchaProvider>
        }
      />

      {/* Authentication Routes - WITH reCAPTCHA */}
      <Route
        path="/farmer-login"
        element={
          <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
            <FarmerAuth
              onBack={() => navigate('/')}
              onLoginSuccess={handleLoginSuccess}
            />
          </GoogleReCaptchaProvider>
        }
      />

      <Route
        path="/buyer-login"
        element={
          <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
            <BuyerAuth
              onBack={() => navigate('/')}
              onLoginSuccess={handleLoginSuccess}
            />
          </GoogleReCaptchaProvider>
        }
      />

      <Route
        path="/cusafa-login"
        element={
          <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
            <CUSAFAAuth
              onBack={() => navigate('/')}
              onLoginSuccess={handleLoginSuccess}
            />
          </GoogleReCaptchaProvider>
        }
      />

      {/* Secure Officer Login Route - WITH reCAPTCHA */}
      <Route
        path="/mao"
        element={
          <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
            <OfficerAuth onBack={() => { }} onLoginSuccess={handleLoginSuccess} />
          </GoogleReCaptchaProvider>
        }
      />

      {/* Protected Dashboard Route - NO reCAPTCHA */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  // Initialize activity tracking on app load
  React.useEffect(() => {
    initActivityTracking();
    console.log('✅ Activity tracking initialized - 40 min inactivity timeout');
  }, []);

  return (
    <MaintenanceChecker>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </MaintenanceChecker>
  );
};

export default App;