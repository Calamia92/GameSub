import React, { createContext, useContext, useState } from 'react';
import Snackbar from '../components/Snackbar';

const SnackbarContext = createContext();

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showSnackbar = (message, type = 'info', duration = 4000) => {
    setSnackbar({
      isOpen: true,
      message,
      type,
      duration
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const showSuccess = (message, duration) => showSnackbar(message, 'success', duration);
  const showError = (message, duration) => showSnackbar(message, 'error', duration);
  const showWarning = (message, duration) => showSnackbar(message, 'warning', duration);
  const showInfo = (message, duration) => showSnackbar(message, 'info', duration);

  return (
    <SnackbarContext.Provider value={{
      showSnackbar,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideSnackbar
    }}>
      {children}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={hideSnackbar}
        duration={snackbar.duration}
      />
    </SnackbarContext.Provider>
  );
};

export default SnackbarContext;