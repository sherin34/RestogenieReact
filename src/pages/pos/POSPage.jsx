import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { getRole } from '../../utils/auth';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../hooks/useOffline';

const CartPanel = ({ cartItems, totalBill, updateCartQuantity, isPlacingOrder, onPlaceOrder, selectedTable, expanded, setExpanded, showHotkeys }) => {
  const totalQty = cartItems.reduce((a, i) => a + i.quantity, 0);

  if (cartItems.length === 0) return null;

  return (
    <div 
      className="mobile-cart-panel"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'var(--card-bg)',
        boxShadow: '0 -4px 25px rgba(0,0,0,0.15)',
        zIndex: 150,
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: expanded ? '85vh' : 'auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Collapsed Bar / Trigger */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-color)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '700'
          }}>
            {totalQty}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>
              {expanded ? 'Review Order' : 'View Order'}
            </span>
            {!expanded && selectedTable && (
              <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600' }}>
                {selectedTable.tableName}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>
            ₹{totalBill.toFixed(2)}
          </span>
          <span style={{ 
            fontSize: '12px', 
            transition: 'transform 0.3s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>▲</span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Dining at</span>
              <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{selectedTable?.tableName || 'No Table Selected'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cartItems.map((item) => (
              <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>₹{parseFloat(item.price).toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateCartQuantity(item.itemId, -1)} className="btn-secondary" style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.itemId, 1)} className="btn-secondary" style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <div style={{ minWidth: '60px', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>Grand Total</span>
              <span style={{ fontWeight: '900', fontSize: '22px', color: 'var(--primary-color)' }}>₹{totalBill.toFixed(2)}</span>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                className="btn-success"
                onClick={onPlaceOrder}
                disabled={isPlacingOrder || !selectedTable}
                style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: '800', borderRadius: '12px' }}
              >
                {isPlacingOrder ? 'Processing...' : 'Place Order Now'}
              </button>
              {showHotkeys && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>F4</span>
              )}
            </div>
            {!selectedTable && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>Please select a table to place order</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const POSPage = () => {
  const { showToast } = useToast();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [cartItems, setCartItems] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(true);
  
  const { 
    isOffline, 
    subscriptionValid, 
    subscriptionMessage, 
    saveOfflineOrder, 
    cacheData, 
    getCachedData 
  } = useOffline();
  
  // Online Order Details
  const [onlineDetails, setOnlineDetails] = useState({
    customerName: '',
    customerPhone: '',
    notes: ''
  });

  // Allow ADMIN and WAITER roles
  const role = getRole();
  if (role !== 'WAITER' && role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchTables = async () => {
      if (isOffline) {
        const cachedTables = getCachedData('tables');
        if (cachedTables) setTables(cachedTables);
        return;
      }
      try {
        const response = await api.get('/admin/tables');
        const realTables = response.data.filter(t => t.tableName !== 'ONLINE');
        const onlineTable = { id: 'ONLINE', tableName: 'ONLINE', capacity: 0, isActive: true, isOnline: true };
        const allTables = [onlineTable, ...realTables];
        setTables(allTables);
        cacheData('tables', allTables);
      } catch (err) {
        const cachedTables = getCachedData('tables');
        if (cachedTables) setTables(cachedTables);
        else setError(err.response?.data?.message || 'Failed to fetch tables');
      }
    };
    fetchTables();
  }, [isOffline]);

  useEffect(() => {
    if (selectedTable) {
      setCartItems([]);
      setCartExpanded(false);
      setOnlineDetails({ customerName: '', customerPhone: '', notes: '' });
      const fetchMenu = async () => {
        if (isOffline) {
          const cachedMenu = getCachedData('menuItems');
          if (cachedMenu) setMenuItems(cachedMenu);
          return;
        }
        try {
          const response = await api.get('/admin/menu-items');
          setMenuItems(response.data);
          cacheData('menuItems', response.data);
        } catch (err) {
          const cachedMenu = getCachedData('menuItems');
          if (cachedMenu) setMenuItems(cachedMenu);
          else setError(err.response?.data?.message || 'Failed to fetch menu items');
        }
      };
      fetchMenu();
    }
  }, [selectedTable, isOffline]);

  // Combined Keydown Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F4: Place or Confirm Order
      if (e.key === 'F4') {
        e.preventDefault();
        if (showConfirm) {
          handleConfirmOrder();
        } else if (cartItems.length > 0) {
          handlePlaceOrder();
        }
      }
      
      // Escape: Close Modal or Deselect Table
      if (e.key === 'Escape') {
        if (showConfirm) {
          setShowConfirm(false);
        } else if (selectedTable) {
          setSelectedTable(null);
        }
      }

      // F8: Clear Cart
      if (e.key === 'F8') {
        e.preventDefault();
        setCartItems([]);
        showToast('Cart cleared', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirm, cartItems, selectedTable]);

  const handleAddToCart = (item) => {
    setCartExpanded(false); // Collapse cart when adding a new item
    const isOnline = selectedTable?.isOnline;
    const finalPrice = (isOnline && item.onlinePrice != null) ? item.onlinePrice : item.price;

    setCartItems(prev => {
      const existing = prev.find(cartItem => cartItem.itemId === item.id);
      if (existing) {
        return prev.map(cartItem => 
          cartItem.itemId === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prev, { itemId: item.id, name: item.name, price: finalPrice, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId, delta) => {
    setCartItems(prev => {
      return prev.map(cartItem => {
        if (cartItem.itemId === itemId) {
          return { ...cartItem, quantity: cartItem.quantity + delta };
        }
        return cartItem;
      }).filter(cartItem => cartItem.quantity > 0);
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = () => {
    if (!selectedTable) {
      showToast("Let's select a table first!", "error");
      return;
    }
    if (cartItems.length === 0) {
      showToast("Cart is empty", "error");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    setShowConfirm(false);
    setCartExpanded(false);
    setIsPlacingOrder(true);
    
    const payload = {
      tableId: selectedTable.isOnline ? null : selectedTable.id,
      orderSource: selectedTable.isOnline ? "ONLINE" : "POS",
      items: cartItems.map(i => ({
        menuItemId: i.itemId,
        quantity: i.quantity
      })),
      customerName: onlineDetails.customerName,
      customerPhone: onlineDetails.customerPhone,
      notes: onlineDetails.notes
    };

    if (isOffline) {
      saveOfflineOrder(payload);
      setCartItems([]);
      setOnlineDetails({ customerName: '', customerPhone: '', notes: '' });
      showToast('Order saved offline', 'success');
      setIsPlacingOrder(false);
      return;
    }

    try {
      await api.post('/orders', payload);
      setCartItems([]);
      setOnlineDetails({ customerName: '', customerPhone: '', notes: '' });
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      showToast('Failed to place order', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totalBill = calculateTotal();

  return (
    <>
      <div className="desktop-only" style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'center', padding: '10px 24px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>F8</span> Clear Cart
          <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>ESC</span> Cancel
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>HOTKEYS</span>
          <div 
            onClick={() => setShowHotkeys(!showHotkeys)}
            style={{
              width: '36px', height: '18px', borderRadius: '9px',
              backgroundColor: showHotkeys ? 'var(--primary-color)' : '#ccc',
              position: 'relative', transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'white',
              position: 'absolute', top: '2px', left: showHotkeys ? '20px' : '2px',
              transition: 'left 0.2s'
            }} />
          </div>
        </label>
      </div>

      {isOffline && (
        <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px 20px', textAlign: 'center', fontWeight: 'bold' }}>
          ⚠️ Offline Mode - Orders will sync later
        </div>
      )}

      {!subscriptionValid && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.9)', 
          color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          padding: '20px', textAlign: 'center' 
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️ Session Blocked</h2>
          <p style={{ fontSize: '18px', maxWidth: '500px' }}>{subscriptionMessage}</p>
        </div>
      )}

      <div className="pos-layout" style={{ marginBottom: cartItems.length > 0 ? '100px' : '0' }}>
        <div className="pos-tables-col">
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Tables</h2>
          {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}
          <div className="pos-tables-row">
            {tables.length === 0 && !error ? <p>Loading tables...</p> : tables.map(table => {
              const isSelected = selectedTable && (selectedTable.id === table.id || selectedTable.tableName === table.tableName);
              return (
                <div 
                  key={table.id || table.tableName}
                  className="card"
                  onClick={() => setSelectedTable(table)}
                  style={{
                    padding: '16px',
                    borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--card-bg)',
                    color: isSelected ? 'white' : 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderWidth: isSelected ? '2px' : '1px'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{table.tableName}</h3>
                  <small style={{ opacity: isSelected ? 0.9 : 0.6 }}>Cap: {table.capacity}</small>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Menu Items */}
        <div className="pos-menu-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            Menu {selectedTable ? (
              <span style={{ color: 'var(--primary-color)' }}>
                — {selectedTable.tableName} 
                {selectedTable.isOnline && <span style={{ marginLeft: '8px', color: '#EC4899', fontSize: '12px', fontWeight: 'bold' }}>[ONLINE ORDER]</span>}
              </span>
            ) : ''}
          </h2>
          
          {!selectedTable ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Select a table on the left to begin taking their order.</p>
            </div>
          ) : (
            <>
              {/* Category Tabs - QR Style (Pills) */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                overflowX: 'auto', 
                paddingBottom: '16px',
                marginBottom: '10px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                width: '100%',
                maxWidth: '100%'
              }} className="hide-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId('All')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '20px',
                    border: '1px solid var(--primary-color)',
                    backgroundColor: selectedCategoryId === 'All' ? 'var(--primary-color)' : 'transparent',
                    color: selectedCategoryId === 'All' ? 'white' : 'var(--primary-color)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  All Items
                </button>
                {Array.from(new Set(menuItems.map(item => item.category?.id))).filter(id => id).map(catId => {
                  const categoryName = menuItems.find(i => i.category?.id === catId)?.category?.name;
                  return (
                    <button
                      key={catId}
                      onClick={() => setSelectedCategoryId(catId)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '20px',
                        border: '1px solid var(--primary-color)',
                        backgroundColor: selectedCategoryId === catId ? 'var(--primary-color)' : 'transparent',
                        color: selectedCategoryId === catId ? 'white' : 'var(--primary-color)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      {categoryName}
                    </button>
                  );
                })}
              </div>

              {/* Menu Items List - QR Style (Horizontal Cards) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {menuItems
                  .filter(item => (selectedCategoryId === 'All' || item.category?.id === selectedCategoryId) && (!selectedTable.isOnline || item.isOnlineAvailable))
                  .map(item => {
                    const cartItem = cartItems.find(ci => ci.itemId === item.id);
                    const isOnline = selectedTable?.isOnline;
                    const displayPrice = (isOnline && item.onlinePrice != null) ? item.onlinePrice : item.price;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="card" 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '16px',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: 0 }}>
                          {item.imageUrl && (
                            <img 
                              src={`${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${item.imageUrl}`} 
                              alt={item.name} 
                              style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
                            />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '18px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</strong>
                            {item.description && (
                              <p style={{ 
                                margin: 0, 
                                fontSize: '13px', 
                                color: 'var(--text-secondary)', 
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {item.description}
                              </p>
                            )}
                            <span style={{ color: 'var(--success-color)', fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>
                              ₹{parseFloat(displayPrice).toFixed(2)}
                              {isOnline && item.onlinePrice != null && <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '4px' }}>(Online Price)</span>}
                            </span>
                          </div>
                        </div>

                        {/* Integrated Quantity Controls - Match QR style */}
                        {cartItem ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                fontSize: '18px', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >−</button>
                            <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: '700', fontSize: '16px' }}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                backgroundColor: 'var(--primary-color)',
                                border: 'none', color: 'white',
                                fontSize: '18px', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >+</button>
                          </div>
                        ) : (
                          <button 
                            className="btn-primary"
                            onClick={() => handleAddToCart(item)}
                            style={{ padding: '10px 22px', fontSize: '15px', borderRadius: '8px', flexShrink: 0 }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {/* Original Sidebar Cart - Hidden via CSS class on mobile */}
        <div className="pos-cart-col desktop-only-cart">
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Current Order</h2>
            
            {cartItems.length === 0 ? (
              <p style={{ padding: '20px 0', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                Cart is empty.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ maxHeight: '45vh', overflowY: 'auto' }} className="table-scroll">
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px 0', fontWeight: '500' }}>Item</th>
                        <th style={{ padding: '8px 0', textAlign: 'center', fontWeight: '500' }}>Qty</th>
                        <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((cartItem) => (
                        <tr key={cartItem.itemId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 0' }}>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>{cartItem.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>₹{parseFloat(cartItem.price).toFixed(2)}</div>
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button onClick={() => updateCartQuantity(cartItem.itemId, -1)} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '14px', minWidth: '28px' }}>-</button>
                              <span style={{ fontWeight: '600', fontSize: '14px', minWidth: '16px' }}>{cartItem.quantity}</span>
                              <button onClick={() => updateCartQuantity(cartItem.itemId, 1)} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '14px', minWidth: '28px' }}>+</button>
                            </div>
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                            ₹{(cartItem.price * cartItem.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>Total:</span>
                  <span>₹{totalBill.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn-success"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cartItems.length === 0}
                  style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                >
                  {isPlacingOrder ? 'Processing...' : 'Place Order'}
                </button>
                {showHotkeys && cartItems.length > 0 && (
                  <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>F4</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Panel */}
      <CartPanel 
        cartItems={cartItems}
        totalBill={totalBill}
        updateCartQuantity={updateCartQuantity}
        isPlacingOrder={isPlacingOrder}
        onPlaceOrder={handlePlaceOrder}
        selectedTable={selectedTable}
        expanded={cartExpanded}
        setExpanded={setCartExpanded}
        showHotkeys={showHotkeys}
      />

      {/* ── Confirm Order Modal ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '32px', borderRadius: '16px', position: 'relative' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px' }}>Confirm Order</h2>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>
              Table: <strong>{selectedTable?.tableName}</strong> · {cartItems.reduce((a, i) => a + i.quantity, 0)} items · <strong>₹{totalBill.toFixed(2)}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
              {selectedTable?.isOnline && (
                <>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)' }}>CUSTOMER DETAILS</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      placeholder="Customer Name" 
                      value={onlineDetails.customerName}
                      onChange={(e) => setOnlineDetails({ ...onlineDetails, customerName: e.target.value })}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                    />
                    <input 
                      placeholder="Phone Number" 
                      value={onlineDetails.customerPhone}
                      onChange={(e) => setOnlineDetails({ ...onlineDetails, customerPhone: e.target.value })}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                    />
                  </div>
                </>
              )}
              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>ORDER NOTES</h4>
              <textarea 
                placeholder="Add special instructions or notes..." 
                value={onlineDetails.notes}
                onChange={(e) => setOnlineDetails({ ...onlineDetails, notes: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {cartItems.map(ci => (
                <div key={ci.itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span>{ci.name} × {ci.quantity}</span>
                  <span style={{ fontWeight: '600' }}>₹{(ci.price * ci.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowConfirm(false)}
                  style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                {showHotkeys && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ESC</span>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <button
                  className="btn-success"
                  onClick={handleConfirmOrder}
                  disabled={isPlacingOrder}
                  style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '10px' }}
                >
                  {isPlacingOrder ? 'Placing...' : 'Confirm'}
                </button>
                {showHotkeys && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>F4</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POSPage;
