import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_STEPS = [
  { key: 'NEW', label: 'Order Placed', icon: '🧾', description: 'Your order has been received' },
  { key: 'PREPARING', label: 'Preparation Started', icon: '👨‍🍳', description: 'Kitchen is preparing your food' },
  { key: 'READY', label: 'Ready to Serve', icon: '✅', description: 'Your order is ready!' },
];

const CartPanel = ({ cartItems, totalBill, updateCartQuantity, removeFromCart, isPlacingOrder, onPlaceOrder }) => {
  const [expanded, setExpanded] = useState(false);
  const totalQty = cartItems.reduce((a, i) => a + i.quantity, 0);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'var(--card-bg)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      zIndex: 40,
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      transition: 'all 0.3s ease',
      maxWidth: '700px',
      margin: '0 auto',
    }}>
      {/* Collapsed bar — always visible */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-color)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            backgroundColor: 'var(--primary-color)', color: 'white',
            borderRadius: '50%', width: '26px', height: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700'
          }}>{totalQty}</span>
          <span style={{ fontWeight: '600', fontSize: '15px' }}>
            {expanded ? 'Your Order' : `${totalQty} item${totalQty > 1 ? 's' : ''} in cart`}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{expanded ? '▼' : '▲'}</span>
        </div>
        <span style={{ fontWeight: '700', fontSize: '18px' }}>₹{totalBill.toFixed(2)}</span>
      </div>

      {/* Expanded cart items */}
      {expanded && (
        <div style={{ maxHeight: '40vh', overflowY: 'auto', padding: '8px 20px 4px' }}>
          {cartItems.map(ci => (
            <div key={ci.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 0', borderBottom: '1px solid var(--border-color)'
            }}>
              {/* Item name & price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ci.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>₹{parseFloat(ci.price).toFixed(2)} each</div>
              </div>
              {/* Qty controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => updateCartQuantity(ci.id, -1)} style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '15px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>−</button>
                <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: '700', fontSize: '15px' }}>{ci.quantity}</span>
                <button onClick={() => updateCartQuantity(ci.id, 1)} style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>+</button>
              </div>
              {/* Row total */}
              <div style={{ minWidth: '56px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>
                ₹{(parseFloat(ci.price) * ci.quantity).toFixed(2)}
              </div>
              {/* Remove button */}
              <button onClick={() => removeFromCart(ci.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                color: '#ef4444', lineHeight: 1, padding: '0 2px', flexShrink: 0
              }} title="Remove item">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Place Order button */}
      <div style={{ padding: '12px 20px' }}>
        <button
          className="btn-success"
          onClick={onPlaceOrder}
          disabled={isPlacingOrder || cartItems.length === 0}
          style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '10px', fontWeight: '700' }}
        >
          {isPlacingOrder ? 'Placing Order...' : `Place Order · ₹${totalBill.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

const QRPage = () => {
  const { tableId } = useParams();
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderNotes, setOrderNotes] = useState('');

  // Confirm modal state
  const [showConfirm, setShowConfirm] = useState(false);

  // Order tracking state
  const [trackedOrder, setTrackedOrder] = useState(null); // holds the order after placement
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const pollingRef = useRef(null);

  const handleAddToCart = (item) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find((ci) => ci.id === item.id);
      if (existingItem) {
        return prevCart.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId, delta) => {
    setCartItems((prev) =>
      prev
        .map((ci) => ci.id === itemId ? { ...ci, quantity: ci.quantity + delta } : ci)
        .filter((ci) => ci.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
  };

  const totalBill = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const startPolling = (orderId) => {
    // Poll every 5 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/qr/order/${orderId}/status`);
        setTrackedOrder(res.data);
        // Stop polling if order is ready or completed
        if (res.data.status === 'READY' || res.data.status === 'COMPLETED' || res.data.status === 'CANCELLED') {
          clearInterval(pollingRef.current);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handlePlaceOrder = async () => {
    setShowConfirm(false);
    try {
      setIsPlacingOrder(true);

      const orderPayload = {
        items: cartItems.map(i => ({
          menuItemId: i.id || i.menuItemId || i.itemId,
          quantity: i.quantity
        })),
        notes: orderNotes
      };

      const res = await api.post(`/qr/${tableId}/order`, orderPayload);

      setCartItems([]);
      setOrderNotes('');
      setTrackedOrder(res.data);
      setShowOrderTracker(true);
      showToast('Order placed successfully!', 'success');

      // Start polling for status updates
      startPolling(res.data.orderId);

    } catch (err) {
      console.error('Failed to place order:', err);
      showToast('Failed to place your order. Please try again.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get(`/qr/${tableId}/menu`);
        setMenuItems(response.data.categories);
        const name = response.data.restaurantName || 'Restaurant';
        setRestaurantName(name);
        document.title = `${name} - Digital Menu`;
      } catch (err) {
        console.error('Failed to load menu:', err);
        setError('Could not load the menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      fetchMenu();
    }
  }, [tableId]);

  const currentStepIndex = trackedOrder
    ? STATUS_STEPS.findIndex(s => s.key === trackedOrder.status)
    : -1;

  return (
    <div className="container" style={{ paddingBottom: cartItems.length > 0 ? '120px' : '20px' }}>
      <header style={{ 
        padding: '24px 20px', 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%)',
        color: 'white',
        borderRadius: '0 0 24px 24px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>{restaurantName}</h1>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px', 
          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
          backdropFilter: 'blur(8px)',
          color: 'white', 
          borderRadius: '20px', 
          fontSize: '14px', 
          fontWeight: '600',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
           <span style={{ opacity: 0.8 }}>Dining at</span> Table {tableId}
        </div>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Loading menu...</p>
      ) : error ? (
        <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      ) : menuItems.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No menu items available right now.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Category Selector Tabs */}
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '16px',
            marginBottom: '10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <button
              onClick={() => setSelectedCategory('All')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid var(--primary-color)',
                backgroundColor: selectedCategory === 'All' ? 'var(--primary-color)' : 'transparent',
                color: selectedCategory === 'All' ? 'white' : 'var(--primary-color)',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            {menuItems.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat.categoryName)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: '1px solid var(--primary-color)',
                  backgroundColor: selectedCategory === cat.categoryName ? 'var(--primary-color)' : 'transparent',
                  color: selectedCategory === cat.categoryName ? 'white' : 'var(--primary-color)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          {menuItems
            .filter(cat => selectedCategory === 'All' || cat.categoryName === selectedCategory)
            .map((category, catIdx) => (
              <div key={catIdx}>
                <h2 style={{ fontSize: '20px', borderBottom: '2px solid #007BFF', paddingBottom: '8px', marginBottom: '12px' }}>
                  {category.categoryName}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {category.items && category.items.map((item) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                        {item.imageUrl && (
                          <img
                            src={`http://localhost:8080${item.imageUrl}`}
                            alt={item.name}
                            style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <strong style={{ fontSize: '18px', margin: 0 }}>{item.name}</strong>
                          {item.description && <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>{item.description}</p>}
                          <span style={{ color: 'var(--success-color)', fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>₹{parseFloat(item.price).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Per-item: show qty controls if in cart, else Add button */}
                      {(() => {
                        const cartItem = cartItems.find(ci => ci.id === item.id);
                        if (cartItem) {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
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
                          );
                        }
                        return (
                          <button
                            className="btn-primary"
                            onClick={() => handleAddToCart(item)}
                            style={{ padding: '10px 22px', fontSize: '15px', borderRadius: '8px', marginLeft: '12px', flexShrink: 0 }}
                          >
                            Add
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Sticky Cart Panel */}
      {cartItems.length > 0 && (
        <CartPanel
          cartItems={cartItems}
          totalBill={totalBill}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          isPlacingOrder={isPlacingOrder}
          onPlaceOrder={() => setShowConfirm(true)}
        />
      )}

      {/* ── Confirm Order Modal ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px', borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px' }}>Confirm Order</h2>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>
              You are about to place an order with <strong>{cartItems.reduce((a, i) => a + i.quantity, 0)} items</strong> totalling <strong>₹{totalBill.toFixed(2)}</strong>.
            </p>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                {cartItems.map(ci => (
                  <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span>{ci.name} × {ci.quantity}</span>
                    <span>₹{(parseFloat(ci.price) * ci.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>SPECIAL INSTRUCTIONS (OPTIONAL)</label>
                <textarea 
                  placeholder="e.g. less spicy, no onion..." 
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '10px', 
                    border: '1px solid var(--border-color)', fontSize: '14px', 
                    minHeight: '80px', resize: 'none', backgroundColor: 'var(--bg-secondary)'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '14px', fontSize: '16px', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                className="btn-success"
                onClick={handlePlaceOrder}
                style={{ flex: 1, padding: '14px', fontSize: '16px', borderRadius: '10px' }}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Status Tracker Modal ── */}
      {showOrderTracker && trackedOrder && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '22px' }}>Order #{trackedOrder.orderId}</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Table: {trackedOrder.tableName} · ₹{trackedOrder.totalAmount?.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => { setShowOrderTracker(false); clearInterval(pollingRef.current); }}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Status Progress */}
            <div style={{ position: 'relative', marginBottom: '32px' }}>
              {/* Progress line */}
              <div style={{
                position: 'absolute',
                top: '22px',
                left: '22px',
                right: '22px',
                height: '4px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '2px',
                zIndex: 0
              }} />
              <div style={{
                position: 'absolute',
                top: '22px',
                left: '22px',
                height: '4px',
                width: currentStepIndex >= 0 ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%',
                backgroundColor: 'var(--success-color)',
                borderRadius: '2px',
                zIndex: 1,
                transition: 'width 0.6s ease'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: isDone ? 'var(--success-color)' : 'var(--bg-secondary)',
                        border: `3px solid ${isDone ? 'var(--success-color)' : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        transition: 'all 0.4s ease',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(34,197,94,0.25)' : 'none'
                      }}>
                        {step.icon}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: isCurrent ? '700' : '500',
                        color: isDone ? 'var(--success-color)' : 'var(--text-secondary)',
                        marginTop: '8px',
                        textAlign: 'center',
                        lineHeight: '1.3'
                      }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current status message */}
            {currentStepIndex >= 0 && (
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '14px 16px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--success-color)' }}>
                  {STATUS_STEPS[currentStepIndex]?.description}
                </span>
                {trackedOrder.status !== 'READY' && trackedOrder.status !== 'COMPLETED' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Refreshing automatically…
                  </p>
                )}
              </div>
            )}

            {/* Order items */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '14px' }}>Your Items</p>
              {trackedOrder.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span>{item.menuItemName} × {item.quantity}</span>
                  <span>₹{item.totalPrice?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Button to re-open tracker */}
      {!showOrderTracker && trackedOrder && (
        <button
          onClick={() => setShowOrderTracker(true)}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '30px',
            backgroundColor: 'var(--success-color)',
            color: 'white',
            border: 'none',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: 50
          }}
        >
          📋 Track Order
        </button>
      )}

      {/* Guest Footer */}
      <footer style={{
        marginTop: '60px',
        padding: '40px 20px 20px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} <strong>{restaurantName}</strong></p>
        <p style={{ marginTop: '8px', opacity: 0.6 }}>Powered by RestoGenie</p>
      </footer>
    </div>
  );
};

export default QRPage;
