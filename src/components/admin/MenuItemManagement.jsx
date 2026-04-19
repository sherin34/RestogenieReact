import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';

const MenuItemManagement = () => {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    gstPercentage: '5',
    description: '',
    isOnlineAvailable: false,
    onlinePrice: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.get('/admin/menu-items'),
        api.get('/admin/categories')
      ]);
      setMenuItems(itemsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      showToast('Failed to fetch data', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId, 10),
        gstPercentage: parseFloat(formData.gstPercentage),
        onlinePrice: formData.isOnlineAvailable && formData.onlinePrice ? parseFloat(formData.onlinePrice) : null
      };

      const data = new FormData();
      data.append('item', new Blob([JSON.stringify(itemData)], { type: 'application/json' }));
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingId) {
        await api.put(`/admin/menu-items/${editingId}`, data, config);
        showToast('Item updated successfully', 'success');
      } else {
        await api.post('/admin/menu-items', data, config);
        showToast('Item added successfully', 'success');
      }

      setFormData({ name: '', price: '', categoryId: '', gstPercentage: '5', description: '', isOnlineAvailable: false, onlinePrice: '' });
      setSelectedFile(null);
      setEditingId(null);
      // Reset file input
      const fileInput = document.getElementById('menu-item-image');
      if (fileInput) fileInput.value = '';
      
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      categoryId: item.category?.id?.toString() || '',
      gstPercentage: item.gstPercentage.toString(),
      description: item.description || '',
      isOnlineAvailable: item.isOnlineAvailable || false,
      onlinePrice: item.onlinePrice ? item.onlinePrice.toString() : ''
    });
    setSelectedFile(null);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null });
    try {
      await api.delete(`/admin/menu-items/${id}`);
      showToast('Item deleted', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div className="form-grid-4">
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Item Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Price (₹)</label>
            <input 
              type="number" 
              step="0.01"
              value={formData.price} 
              onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
              required
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Category</label>
            <select 
              value={formData.categoryId} 
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} 
              required
              style={{ width: '100%', padding: '10px' }}
            >
              <option value="" disabled>Select</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>GST %</label>
            <input 
              type="number" 
              step="0.1"
              value={formData.gstPercentage} 
              onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })} 
              required
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end', padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={formData.isOnlineAvailable}
              onChange={(e) => setFormData({ ...formData, isOnlineAvailable: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Available for Online Orders</span>
          </label>

          <div style={{ opacity: formData.isOnlineAvailable ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>ONLINE PRICE (₹)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="Leave empty for same price"
              disabled={!formData.isOnlineAvailable}
              value={formData.onlinePrice} 
              onChange={(e) => setFormData({ ...formData, onlinePrice: e.target.value })} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Description (Optional)</label>
            <input 
              type="text" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Item Image</label>
            <input 
              id="menu-item-image"
              type="file" 
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={isSaving} style={{ padding: '10px 24px' }}>
            {editingId ? 'Update Item' : 'Add Item'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setFormData({ name: '', price: '', categoryId: '', gstPercentage: '5', description: '', isOnlineAvailable: false, onlinePrice: '' }); setSelectedFile(null); }} style={{ padding: '10px 20px' }}>
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
            <th style={{ padding: '12px 8px' }}>Category</th>
            <th style={{ padding: '12px 8px' }}>Base Price</th>
            <th style={{ padding: '12px 8px' }}>Online</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.imageUrl && (
                    <img 
                      src={`http://localhost:8080${item.imageUrl}`} 
                      alt={item.name} 
                      style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} 
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.description}</div>}
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 8px' }}>{item.category?.name || 'Uncategorized'}</td>
              <td style={{ padding: '12px 8px' }}>
                <div style={{ fontWeight: '500' }}>₹{parseFloat(item.price).toFixed(2)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>GST: {item.gstPercentage}%</div>
              </td>
              <td style={{ padding: '12px 8px' }}>
                {item.isOnlineAvailable ? (
                  <div>
                    <span style={{ color: '#10B981', fontWeight: '700', fontSize: '12px' }}>🟢 YES</span>
                    {item.onlinePrice && <div style={{ fontSize: '11px', fontWeight: '600' }}>₹{item.onlinePrice.toFixed(2)}</div>}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>⚪ NO</span>
                )}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                <button onClick={() => handleEdit(item)} className="btn-secondary" style={{ padding: '4px 12px', marginRight: '8px', fontSize: '13px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '4px 12px', fontSize: '13px' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {menuItems.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No items found.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      <ConfirmDialog 
        isOpen={deleteConfirm.show}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This will remove it from all menus permanently."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
        confirmText="Confirm Delete"
      />
    </div>
  );
};

export default MenuItemManagement;
