import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clearAuth, getRole } from '../utils/auth';
import api from '../services/api';

const Layout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('RestoGenie');
  const location = useLocation();
  const role = getRole();

  React.useEffect(() => {
    const fetchBranding = async () => {
      // Only fetch if logged in and on admin/staff routes
      if (role && !location.pathname.startsWith('/qr/')) {
        try {
          const res = await api.get('/admin/restaurant');
          setRestaurantName(res.data.name);
        } catch (err) {
          // Fallback to product name if fetch fails
          setRestaurantName('RestoGenie');
        }
      }
    };
    fetchBranding();
  }, [role, location.pathname]);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN'] },
    { to: '/reports', label: 'Reports', roles: ['ADMIN'] },
    { to: '/qr-codes', label: 'QR Codes', roles: ['ADMIN'] },
    { to: '/admin', label: 'Admin', roles: ['ADMIN'] },
    { to: '/pos', label: 'POS', roles: ['ADMIN', 'WAITER'] },
    { to: '/kitchen', label: 'Kitchen', roles: ['ADMIN', 'KITCHEN'] },
    { to: '/billing', label: 'Billing', roles: ['ADMIN', 'WAITER'] },
  ].filter(link => !link.roles || link.roles.includes(role));

  const isGuestPage = location.pathname.startsWith('/qr/');

  return (
    <>
      {!isGuestPage && (
        <nav className="nav-bar">
          {/* Logo / Restaurant Name */}
          <div style={{ 
            fontWeight: '800', 
            fontSize: '20px', 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.7px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px'
          }}>
            <span style={{ color: 'var(--primary-color)' }}>🍽</span> {restaurantName}
          </div>

          {/* Desktop nav links */}
          <ul className="nav-links" style={{ display: 'flex' }}>
            {navLinks.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  style={{
                    color: location.pathname === link.to ? 'var(--primary-color)' : 'var(--text-secondary)',
                    fontWeight: location.pathname === link.to ? '700' : '600',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop logout */}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '7px 14px' }}
          >
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: 'var(--text-primary)',
            }}
            className="hamburger-btn"
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </nav>
      )}

      {/* Mobile dropdown menu */}
      {!isGuestPage && menuOpen && (
        <div style={{
          background: 'var(--card-bg)',
          borderBottom: '1px solid var(--border-color)',
          padding: '8px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          position: 'sticky',
          top: 'var(--nav-height)',
          zIndex: 49,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '12px 8px',
                textDecoration: 'none',
                color: location.pathname === link.to ? 'var(--primary-color)' : 'var(--text-primary)',
                fontWeight: location.pathname === link.to ? '700' : '500',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '15px',
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ marginTop: '8px', padding: '12px', fontSize: '14px' }}
          >
            Logout
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-links, .nav-bar > .btn-secondary { display: none !important; }
          .hamburger-btn { display: block !important; }
        }
      `}</style>

      <main style={{ minHeight: isGuestPage ? '100vh' : 'calc(100vh - var(--nav-height) - 80px)' }}>{children}</main>

      {/* Global Footer - Only for non-guest pages */}
      {!isGuestPage && (
        <footer style={{
          padding: '32px 20px',
          textAlign: 'center',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto',
          backgroundColor: 'var(--bg-color)'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            &copy; {new Date().getFullYear()} {restaurantName}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.7 }}>
            Powered by <strong style={{ color: 'var(--primary-color)' }}>RestoGenie</strong>
          </div>
        </footer>
      )}
    </>
  );
};

export default Layout;
