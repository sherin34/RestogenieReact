import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useRazorpay } from '../../hooks/useRazorpay';

const SubscriptionManagement = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('MONTHLY');
  const { handlePayment, loading: paymentLoading } = useRazorpay();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/subscription/status');
        setStatus(res.data);
      } catch (err) {
        console.error("Failed to fetch subscription status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return <p>Loading subscription details...</p>;

  const isExpired = status?.validTill ? new Date() > new Date(status.validTill) : true;

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ 
        padding: '24px', 
        borderRadius: '12px', 
        backgroundColor: isExpired ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: isExpired ? '#991b1b' : '#166534' }}>
          {isExpired ? '🔴 Subscription Expired' : '🟢 Subscription Active'}
        </h3>
        
        <div style={{ display: 'grid', gap: '12px', fontSize: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Current Plan:</span>
            <span style={{ fontWeight: '600' }}>Standard Plan</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Valid Until:</span>
            <span style={{ fontWeight: '600' }}>
              {status?.validTill ? new Date(status.validTill).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0' }}>Renew or Extend Subscription</h4>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          Get unlimited access to POS, Kitchen Display, and Reports. Choose a plan to continue using RestoGenie.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div 
            onClick={() => setSelectedPlan('MONTHLY')}
            style={{ 
              padding: '20px', 
              border: `2px solid ${selectedPlan === 'MONTHLY' ? 'var(--primary-color)' : 'var(--border-color)'}`, 
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: selectedPlan === 'MONTHLY' ? '#eff6ff' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>Monthly Plan</div>
              <div style={{ fontSize: '13px', color: '#1d4ed8' }}>Full feature access for 1 month</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)' }}>₹1</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>per month</div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedPlan('YEARLY')}
            style={{ 
              padding: '20px', 
              border: `2px solid ${selectedPlan === 'YEARLY' ? 'var(--primary-color)' : 'var(--border-color)'}`, 
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: selectedPlan === 'YEARLY' ? '#eff6ff' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>Yearly Plan</div>
              <div style={{ fontSize: '13px', color: '#1d4ed8' }}>Full feature access for 1 year</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)' }}>₹2</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>per year</div>
            </div>
          </div>
        </div>

        <button 
          className="btn-primary"
          onClick={() => handlePayment(selectedPlan)}
          disabled={paymentLoading || !selectedPlan}
          style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '16px', fontWeight: '700' }}
        >
          {paymentLoading ? 'Processing...' : `Pay Now (₹${selectedPlan === 'YEARLY' ? '2' : '1'})`}
        </button>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>PAYMENT SECURED BY RAZORPAY</h4>
        <div style={{ display: 'flex', gap: '12px', opacity: 0.6 }}>
          {/* Razorpay badges can be added here */}
          <span style={{ fontSize: '12px' }}>🔒 SSL Encrypted</span>
          <span style={{ fontSize: '12px' }}>💳 All cards & UPI accepted</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
