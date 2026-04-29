import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../hooks/useOffline';

const BrandingSettings = () => {
  const { showToast } = useToast();
  const { isReadOnly } = useOffline();
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    primaryColor: '#007BFF',
    instagramUrl: '',
    whatsappNumber: '',
    facebookUrl: '',
    welcomeMessage: '',
    logoUrl: null,
    bannerUrl: null,
    useDefaultBanner: true
  });
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await api.get('/admin/branding');
      if (response.data) {
        setBranding({
          ...response.data,
          primaryColor: response.data.primaryColor || '#007BFF',
          useDefaultBanner: response.data.useDefaultBanner ?? true
        });
        if (response.data.logoUrl) {
          setPreviewLogo(`${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${response.data.logoUrl}`);
        }
        if (response.data.bannerUrl) {
          setPreviewBanner(`${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${response.data.bannerUrl}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch branding:', err);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogo(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBanner(file);
      setPreviewBanner(URL.createObjectURL(file));
      setBranding({ ...branding, useDefaultBanner: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      const config = {
        primaryColor: branding.primaryColor,
        instagramUrl: branding.instagramUrl,
        whatsappNumber: branding.whatsappNumber,
        facebookUrl: branding.facebookUrl,
        welcomeMessage: branding.welcomeMessage,
        useDefaultBanner: branding.useDefaultBanner
      };

      formData.append('config', new Blob([JSON.stringify(config)], { type: 'application/json' }));
      if (selectedLogo) formData.append('logo', selectedLogo);
      if (selectedBanner) formData.append('banner', selectedBanner);

      await api.put('/admin/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Branding updated successfully', 'success');
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    } catch (err) {
      showToast('Failed to update branding', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Customize your restaurant's digital presence. These settings will be reflected on your QR ordering page and POS.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Logo Section */}
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '700' }}>Restaurant Logo</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '12px', 
              border: '2px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              {previewLogo ? (
                <img src={previewLogo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '24px', opacity: 0.3 }}>🖼️</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange}
                disabled={isReadOnly}
                style={{ marginBottom: '8px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Recommended: Square image, PNG or SVG with transparent background.
              </p>
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '700' }}>Menu Banner Image</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>
              <input 
                type="checkbox" 
                checked={branding.useDefaultBanner}
                onChange={(e) => {
                  setBranding({ ...branding, useDefaultBanner: e.target.checked });
                  if (e.target.checked) {
                    setPreviewBanner(null);
                    setSelectedBanner(null);
                  }
                }}
                disabled={isReadOnly}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Use Default Premium Banner
            </label>
          </div>
          
          <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', height: '160px', backgroundColor: '#f1f5f9', border: '1px solid var(--border-color)', position: 'relative' }}>
            {branding.useDefaultBanner ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img src="/default-banner.png" alt="Default Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <span style={{ color: 'white', fontWeight: '800', fontSize: '14px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>PREMIUM DEFAULT ACTIVE</span>
                </div>
              </div>
            ) : previewBanner ? (
              <img src={previewBanner} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '32px' }}>🖼️</span>
                <p style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>No custom banner uploaded</p>
              </div>
            )}
          </div>

          {!branding.useDefaultBanner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerChange}
                disabled={isReadOnly}
                style={{ flex: 1 }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, maxWidth: '200px' }}>
                Recommended: 1200x400px.
              </p>
            </div>
          )}
        </div>

        {/* Theme Section */}
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '700' }}>Theme & Colors</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Primary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="color" 
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  disabled={isReadOnly}
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    padding: '0', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                />
                <input 
                  type="text" 
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  disabled={isReadOnly}
                  style={{ 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    width: '100px',
                    fontSize: '14px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <div style={{ 
                height: '40px', 
                backgroundColor: branding.primaryColor, 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '13px',
                transition: 'background-color 0.2s'
              }}>
                Button Preview
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '700' }}>Social Media & Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Instagram Profile URL</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E4405F' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </span>
                <input 
                  type="url" 
                  placeholder="https://instagram.com/yourhandle"
                  value={branding.instagramUrl}
                  onChange={(e) => setBranding({ ...branding, instagramUrl: e.target.value })}
                  disabled={isReadOnly}
                  style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>WhatsApp Number (for support/orders)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="e.g. +919876543210"
                  value={branding.whatsappNumber}
                  onChange={(e) => setBranding({ ...branding, whatsappNumber: e.target.value })}
                  disabled={isReadOnly}
                  style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Welcome Message (Digital Menu Header)</label>
              <textarea 
                placeholder="e.g. Welcome to our fine dining experience!"
                value={branding.welcomeMessage}
                onChange={(e) => setBranding({ ...branding, welcomeMessage: e.target.value })}
                disabled={isReadOnly}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || isReadOnly}
            style={{ padding: '12px 32px', fontSize: '16px', fontWeight: '700' }}
          >
            {loading ? 'Saving Changes...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandingSettings;
