import React, { useEffect, useState } from 'react';
import MaintenancePage from '../pages/MaintenancePage';

interface MaintenanceCheckerProps {
  children: React.ReactNode;
}

const MaintenanceChecker: React.FC<MaintenanceCheckerProps> = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkMaintenanceStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      // Check if user is Super Admin
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const superAdmin = user?.isSuperAdmin === true;
      setIsSuperAdmin(superAdmin);

      // Check maintenance status from API
      const response = await fetch('https://server.easyabaca.site/api/maintenance/status');
      const data = await response.json();
      
      setIsMaintenanceMode(data.maintenanceMode);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      setIsLoading(false);
    }
  };

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If maintenance mode is ON and user is NOT Super Admin
  if (isMaintenanceMode && !isSuperAdmin) {
    return <MaintenancePage onAdminLogin={() => window.location.href = '/'} />;
  }

  // Normal operation - show the app
  return <>{children}</>;
};

export default MaintenanceChecker;
