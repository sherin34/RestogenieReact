import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getRole, clearAuth } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuth = isAuthenticated();
  const userRole = getRole();

  if (!isAuth) {
    // If not authenticated or token expired, clear and redirect
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If role is not allowed, redirect to a safe page (e.g. dashboard or home)
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the requested component
  return children;
};

export default ProtectedRoute;
