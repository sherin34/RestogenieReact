import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';

const TablesManagement = () => {
  const { showToast } = useToast();
  const [tables, setTables] = useState([]);
  const [formData, setFormData] = useState({ tableName: '', capacity: '' });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const fetchTables = async () => {
    try {
      const response = await api.get('/admin/tables');
      setTables(response.data);
    } catch (err) {
      showToast('Failed to fetch tables', 'error');
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { ...formData, capacity: parseInt(formData.capacity, 10) };
      
      if (editingId) {
        await api.put(`/admin/tables/${editingId}`, payload);
        showToast('Table updated successfully', 'success');
      } else {
        await api.post('/admin/tables', payload);
        showToast('Table added successfully', 'success');
      }
      
      setFormData({ tableName: '', capacity: '' });
      setEditingId(null);
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (table) => {
    setEditingId(table.id);
    setFormData({ tableName: table.tableName, capacity: table.capacity });
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null });
    try {
      await api.delete(`/admin/tables/${id}`);
      showToast('Table deleted', 'success');
      fetchTables();
    } catch (err) {
      showToast('Failed to delete table', 'error');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Table Name</label>
          <input 
            type="text" 
            placeholder="e.g. T1" 
            value={formData.tableName} 
            onChange={(e) => setFormData({ ...formData, tableName: e.target.value })} 
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Capacity</label>
          <input 
            type="number" 
            placeholder="4" 
            value={formData.capacity} 
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} 
            min="1"
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '10px 20px' }}>
            {editingId ? 'Update' : 'Add Table'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setFormData({ tableName: '', capacity: '' }); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '12px 8px' }}>Name</th>
            <th style={{ padding: '12px 8px' }}>Capacity</th>
            <th style={{ padding: '12px 8px' }}>Status</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => (
            <tr key={table.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 8px', fontWeight: '500' }}>{table.tableName}</td>
              <td style={{ padding: '12px 8px' }}>{table.capacity} Persons</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  backgroundColor: table.active ? '#e6f4ea' : '#fce8e6',
                  color: table.active ? '#1e8e3e' : '#d93025'
                }}>
                  {table.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <button onClick={() => handleEdit(table)} className="btn-secondary" style={{ padding: '4px 12px', marginRight: '8px', fontSize: '13px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(table.id)} className="btn-danger" style={{ padding: '4px 12px', fontSize: '13px' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {tables.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No tables found. Add your first table above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      <ConfirmDialog 
        isOpen={deleteConfirm.show}
        title="Delete Table"
        message="Are you sure you want to delete this table? This will permanently remove it from the system."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
        confirmText="Confirm Delete"
      />
    </div>
  );
};

export default TablesManagement;
