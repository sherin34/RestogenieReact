import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'WAITER'
  });
  const [issubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/staff');
      setStaff(response.data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      showToast('Could not load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/staff/${id}/toggle-status`);
      showToast('Staff status updated', 'success');
      fetchStaff();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/admin/staff/${id}`);
      showToast('Staff removed successfully', 'success');
      fetchStaff();
    } catch (err) {
      showToast('Failed to remove staff', 'error');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/staff', formData);
      showToast('Staff created successfully', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', username: '', password: '', role: 'WAITER' });
      fetchStaff();
    } catch (err) {
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || 'Failed to create staff';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    const styles = {
      ADMIN: { bg: '#fee2e2', text: '#991b1b' },
      WAITER: { bg: '#dcfce7', text: '#166534' },
      KITCHEN: { bg: '#e0e7ff', text: '#3730a3' },
      POS: { bg: '#ffedd5', text: '#9a3412' }
    };
    const style = styles[role] || { bg: '#f3f4f6', text: '#374151' };
    return {
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.text,
      display: 'inline-block'
    };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your restaurant team and their access roles.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={fetchStaff} 
            disabled={loading}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            🔄 Refresh
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            + Add Staff
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading staff data...
          </div>
        ) : staff.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No staff members found.
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>NAME</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>USERNAME</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>ROLE</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', fontSize: '13px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{member.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{member.username}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={getRoleBadgeStyle(member.role)}>{member.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px' }}>
                        <input 
                          type="checkbox" 
                          checked={member.active !== false} 
                          onChange={() => handleToggleStatus(member.id)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', inset: 0,
                          backgroundColor: member.active !== false ? 'var(--success-color)' : '#cbd5e1',
                          borderRadius: '18px', transition: '.4s'
                        }}>
                          <span style={{
                            position: 'absolute', height: '12px', width: '12px', left: member.active !== false ? '18px' : '4px', bottom: '3px',
                            backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
                          }} />
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteStaff(member.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#ef4444' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '90%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Add New Staff</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>
            
            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>FULL NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>USERNAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. john_waiter"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>PASSWORD</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>ROLE</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                >
                  <option value="WAITER">Waiter</option>
                  <option value="KITCHEN">Kitchen</option>
                  <option value="POS">POS Terminal</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={issubmitting} style={{ flex: 1 }}>{issubmitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
