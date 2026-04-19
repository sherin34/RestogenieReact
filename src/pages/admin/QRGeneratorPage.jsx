import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const QRGeneratorPage = () => {
  const { showToast } = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await api.get('/admin/tables');
        // Filter out ONLINE table as it's for internal POS use only
        const realTables = response.data.filter(t => t.tableName !== 'ONLINE');
        setTables(realTables);
      } catch (err) {
        showToast('Failed to fetch tables', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [showToast]);

  const getQRUrl = (tableName) => {
    const guestUrl = `${window.location.origin}/qr/${tableName}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestUrl)}`;
  };

  const handlePrint = (tableName) => {
    const qrImageUrl = getQRUrl(tableName);
    const guestUrl = `${window.location.origin}/qr/${tableName}`;
    
    // Create a hidden print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${tableName}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: 'Inter', system-ui, sans-serif; 
              text-align: center;
            }
            .qr-card {
              border: 2px solid #eee;
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }
            img { width: 250px; height: 250px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 32px; color: #111; }
            p { color: #666; font-size: 14px; margin-top: 8px; }
            .branding { margin-top: 40px; font-weight: 700; color: #ff385c; font-size: 18px; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="qr-card">
            <img src="${qrImageUrl}" alt="QR Code" />
            <h1>Table: ${tableName}</h1>
            <p>Scan to view Menu & Order</p>
            <div class="branding">🍽 RestoGenie</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async (tableName) => {
    try {
      const qrImageUrl = getQRUrl(tableName);
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_Code_${tableName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('QR Code downloaded!', 'success');
    } catch (err) {
      showToast('Failed to download image', 'error');
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>QR Code Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Generate, print, and download high-quality QR codes for your tables.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Gathering table data...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {tables.map(table => (
            <div key={table.id} className="card" style={{ padding: '20px', textAlign: 'center', transition: 'transform 0.2s ease' }}>
              <div style={{ 
                width: '100%', 
                aspectRatio: '1/1',
                backgroundColor: 'white', 
                margin: '0 auto 16px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
                padding: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img 
                  src={getQRUrl(table.tableName)} 
                  alt={`QR for ${table.tableName}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' }}>{table.tableName}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Capacity: {table.capacity}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '8px', fontSize: '13px' }}
                    onClick={() => window.open(`/qr/${table.tableName}`, '_blank')}
                  >
                    View
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={() => handlePrint(table.tableName)}
                  >
                    Print
                  </button>
                  <button 
                    className="btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={() => handleDownload(table.tableName)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🪑</div>
              <h3 style={{ margin: '0 0 10px 0' }}>No Tables Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                Once you add tables in the Admin panel, they will appear here with automatically generated QR codes.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .loader {
          border: 4px solid var(--border-color);
          border-top: 4px solid var(--primary-color);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QRGeneratorPage;
