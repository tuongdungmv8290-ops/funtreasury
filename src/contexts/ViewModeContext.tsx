import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ViewModeContextType {
  isViewOnly: boolean;
  enterViewMode: () => void;
  exitViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isViewOnly, setIsViewOnly] = useState(() => {
    return sessionStorage.getItem('viewOnlyMode') === 'true';
  });

  const enterViewMode = () => {
    sessionStorage.setItem('viewOnlyMode', 'true');
    setIsViewOnly(true);
  };

  const exitViewMode = () => {
    sessionStorage.removeItem('viewOnlyMode');
    setIsViewOnly(false);
  };

  return (
    <ViewModeContext.Provider value={{ isViewOnly, enterViewMode, exitViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};
