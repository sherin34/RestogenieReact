import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feedbacks');
      setFeedbacks(response.data);
    } catch (err) {
      showToast('Failed to load feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const renderStars = (rating) => {
    return (
      <div style={{ color: '#f59e0b', fontSize: '18px' }}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' }}>Customer Feedback</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Review what your customers are saying about your restaurant</p>
        </div>
        <button 
          onClick={fetchFeedbacks} 
          className="btn-secondary"
          style={{ padding: '10px 20px', borderRadius: '10px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '20px' }}></div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📝</div>
          <h2 style={{ margin: '0 0 8px 0' }}>No feedback yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Feedback from the QR ordering page will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {feedbacks.map((f) => (
            <div key={f.id} className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)' }}>
                    {f.customerName || 'Anonymous Customer'}
                  </div>
                  {f.mobileNumber && (
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📱 {f.mobileNumber}
                    </div>
                  )}
                </div>
                {renderStars(f.rating)}
              </div>
              
              <div style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                padding: '16px', 
                borderRadius: '12px', 
                fontSize: '15px', 
                lineHeight: '1.6',
                fontStyle: f.message ? 'normal' : 'italic',
                color: f.message ? 'var(--text-primary)' : 'var(--text-secondary)',
                flex: 1
              }}>
                {f.message || 'No written message provided.'}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {new Date(f.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
