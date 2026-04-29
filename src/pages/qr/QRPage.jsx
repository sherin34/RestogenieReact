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
  const [branding, setBranding] = useState({
    primaryColor: '#007BFF',
    instagramUrl: '',
    whatsappNumber: '',
    welcomeMessage: '',
    logoUrl: null,
    bannerUrl: null,
    useDefaultBanner: true
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderNotes, setOrderNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pollingRef = useRef(null);

  const bannerSource = branding.useDefaultBanner 
    ? '/default-banner.png' 
    : (branding.bannerUrl ? `${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${branding.bannerUrl}` : '/default-banner.png');

  const filteredMenuItems = menuItems
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(cat => ({
      ...cat,
      items: cat.items?.filter(item => 
        (item.isAvailable !== false) && 
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }))
    .filter(cat => 
      (selectedCategory === 'All' || cat.categoryName === selectedCategory) && 
      (cat.items && cat.items.length > 0)
    );

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
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/qr/order/${orderId}/status`);
        setTrackedOrder(res.data);
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
        if (response.data.branding) {
          const b = response.data.branding;
          setBranding(b);
          if (b.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', b.primaryColor);
          }
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
        setError('Could not load the menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if (tableId) fetchMenu();
  }, [tableId]);

  const currentStepIndex = trackedOrder
    ? STATUS_STEPS.findIndex(s => s.key === trackedOrder.status)
    : -1;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      paddingBottom: cartItems.length > 0 ? '140px' : '40px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── Dynamic Header with Banner ── */}
      <header style={{ 
        height: '320px',
        textAlign: 'center', 
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: '40px'
      }}>
        {/* Banner Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url(${bannerSource})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '0 0 40px 40px',
          zIndex: -1,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }} />

        <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
          {branding.logoUrl ? (
            <img 
              src={`${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${branding.logoUrl}`} 
              alt={restaurantName}
              style={{ width: '90px', height: '90px', borderRadius: '24px', backgroundColor: 'white', padding: '10px', marginBottom: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}
            />
          ) : (
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🍽️</div>
          )}
          
          <h1 style={{ margin: '0 0 6px 0', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>{restaurantName}</h1>
          
          {branding.welcomeMessage && (
            <p style={{ margin: '0 0 20px 0', opacity: 0.9, fontSize: '15px', fontWeight: '500', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.4' }}>
              {branding.welcomeMessage}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px', 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              backdropFilter: 'blur(12px)',
              color: 'white', 
              borderRadius: '30px', 
              fontSize: '14px', 
              fontWeight: '800',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
               <span style={{ opacity: 0.7, fontWeight: '500' }}>Table</span> {tableId}
            </div>

            {branding.instagramUrl && (
              <a href={branding.instagramUrl} target="_blank" rel="noopener noreferrer" style={{
                width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E4405F' }}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}

            {branding.whatsappNumber && (
              <a href={`https://wa.me/${branding.whatsappNumber.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" style={{
                width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                </svg>
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="container" style={{ position: 'relative', zIndex: 20 }}>
        <div style={{ 
          margin: '0 auto 20px', 
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          border: '1px solid #f1f5f9'
        }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              border: 'none', 
              padding: '14px 0', 
              fontSize: '16px', 
              width: '100%', 
              outline: 'none',
              backgroundColor: 'transparent'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', padding: '8px', fontSize: '18px', color: '#cbd5e1' }}
            >✕</button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '20px', marginBottom: '20px' }}></div>
            <div className="shimmer" style={{ width: '80%', height: '24px', borderRadius: '4px', margin: '0 auto 12px' }}></div>
            <p style={{ color: '#94a3b8', fontWeight: '500' }}>Fetching delicious menu...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fef2f2', borderRadius: '16px', color: '#991b1b' }}>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>{error}</p>
          </div>
        ) : (
          <>
            <div style={{
              position: 'sticky',
              top: '10px',
              zIndex: 100,
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              padding: '8px 4px 16px',
              margin: '0 -16px 20px',
              paddingLeft: '16px',
              paddingRight: '16px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }} className="hide-scrollbar">
              <button
                onClick={() => setSelectedCategory('All')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: 'none',
                  backgroundColor: selectedCategory === 'All' ? 'var(--primary-color)' : 'white',
                  color: selectedCategory === 'All' ? 'white' : '#64748b',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                All Items
              </button>
              {menuItems.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat.categoryName)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '25px',
                    border: 'none',
                    backgroundColor: selectedCategory === cat.categoryName ? 'var(--primary-color)' : 'white',
                    color: selectedCategory === cat.categoryName ? 'white' : '#64748b',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {filteredMenuItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🥗</div>
                  <h3 style={{ fontSize: '20px', color: '#475569', marginBottom: '8px' }}>No items found</h3>
                  <p style={{ color: '#94a3b8' }}>Try searching for something else!</p>
                </div>
              ) : (
                filteredMenuItems.map((category, catIdx) => (
                  <div key={catIdx}>
                    <h2 style={{ 
                      fontSize: '22px', 
                      fontWeight: '800', 
                      marginBottom: '20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      color: '#1e293b'
                    }}>
                      <span style={{ width: '4px', height: '24px', backgroundColor: 'var(--primary-color)', borderRadius: '2px' }}></span>
                      {category.categoryName}
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#94a3b8', marginLeft: 'auto' }}>
                        {category.items?.length} items
                      </span>
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                      {category.items && category.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '16px',
                            gap: '16px',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.02)',
                            border: '1px solid #f1f5f9',
                            transition: 'transform 0.2s',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ width: '100px', height: '100px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f1f5f9' }}>
                            {item.imageUrl ? (
                              <img
                                src={`${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080'}${item.imageUrl}`}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🍲</div>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{item.name}</h3>
                            {item.description && (
                              <p style={{ 
                                margin: '0 0 10px 0', 
                                fontSize: '13px', 
                                color: '#64748b', 
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {item.description}
                              </p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                              <span style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '18px' }}>₹{parseFloat(item.price).toFixed(2)}</span>
                              
                              {(() => {
                                const cartItem = cartItems.find(ci => ci.id === item.id);
                                if (cartItem) {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '30px' }}>
                                      <button
                                        onClick={() => updateCartQuantity(item.id, -1)}
                                        style={{
                                          width: '32px', height: '32px', borderRadius: '50%',
                                          backgroundColor: 'white', border: 'none',
                                          fontSize: '18px', fontWeight: '700', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                        }}
                                      >−</button>
                                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>
                                        {cartItem.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateCartQuantity(item.id, 1)}
                                        style={{
                                          width: '32px', height: '32px', borderRadius: '50%',
                                          backgroundColor: 'var(--primary-color)',
                                          border: 'none', color: 'white',
                                          fontSize: '18px', fontWeight: '700', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                        }}
                                      >+</button>
                                    </div>
                                  );
                                }
                                return (
                                  <button
                                    className="btn-primary"
                                    onClick={() => handleAddToCart(item)}
                                    style={{ 
                                      padding: '8px 24px', 
                                      fontSize: '14px', 
                                      borderRadius: '30px', 
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                      border: 'none'
                                    }}
                                  >
                                    Add
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '16px',
          right: '16px',
          zIndex: 200,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div
            onClick={() => setShowConfirm(true)}
            style={{
              backgroundColor: 'var(--primary-color)',
              padding: '16px 24px',
              borderRadius: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              color: 'white',
              transition: 'transform 0.2s active'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '800'
              }}>
                {cartItems.reduce((a, i) => a + i.quantity, 0)} Items
              </div>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>View Cart</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '800', fontSize: '20px' }}>₹{totalBill.toFixed(2)}</span>
              <span style={{ fontSize: '18px' }}>→</span>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            width: '100%', 
            maxWidth: '600px', 
            padding: '32px 24px 40px', 
            borderRadius: '32px 32px 0 0',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', margin: '0 auto 24px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Confirm Order</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Review your items before placing the order</p>
              </div>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{ background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#64748b' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {cartItems.map(ci => (
                <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>{ci.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>₹{parseFloat(ci.price).toFixed(2)} × {ci.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>₹{(parseFloat(ci.price) * ci.quantity).toFixed(2)}</div>
                    <button 
                      onClick={() => removeFromCart(ci.id)}
                      style={{ background: 'none', color: '#ef4444', padding: '4px', fontSize: '18px' }}
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>SPECIAL INSTRUCTIONS</label>
              <textarea 
                placeholder="e.g. less spicy, no onion..." 
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '16px', 
                  border: '1px solid #e2e8f0', fontSize: '15px', 
                  minHeight: '100px', resize: 'none', backgroundColor: '#f8fafc',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
              />
            </div>

            <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#64748b' }}>Total Bill</span>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary-color)' }}>₹{totalBill.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              style={{ 
                width: '100%', 
                padding: '18px', 
                fontSize: '18px', 
                borderRadius: '20px', 
                fontWeight: '800',
                boxShadow: '0 12px 25px rgba(0,0,0,0.1)'
              }}
            >
              {isPlacingOrder ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}

      {showOrderTracker && trackedOrder && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800' }}>Order #{trackedOrder.orderId}</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Dining at Table {trackedOrder.tableName}
                </p>
              </div>
              <button
                onClick={() => { setShowOrderTracker(false); clearInterval(pollingRef.current); }}
                style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              {STATUS_STEPS.map((step, idx) => {
                const isDone = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      backgroundColor: isDone ? 'var(--success-color)' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', transition: 'all 0.4s'
                    }}>
                      {isDone ? '✓' : step.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: isDone ? '#1e293b' : '#94a3b8' }}>{step.label}</div>
                      {isCurrent && <div style={{ fontSize: '12px', color: 'var(--success-color)', fontWeight: '600' }}>In Progress...</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setShowOrderTracker(false)}
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: '16px' }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}

      {!showOrderTracker && trackedOrder && (
        <button
          onClick={() => setShowOrderTracker(true)}
          style={{
            position: 'fixed', bottom: '100px', right: '20px', padding: '12px 24px',
            borderRadius: '30px', backgroundColor: '#1e293b', color: 'white',
            border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          📋 Status: {trackedOrder.status}
        </button>
      )}

      <footer style={{ marginTop: '60px', padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} <strong>{restaurantName}</strong></p>
        <p style={{ marginTop: '8px', opacity: 0.6 }}>Experience by RestoGenie</p>
      </footer>

      <style>{`
        .shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default QRPage;
