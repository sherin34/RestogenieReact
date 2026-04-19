import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const BillingSettings = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    address: '',
    phone: '',
    gstNumber: '',
    footerMessage: '',
    printerType: 'THERMAL_80MM',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/billing-settings');
        setForm({
          shopName: res.data.shopName || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          gstNumber: res.data.gstNumber || '',
          footerMessage: res.data.footerMessage || '',
          printerType: res.data.printerType || 'THERMAL_80MM',
        });
      } catch (err) {
        // 404 / not yet configured is fine — form stays blank
        if (err.response?.status !== 404) {
          showToast('Could not load billing settings', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/admin/billing-settings', form);
      showToast('Billing settings saved!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading billing settings...</p>;

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '800px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
      {[
        { label: 'Shop / Restaurant Name', name: 'shopName', placeholder: 'e.g. The Rustic Spoon', required: true },
        { label: 'Address', name: 'address', placeholder: 'Street, City' },
        { label: 'Phone Number', name: 'phone', placeholder: '+91 99999 99999' },
        { label: 'GST Number', name: 'gstNumber', placeholder: 'e.g. 22ABCDE1234F1Z5' },
        { label: 'Bill Footer Message', name: 'footerMessage', placeholder: 'e.g. Thank you for visiting!' },
      ].map(({ label, name, placeholder, required }) => (
        <div key={name}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '14px' }}>
            {label}
          </label>
          <input
            type="text"
            name={name}
            value={form[name]}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              boxSizing: 'border-box',
              fontSize: '14px',
            }}
          />
        </div>
      ))}

      <div key="printerType">
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '14px' }}>
          Printer Type
        </label>
        <select
          name="printerType"
          value={form.printerType}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            boxSizing: 'border-box',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="THERMAL_80MM">Thermal Printer (80mm)</option>
          <option value="THERMAL_58MM">Thermal Printer (58mm)</option>
          <option value="A4">A4 / Letter</option>
        </select>
      </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={isSaving}
        style={{ alignSelf: 'flex-start', padding: '10px 24px', marginTop: '4px' }}
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

export default BillingSettings;
