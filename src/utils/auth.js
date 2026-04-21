// Utility functions for handling JWT authentication tokens

const TOKEN_KEY = 'jwt_token';
const ROLE_KEY = 'user_role';
const TENANT_ID_KEY = 'tenant_id';

// Store token in localStorage
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Retrieve token from localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Store role in localStorage
export const setRole = (role) => {
  localStorage.setItem(ROLE_KEY, role);
};

// Retrieve role from localStorage
export const getRole = () => {
  return localStorage.getItem(ROLE_KEY);
};

// Remove role from localStorage
export const removeRole = () => {
  localStorage.removeItem(ROLE_KEY);
};

// Store tenantId in localStorage
export const setTenantId = (tenantId) => {
  localStorage.setItem(TENANT_ID_KEY, tenantId);
};

// Retrieve tenantId from localStorage
export const getTenantId = () => {
  return localStorage.getItem(TENANT_ID_KEY);
};

// Remove tenantId from localStorage
export const removeTenantId = () => {
  localStorage.removeItem(TENANT_ID_KEY);
};

// Decode JWT token (simple base64 decoding)
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, Date.now() in ms
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// Logout helper to clear all auth data
export const clearAuth = () => {
  removeToken();
  removeRole();
  removeTenantId();
};

// Check if user is authenticated and token is valid
export const isAuthenticated = () => {
  const token = getToken();
  return token && !isTokenExpired(token);
};
