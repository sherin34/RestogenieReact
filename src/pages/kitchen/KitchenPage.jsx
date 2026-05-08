import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getRole } from '../../utils/auth';
import api from '../../services/api';
import { Client } from '@stomp/stompjs';
import { useToast } from '../../context/ToastContext';

const KitchenPage = () => {
  const { showToast } = useToast();
  // Accessible for KITCHEN and ADMIN roles
  const role = getRole();
  if (role !== 'KITCHEN' && role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  // State: orders (array)
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedOrderIndex, setFocusedOrderIndex] = useState(0);
  const [showHotkeys, setShowHotkeys] = useState(() => {
    const saved = localStorage.getItem('kitchen_show_hotkeys');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('kitchen_show_hotkeys', JSON.stringify(showHotkeys));
  }, [showHotkeys]);
  const [selectedItemIds, setSelectedItemIds] = useState({}); // { [orderId]: [itemId1, itemId2] }
  const [isPrinting, setIsPrinting] = useState(false);

  // Previous Orders States
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [pastOrders, setPastOrders] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchPastOrders = async () => {
    setLoadingPast(true);
    try {
      // Fetch orders and filter specifically for unbilled orders (READY)
      const response = await api.get('/orders');
      const allOrders = response.data;
      
      // Filter for READY status only (unbilled processed orders)
      const past = allOrders
        .filter(o => o.status === 'READY')
        .sort((a, b) => {
          const idA = a.orderId || a.id || 0;
          const idB = b.orderId || b.id || 0;
          return idB - idA;
        });
      
      setPastOrders(past);
    } catch (err) {
      console.error('Failed to fetch past orders:', err);
      showToast('Could not load past orders.', 'error');
    } finally {
      setLoadingPast(false);
    }
  };

  const updateOrderStatus = async (currentOrderId, newStatus) => {
    try {
      await api.put(`/orders/${currentOrderId}/status?status=${newStatus}`);
      setOrders((prevOrders) => 
        prevOrders.map((o) => ((o.orderId || o.id) === currentOrderId ? { ...o, status: newStatus } : o))
      );

      // Remove the order from the list shortly after it's ready
      if (newStatus === 'READY') {
        setTimeout(() => {
          setOrders((prevOrders) => {
            const filtered = prevOrders.filter((o) => (o.orderId || o.id) !== currentOrderId);
            // Adjust focus if needed
            setFocusedOrderIndex(prev => Math.min(prev, Math.max(0, filtered.length - 1)));
            return filtered;
          });
        }, 4000); 
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      showToast('Could not update order status.', 'error');
    }
  };

  const [rejectionOrder, setRejectionOrder] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const handleRejectOrder = async () => {
    if (!rejectionOrder) return;
    const orderId = rejectionOrder.orderId || rejectionOrder.id;
    try {
      await api.put(`/orders/${orderId}/reject?note=${encodeURIComponent(rejectionNote)}`);
      setOrders((prev) => prev.filter((o) => (o.orderId || o.id) !== orderId));
      showToast('Order rejected.', 'info');
      setRejectionOrder(null);
      setRejectionNote('');
      setFocusedOrderIndex(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to reject order:', err);
      showToast('Could not reject order.', 'error');
    }
  };

  const toggleItemSelection = (orderId, itemId) => {
    setSelectedItemIds(prev => {
      const current = prev[orderId] || [];
      if (current.includes(itemId)) {
        return { ...prev, [orderId]: current.filter(id => id !== itemId) };
      } else {
        return { ...prev, [orderId]: [...current, itemId] };
      }
    });
  };

  const handleBulkUpdateStatus = async (orderId, newStatus) => {
    const ids = selectedItemIds[orderId] || [];
    if (ids.length === 0) return;
    try {
      await api.put(`/orders/${orderId}/items/status?status=${newStatus}`, ids);
      // The backend broadcasts the update via WebSocket, which will update our 'orders' state
      if (newStatus === 'READY') {
        showToast('Selected items marked as ready.', 'success');
      }
    } catch (err) {
      console.error('Failed to update items:', err);
      showToast('Could not update items.', 'error');
    }
  };

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showPastOrders) {
        if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') {
          setShowPastOrders(false);
          setSelectedOrder(null);
        }
        return;
      }

      // Selection: 1 to 9
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < orders.length) {
          setFocusedOrderIndex(index);
        }
      }

      // Prev/Next selection via Arrow Keys
      if (e.key === 'ArrowRight') {
        setFocusedOrderIndex(prev => Math.min(prev + 1, orders.length - 1));
      }
      if (e.key === 'ArrowLeft') {
        setFocusedOrderIndex(prev => Math.max(prev - 1, 0));
      }

      const activeOrder = orders[focusedOrderIndex];
      if (!activeOrder) {
        // Handle history toggle even if no active order
        if (e.key === 'h' || e.key === 'H') {
          setShowPastOrders(true);
          fetchPastOrders();
        }
        return;
      }

      const orderId = activeOrder.orderId || activeOrder.id;

      const isLocked = (activeOrder.items || []).some(i => i.status === 'PREPARING');
      const hasSelection = (selectedItemIds[orderId] || []).length > 0;

      // 'P' for Preparing
      if ((e.key === 'p' || e.key === 'P') && !isLocked && hasSelection && activeOrder.status !== 'READY') {
        handleBulkUpdateStatus(orderId, 'PREPARING');
      }

      // 'D' for Done/Ready
      if ((e.key === 'd' || e.key === 'D') && hasSelection && activeOrder.status !== 'READY') {
        handleBulkUpdateStatus(orderId, 'READY');
      }

      // 'R' for Reject
      if ((e.key === 'r' || e.key === 'R') && activeOrder.status !== 'READY') {
        setRejectionOrder(activeOrder);
        setRejectionNote('');
      }

      // 'H' for History
      if (e.key === 'h' || e.key === 'H') {
        setShowPastOrders(true);
        fetchPastOrders();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, focusedOrderIndex, showPastOrders]);

  const handlePrintKOT = async (orderId) => {
    const itemIds = selectedItemIds[orderId] || [];
    if (itemIds.length === 0) {
      showToast('Please select items to print KOT', 'error');
      return;
    }
    
    setIsPrinting(true);
    try {
      const response = await api.get(`/billing/${orderId}/kot`, {
        params: { itemIds: itemIds.join(',') },
        responseType: 'blob',
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileURL;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(fileURL);
        }, 1000);
      };
      
      showToast('KOT sent to printer!', 'success');
    } catch (err) {
      showToast('Failed to print KOT', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get('/orders?status=NEW,PREPARING');
        const fetchedOrders = response.data;
        setOrders(fetchedOrders);
        
        // Initialize selection: all non-READY items checked
        const initialSelection = {};
        fetchedOrders.forEach(order => {
          initialSelection[order.orderId || order.id] = (order.items || [])
            .filter(i => i.status !== 'READY')
            .map(i => i.id);
        });
        setSelectedItemIds(initialSelection);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Could not load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Setup WebSocket connection
    const stompClient = new Client({
      brokerURL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe('/topic/orders', (message) => {
          if (message.body) {
            const newOrder = JSON.parse(message.body);
            setOrders((prevOrders) => {
              const orderId = newOrder.orderId || newOrder.id;
              const exists = prevOrders.some(o => (o.orderId || o.id) === orderId);
              
              // Ensure newly added items in the broadcast are selected by default, and READY items are removed
              setSelectedItemIds(prev => {
                const orderId = newOrder.orderId || newOrder.id;
                const activeIdsFromBroadcast = (newOrder.items || [])
                  .filter(i => i.status !== 'READY')
                  .map(i => i.id);
                
                const previousSelection = prev[orderId] || [];
                
                // 1. Remove items that are no longer active (marked READY)
                const stillActiveSelection = previousSelection.filter(id => activeIdsFromBroadcast.includes(id));
                
                // 2. Identify BRAND NEW items that weren't in the order at all before
                // We compare against ALL items in the order, not just active ones, to see if it's truly new
                const isNewOrder = !prev[orderId];
                
                if (isNewOrder) {
                  return { ...prev, [orderId]: activeIdsFromBroadcast };
                } else {
                  // For updates, we need to know what items were there before to identify "brand new" ones
                  // However, we don't store the full item list in state separately. 
                  // Let's use a simpler approach: if an active ID from broadcast wasn't in our previous selection 
                  // AND it wasn't in the PREVIOUS items list of this order.
                  
                  // Keep what was selected, but remove anything that became READY
                  const finalSelection = stillActiveSelection.length === 0 ? activeIdsFromBroadcast : stillActiveSelection;
                  return { ...prev, [orderId]: finalSelection };
                }
              });

              if (exists) {
                return prevOrders.map(o => (o.orderId || o.id) === orderId ? newOrder : o);
              }
              return [newOrder, ...prevOrders];
            });
          }
        });
      },
    });

    stompClient.activate();
    return () => stompClient.deactivate();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading orders...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return '#ef4444'; 
      case 'NEW': return '#ef4444'; 
      case 'PREPARING': return '#f59e0b'; 
      case 'READY': return '#10b981'; 
      case 'COMPLETED': return '#10b981';
      case 'DELIVERED': return '#3b82f6'; 
      case 'CANCELLED': return '#6b7280'; 
      case 'REJECTED': return '#ef4444'; 
      default: return '#6b7280'; 
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      {/* KDS Header with Hotkey Controls */}
      <div className="desktop-only">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'center', marginBottom: '16px', padding: '10px 0', borderBottom: '1px solid var(--border-color)', width: '100%' }}>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>1-9</span> Select
            <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>P</span> Preparing
            <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>D</span> Ready
            <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>R</span> Reject
            <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>H</span> History
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
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 26px)' }}>Kitchen Display System</h2>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => {
              setShowPastOrders(true);
              fetchPastOrders();
            }}
            className="btn-secondary"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '15px'
            }}
          >
            🕒 Order History
          </button>
          {showHotkeys && (
            <span className="desktop-only" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>H</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No incoming orders at the moment.</p>
        ) : (
          orders.map((order, index) => {
            const statusColor = getStatusColor(order.status);
            const isFocused = focusedOrderIndex === index;
            
            return (
              <div 
                key={order.orderId || order.id || index} 
                className={`card ${isFocused ? 'focused-kitchen-card' : ''}`}
                onClick={() => setFocusedOrderIndex(index)}
                style={{ 
                  padding: '24px',
                  borderTop: `6px solid ${statusColor}`,
                  boxShadow: isFocused ? '0 0 0 3px var(--primary-color), 0 10px 20px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transform: isFocused ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
              >
                {/* Selection Hotkey Indicator */}
                {showHotkeys && index < 9 && (
                  <div className="desktop-only" style={{
                    position: 'absolute', top: '10px', left: '-10px',
                    width: '24px', height: '24px', backgroundColor: 'black', color: 'white',
                    borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px' }}>Table : {order.tableName || order.tableId || 'Unknown'}</h3>
                      {order.orderSource === 'ONLINE' && (
                        <span style={{ 
                          backgroundColor: '#EC4899', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800'
                        }}>[ONLINE]</span>
                      )}
                    </div>
                    <span style={{ 
                      backgroundColor: `${statusColor}20`, color: statusColor, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  {/* Order Notes / Customer Info */}
                  {(order.customerName || order.customerPhone || order.notes) && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: `3px solid ${order.orderSource === 'ONLINE' ? '#EC4899' : 'var(--primary-color)'}` }}>
                      {order.customerName && <div style={{ fontWeight: '700', fontSize: '14px' }}>{order.customerName}</div>}
                      {order.customerPhone && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.customerPhone}</div>}
                      {order.notes && <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic', color: 'var(--text-primary)' }}>"{order.notes}"</div>}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '24px' }}>
                    <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {order.items && order.items.filter(i => i.status !== 'READY' && i.status !== 'REJECTED').map((item, itemIndex) => {
                        const isSelected = (selectedItemIds[order.orderId || order.id] || []).includes(item.id);
                        const isPreparing = item.status === 'PREPARING';
                        const isLocked = (order.items || []).some(i => i.status === 'PREPARING');
                        
                        return (
                          <li 
                            key={item.id || itemIndex} 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (!isLocked) toggleItemSelection(order.orderId || order.id, item.id); 
                            }}
                            style={{ 
                              fontSize: '18px', 
                              display: 'flex', 
                              gap: '12px', 
                              alignItems: 'center',
                              cursor: isLocked ? 'default' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: isLocked && !isSelected ? 0.5 : 1
                            }}
                          >
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '6px',
                              border: `2px solid ${isSelected ? (isPreparing ? '#f59e0b' : 'var(--primary-color)') : 'var(--border-color)'}`,
                              backgroundColor: isSelected ? (isPreparing ? '#f59e0b' : 'var(--primary-color)') : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '14px', flexShrink: 0
                            }}>
                              {isSelected && '✓'}
                            </div>
                            <span style={{ 
                              fontWeight: '800', 
                              color: isSelected ? (isPreparing ? '#f59e0b' : 'var(--primary-color)') : 'var(--text-secondary)', 
                              minWidth: '30px',
                            }}>
                              {item.quantity}x
                            </span> 
                            <span style={{ 
                              fontWeight: '600',
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}>
                              {item.menuItemName || item.menuItem?.name || item.name}
                              {isPreparing && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f59e0b', fontWeight: '800' }}>(PREPARING)</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={(e) => { e.stopPropagation(); handlePrintKOT(order.orderId || order.id); }}
                    disabled={isPrinting || (selectedItemIds[order.orderId || order.id] || []).length === 0}
                    style={{ 
                      width: '100%', padding: '10px', borderRadius: '12px', fontWeight: '800', 
                      backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--primary-color)', color: 'var(--primary-color)',
                      opacity: (isPrinting || (selectedItemIds[order.orderId || order.id] || []).length === 0) ? 0.5 : 1,
                      cursor: (isPrinting || (selectedItemIds[order.orderId || order.id] || []).length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isPrinting ? 'Preparing...' : '🖨️ Print KOT'}
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {order.status !== 'READY' && (
                    <>
                      {(() => {
                        const isLocked = (order.items || []).some(i => i.status === 'PREPARING');
                        const hasSelection = (selectedItemIds[order.orderId || order.id] || []).length > 0;
                        
                        return (
                          <>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <button 
                                className="btn-secondary" 
                                onClick={(e) => { e.stopPropagation(); handleBulkUpdateStatus(order.orderId || order.id, 'PREPARING'); }}
                                disabled={isLocked || !hasSelection}
                                style={{ 
                                  width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', 
                                  backgroundColor: '#991b1b', color: 'white', border: 'none',
                                  opacity: (isLocked || !hasSelection) ? 0.5 : 1,
                                  cursor: (isLocked || !hasSelection) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Prepare
                              </button>
                              {showHotkeys && isFocused && (
                                <span className="desktop-only" style={{ position: 'absolute', top: '-10px', right: '-5px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>P</span>
                              )}
                            </div>

                            <div style={{ position: 'relative', flex: 1 }}>
                              <button 
                                className="btn-primary" 
                                onClick={(e) => { e.stopPropagation(); handleBulkUpdateStatus(order.orderId || order.id, 'READY'); }}
                                disabled={!hasSelection}
                                style={{ 
                                  width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', 
                                  backgroundColor: 'var(--success-color)', border: 'none',
                                  opacity: !hasSelection ? 0.5 : 1,
                                  cursor: !hasSelection ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Mark Ready
                              </button>
                              {showHotkeys && isFocused && (
                                <span className="desktop-only" style={{ position: 'absolute', top: '-10px', right: '-5px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>D</span>
                              )}
                            </div>

                            <div style={{ position: 'relative', flex: 1 }}>
                              <button 
                                className="btn-danger" 
                                onClick={(e) => { e.stopPropagation(); handleBulkUpdateStatus(order.orderId || order.id, 'REJECTED'); }}
                                disabled={!hasSelection}
                                style={{ 
                                  width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', 
                                  backgroundColor: '#ef4444', color: 'white', border: 'none',
                                  opacity: !hasSelection ? 0.5 : 1,
                                  cursor: !hasSelection ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Reject
                              </button>
                              {showHotkeys && isFocused && (
                                <span className="desktop-only" style={{ position: 'absolute', top: '-10px', right: '-5px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>R</span>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {/* We can remove the old whole-order Reject button or keep it if needed */}
                      {/* Keeping it for now but maybe it's redundant if items can be rejected */}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* history modal - unchanged but keeping structure */}
      {showPastOrders && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px', position: 'relative', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '28px' }}>Order History</h2>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => { setShowPastOrders(false); setSelectedOrder(null); }}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                  Close
                </button>
                {showHotkeys && (
                  <span className="desktop-only" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ESC</span>
                )}
              </div>
            </div>

            {loadingPast ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Loading history...</p>
            ) : pastOrders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No previous orders found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <th style={{ padding: '8px 16px' }}>Order ID</th>
                      <th style={{ padding: '8px 16px' }}>Table</th>
                      <th style={{ padding: '8px 16px' }}>Items</th>
                      <th style={{ padding: '8px 16px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastOrders.map(order => (
                      <tr 
                        key={order.orderId || order.id} 
                        onClick={() => setSelectedOrder(order)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedOrder?.id === order.id ? 'var(--accent-bg)' : 'rgba(0,0,0,0.02)',
                          transition: 'transform 0.2s, background 0.2s',
                          borderRadius: '12px'
                        }}
                      >
                        <td style={{ padding: '16px', fontWeight: 'bold', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>#{order.orderId || order.id}</td>
                        <td style={{ padding: '16px' }}>{order.tableName || `Table ${order.tableId}`}</td>
                        <td style={{ padding: '16px' }}>{order.items?.length || 0} items</td>
                        <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                          <span style={{ 
                            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', 
                            backgroundColor: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status),
                            fontWeight: '700', textTransform: 'uppercase'
                          }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedOrder && (
              <div className="card" style={{ marginTop: '32px', padding: '30px', backgroundColor: 'var(--bg)', borderRadius: '20px', border: '2px solid var(--accent-border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '22px' }}>Details for Order #{selectedOrder.orderId || selectedOrder.id}</h3>
                  <button onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '8px' }}>Close Details</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px', color: 'var(--text-h)' }}>Order Items:</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedOrder.items?.map((item, idx) => (
                        <li key={idx} style={{ fontSize: '15px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{item.quantity}x</span> {item.menuItemName || item.menuItem?.name || item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', backgroundColor: 'var(--accent-bg)', borderRadius: '16px' }}>
                    <p style={{ margin: 0 }}><strong>Table:</strong> {selectedOrder.tableName || selectedOrder.tableId}</p>
                    <p style={{ margin: 0 }}><strong>Status:</strong> <span style={{ color: getStatusColor(selectedOrder.status), fontWeight: '700' }}>{selectedOrder.status}</span></p>
                    <p style={{ margin: 0 }}><strong>Total Amount:</strong> <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)' }}>₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectionOrder && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px', borderRadius: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>Reject Order?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Are you sure you want to reject order from <strong>{rejectionOrder.tableName}</strong>?
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>REJECTION NOTE (OPTIONAL)</label>
              <textarea 
                placeholder="e.g. Item out of stock, kitchen closed..." 
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', 
                  fontSize: '14px', minHeight: '80px', resize: 'none', outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setRejectionOrder(null)} 
                className="btn-secondary" 
                style={{ flex: 1, padding: '12px' }}
              >Cancel</button>
              <button 
                onClick={handleRejectOrder} 
                className="btn-danger" 
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' }}
              >Reject Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
