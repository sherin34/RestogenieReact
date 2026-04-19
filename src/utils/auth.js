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

// Logout helper to clear all auth data
export const clearAuth = () => {
  removeToken();
  removeRole();
  removeTenantId();
};
