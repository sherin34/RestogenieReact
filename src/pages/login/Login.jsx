import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { setToken, setRole, setTenantId, isAuthenticated, getRole } from '../../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    const role = getRole();
    if (isAuthenticated()) {
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'WAITER') navigate('/pos');
      else if (role === 'KITCHEN') navigate('/kitchen');
      else navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call the login API using Axios
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { token, role, tenantId } = response.data;

      // Store auth data
      setToken(token);
      if (role) setRole(role);
      if (tenantId) setTenantId(tenantId);

      // Redirect based on role
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'WAITER') {
        navigate('/pos');
      } else if (role === 'KITCHEN') {
        navigate('/kitchen');
      } else {
        // Fallback for unexpected roles
        navigate('/');
      }
    } catch (err) {
      // Show error message if login fails
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="username" style={{ fontWeight: '500', marginBottom: '5px', display: 'block' }}>Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" style={{ fontWeight: '500', marginBottom: '5px', display: 'block' }}>Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>Register</Link>
      </p>
    </div>
  );
};

export default Login;
