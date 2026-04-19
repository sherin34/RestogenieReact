import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';

const CategoryManagement = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data);
    } catch (err) {
      showToast('Failed to fetch categories', 'error');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, { name });
        showToast('Category updated!', 'success');
      } else {
        await api.post('/admin/categories', { name });
        showToast('Category added!', 'success');
      }
      setName('');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null });
    try {
      await api.delete(`/admin/categories/${id}`);
      showToast('Category deleted', 'success');
      fetchCategories();
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Category Name</label>
          <input 
            type="text" 
            placeholder="e.g. Main Course, Beverages" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn-primary" disabled={isSaving} style={{ padding: '10px 20px' }}>
            {editingId ? 'Update Category' : 'Add Category'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setName(''); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '12px 8px' }}>Category Name</th>
            <th style={{ padding: '12px 8px' }}>Status</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 8px', fontWeight: '500' }}>{cat.name}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  backgroundColor: cat.active ? '#e6f4ea' : '#fce8e6',
                  color: cat.active ? '#1e8e3e' : '#d93025'
                }}>
                  {cat.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <button onClick={() => handleEdit(cat)} className="btn-secondary" style={{ padding: '4px 12px', marginRight: '8px', fontSize: '13px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(cat.id)} className="btn-danger" style={{ padding: '4px 12px', fontSize: '13px' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      <ConfirmDialog 
        isOpen={deleteConfirm.show}
        title="Delete Category"
        message="Are you sure you want to delete this category? All menu items assigned to this category will become uncategorized."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
        confirmText="Confirm Delete"
      />
    </div>
  );
};

export default CategoryManagement;
