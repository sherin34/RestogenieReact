import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../hooks/useOffline';
import MenuScanner from './MenuScanner';

const MenuItemManagement = () => {
  const { isReadOnly } = useOffline();
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
    onlinePrice: '',
    isAvailable: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

      setFormData({ name: '', price: '', categoryId: '', gstPercentage: '5', description: '', isOnlineAvailable: false, onlinePrice: '', isAvailable: true });
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
      onlinePrice: item.onlinePrice ? item.onlinePrice.toString() : '',
      isAvailable: item.isAvailable !== false
    });
    setSelectedFile(null);
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    if (isReadOnly) return;
    try {
      await api.put(`/admin/menu-items/${id}/availability`, { isAvailable: !currentStatus });
      showToast('Availability updated', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleMove = async (id, direction) => {
    try {
      await api.post(`/admin/menu-items/${id}/move`, { direction });
      fetchData();
    } catch (err) {
      showToast('Failed to change order', 'error');
    }
  };

  const groupedItems = categories.map(cat => ({
    ...cat,
    items: menuItems
      .filter(item => item.category?.id === cat.id)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  })).filter(cat => cat.items.length > 0);

  const uncategorizedItems = menuItems
    .filter(item => !item.category)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (uncategorizedItems.length > 0) {
    groupedItems.push({ id: 'none', name: 'Uncategorized', items: uncategorizedItems });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Menu Item Management</h2>
        <MenuScanner onScanSuccess={fetchData} />
      </div>
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
          <button type="submit" className="btn-primary" disabled={isSaving || isReadOnly} style={{ padding: '10px 24px' }}>
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
            <th style={{ padding: '12px 8px', width: '80px' }}>Order</th>
            <th style={{ padding: '12px 8px' }}>Name</th>
            <th style={{ padding: '12px 8px' }}>Base Price</th>
            <th style={{ padding: '12px 8px' }}>Online</th>
            <th style={{ padding: '12px 8px' }}>Availability</th>
            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groupedItems.map((group) => (
            <React.Fragment key={group.id}>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <td colSpan="6" style={{ padding: '8px 12px', fontWeight: '800', fontSize: '12px', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {group.name}
                </td>
              </tr>
              {group.items.map((item, index) => (
              <tr 
                key={item.id} 
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  opacity: item.isAvailable === false ? 0.6 : 1,
                  backgroundColor: item.isAvailable === false ? 'var(--bg-secondary)' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleMove(item.id, 'UP')} 
                      disabled={index === 0 || isReadOnly}
                      style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', fontSize: '18px', padding: '0 4px', color: index === 0 ? '#ccc' : 'var(--primary-color)' }}
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => handleMove(item.id, 'DOWN')} 
                      disabled={index === group.items.length - 1 || isReadOnly}
                      style={{ background: 'none', border: 'none', cursor: index === group.items.length - 1 ? 'default' : 'pointer', fontSize: '18px', padding: '0 4px', color: index === group.items.length - 1 ? '#ccc' : 'var(--primary-color)' }}
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.imageUrl && (
                      <img 
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${item.imageUrl}`} 
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
                <td style={{ padding: '12px 8px' }}>
                  <button 
                    onClick={() => handleToggleAvailability(item.id, item.isAvailable !== false)}
                    disabled={isReadOnly}
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      border: 'none', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      cursor: isReadOnly ? 'not-allowed' : 'pointer',
                      backgroundColor: item.isAvailable !== false ? '#dcfce7' : '#f1f5f9',
                      color: item.isAvailable !== false ? '#166534' : '#64748b',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.isAvailable !== false ? '● ENABLED' : '○ DISABLED'}
                  </button>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <button onClick={() => handleEdit(item)} className="btn-secondary" disabled={isReadOnly} style={{ padding: '4px 12px', fontSize: '13px' }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </React.Fragment>
          ))}
          {menuItems.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No items found.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default MenuItemManagement;
