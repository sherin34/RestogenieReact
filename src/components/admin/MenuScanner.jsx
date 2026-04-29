import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const MenuScanner = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload an image (JPG/PNG) or a PDF file.', 'error');
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/menu-items/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showToast(`AI successfully imported ${response.data.count || 0} items!`, 'success');
      if (onScanSuccess) onScanSuccess();
    } catch (err) {
      console.error('Scan error:', err);
      showToast(err.response?.data?.message || 'Failed to scan menu. Please try again.', 'error');
    } finally {
      setIsScanning(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 24px',
          backgroundColor: '#6366f1', // Indigo color for AI features
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
          transition: 'all 0.2s',
          fontSize: '14px'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <span style={{ fontSize: '18px' }}>✨</span>
        {isScanning ? 'Scanning with AI...' : 'Scan Physical Menu (AI)'}
      </button>

      {isScanning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '24px'
          }}></div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>AI Menu Scanner</h2>
          <p style={{ opacity: 0.8, fontSize: '16px' }}>Reading your physical menu items and categories...</p>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default MenuScanner;
