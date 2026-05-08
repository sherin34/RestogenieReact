import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { getRole } from '../../utils/auth';
import { useToast } from '../../context/ToastContext';

const BillingPage = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState(null);
  const [isFetchingBill, setIsFetchingBill] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [focusedOrderIndex, setFocusedOrderIndex] = useState(0);
  const [showHotkeys, setShowHotkeys] = useState(true);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Accessible for ADMIN and WAITER roles
  const role = getRole();
  if (role !== 'WAITER' && role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders?status=READY,PREPARING');
      // Filter for orders that have at least one READY item, then sort
      const data = response.data
        .filter(o => o.items && o.items.some(i => i.status === 'READY'))
        .sort((a, b) => (b.orderId || b.id) - (a.orderId || a.id));
      setOrders(data);
      if (data.length > 0) setFocusedOrderIndex(0);
    } catch (err) {
      showToast('Failed to fetch orders ready for billing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryOrders = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/orders?status=COMPLETED');
      // Sort descending by ID
      const data = response.data.sort((a, b) => (b.orderId || b.id) - (a.orderId || a.id));
      setHistoryOrders(data);
      setCurrentPage(1); // Reset to first page when opening history
    } catch (err) {
      showToast('Failed to fetch billing history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const handleGenerateBill = async (orderId) => {
    // Check if there are any pending items in the kitchen for this order
    const order = orders.find(o => (o.orderId || o.id) === orderId);
    if (order && order.items && order.items.some(i => i.status !== 'READY' && i.status !== 'REJECTED')) {
      showToast('There are still items pending in the kitchen. Please complete or reject them before generating the bill.', 'error');
      return;
    }

    setIsFetchingBill(true);
    try {
      const response = await api.get(`/orders/${orderId}/bill`);
      setBill(response.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not generate bill', 'error');
    } finally {
      setIsFetchingBill(false);
    }
  };

  const handleCompletePayment = async (orderId) => {
    // Check if there are any pending items in the kitchen for this order
    const order = orders.find(o => (o.orderId || o.id) === orderId);
    if (order && order.items && order.items.some(i => i.status !== 'READY' && i.status !== 'REJECTED')) {
      showToast('There are still items pending in the kitchen. Please complete or reject them before closing the bill.', 'error');
      return;
    }

    try {
      await api.put(`/orders/${orderId}/status?status=COMPLETED`);
      showToast('Order completed successfully!', 'success');
      setBill(null);
      fetchReadyOrders(); // Refresh the list
    } catch (err) {
      showToast('Failed to complete order status', 'error');
    }
  };

  const toggleOrderItemStatus = async (orderId, itemId, currentStatus) => {
    const newStatus = currentStatus === 'READY' ? 'PENDING' : 'READY';
    try {
      await api.put(`/orders/${orderId}/items/${itemId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => {
        if (o.orderId === orderId) {
          return {
            ...o,
            items: o.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i)
          };
        }
        return o;
      }));
    } catch (err) {
      showToast('Failed to update item status', 'error');
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async (orderId) => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/billing/${orderId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    } finally {
      setIsDownloading(false);
    }
  };


  const handlePrint = async (orderId) => {
    setIsPrinting(true);
    try {
      // Fetch the PDF from backend
      const response = await api.get(`/billing/${orderId}/pdf`, {
        responseType: 'blob',
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      // Create a hidden iframe to trigger the print dialog
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileURL;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Cleanup after a delay to ensure printing starts
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(fileURL);
          setIsPrinting(false);
        }, 1000);
      };
    } catch (err) {
      showToast('Failed to generate PDF bill', 'error');
      console.error(err);
      setIsPrinting(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Modal Context: Bill Modal
      if (bill) {
        if (e.key === 'Escape') {
          setBill(null);
          return;
        }
        if (e.key === 'p' || e.key === 'P' || e.key === 'Enter') {
          const order = orders.find(o => o.orderId === bill.orderId);
          handlePrint(bill.orderId).then(() => {
            if (order) handleCompletePayment(bill.orderId);
            else setBill(null);
          });
          return;
        }
        return;
      }

      // Modal Context: History Modal
      if (showHistory) {
        if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') {
          setShowHistory(false);
          return;
        }
        return;
      }

      // Main Page Context
      // Refresh
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchReadyOrders();
      }

      // History
      if (e.key === 'h' || e.key === 'H') {
        setShowHistory(true);
        fetchHistoryOrders();
      }

      // Selection: 1 to 9, 0 for 10
      if (e.key >= '0' && e.key <= '9') {
        const index = e.key === '0' ? 9 : parseInt(e.key) - 1;
        if (index < orders.length) {
          setFocusedOrderIndex(index);
        }
      }

      // Arrows
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusedOrderIndex(prev => Math.min(prev + 1, orders.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusedOrderIndex(prev => Math.max(prev - 1, 0));
      }

      // Generate Bill
      if (e.key === 'Enter' || e.key === 'F4') {
        e.preventDefault();
        const activeOrder = orders[focusedOrderIndex];
        if (activeOrder) {
          handleGenerateBill(activeOrder.orderId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, bill, showHistory, focusedOrderIndex, isPrinting, isFetchingBill]);

  // Pagination Logic
  const totalPages = Math.ceil(historyOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistoryOrders = historyOrders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Hotkey Legend / Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', alignItems: 'center', marginBottom: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>1-0</span> Select Table
          <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>ENTER</span> Generate Bill
          <span style={{ fontWeight: '700', padding: '2px 6px', background: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }}>R</span> Refresh
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

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 32px)' }}>Billing Terminal</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setShowHistory(true);
                fetchHistoryOrders();
              }}
            >
              📜 Billing History
            </button>
            {showHotkeys && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>H</span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn-secondary" onClick={fetchReadyOrders} disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Refresh List'}
            </button>
            {showHotkeys && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>R</span>
            )}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No orders currently ready for billing.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {orders.map((order, index) => {
            const isFocused = focusedOrderIndex === index;
            return (
              <div 
                key={order.orderId} 
                className={`card ${isFocused ? 'focused-billing-card' : ''}`}
                onClick={() => setFocusedOrderIndex(index)}
                style={{ 
                  padding: '24px', 
                  borderTop: '5px solid var(--success-color)',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: isFocused ? '0 0 0 3px var(--primary-color), 0 10px 25px rgba(0,0,0,0.1)' : 'var(--shadow)',
                  transform: isFocused ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Selection Hotkey Indicator */}
                {showHotkeys && index < 10 && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '-10px',
                    width: '24px', height: '24px', backgroundColor: 'black', color: 'white',
                    borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 'bold', zIndex: 10
                  }}>
                    {index === 9 ? '0' : index + 1}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>{order.tableName}</h3>
                  <span className="badge" style={{ 
                    backgroundColor: order.status === 'READY' ? '#f0fdf4' : '#fef9c3', 
                    color: order.status === 'READY' ? 'var(--success-color)' : '#854d0e', 
                    padding: '4px 12px', 
                    border: order.status === 'READY' ? '1px solid #bbf7d0' : '1px solid #fef08a', 
                    borderRadius: '20px', fontSize: '12px', fontWeight: '700' 
                  }}>
                    {order.status}
                  </span>
                </div>
                
                <div style={{ marginBottom: '16px', maxHeight: '120px', overflowY: 'auto' }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {order.items && order.items.filter(item => item.status === 'READY').map((item, i) => {
                      const isItemReady = item.status === 'READY';
                      return (
                        <li 
                          key={item.id || i}
                          onClick={(e) => { e.stopPropagation(); toggleOrderItemStatus(order.orderId, item.id, item.status); }}
                          style={{ 
                            display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', 
                            fontSize: '14px', cursor: 'pointer', opacity: 1 
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '4px',
                            border: `1px solid var(--success-color)`,
                            backgroundColor: 'var(--success-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '12px', flexShrink: 0
                          }}>
                            {isItemReady && '✓'}
                          </div>
                          <span style={{ fontWeight: '700' }}>{item.quantity}x</span>
                          <span style={{ 
                            textDecoration: 'none',
                            color: 'var(--text-primary)'
                          }}>
                            {item.menuItemName || item.name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '22px' }}>
                    ₹{parseFloat(order.items?.reduce((sum, item) => {
                      if (item.status !== 'READY') return sum;
                      const price = parseFloat(item.totalPrice || 0);
                      const tax = parseFloat(item.taxPercentage || 0);
                      return sum + price + (price * tax / 100);
                    }, 0) || 0).toFixed(2)}
                  </span>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="btn-primary" 
                      onClick={(e) => { e.stopPropagation(); handleGenerateBill(order.orderId); }}
                      disabled={isFetchingBill}
                      style={{ padding: '10px 20px', borderRadius: '10px' }}
                    >
                      Generate Bill
                    </button>
                    {showHotkeys && isFocused && (
                      <span style={{ position: 'absolute', top: '-10px', right: '-5px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>ENTER</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
             backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 900, padding: '20px'
          }}
          onClick={() => setShowHistory(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Billing History</h2>
              <div style={{ position: 'relative' }}>
                <button className="btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
                {showHotkeys && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ESC</span>
                )}
              </div>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingHistory ? (
                <p style={{ textAlign: 'center', padding: '40px' }}>Loading history...</p>
              ) : historyOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px' }}>No completed orders found.</p>
              ) : (
                <>
                  <div className="table-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)' }}>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px 16px' }}>Order ID</th>
                          <th style={{ padding: '12px 16px' }}>Table</th>
                          <th style={{ padding: '12px 16px' }}>Amount</th>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentHistoryOrders.map(order => (
                          <tr key={order.orderId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px', fontWeight: 'bold' }}>#{order.orderId}</td>
                            <td style={{ padding: '16px' }}>{order.tableName}</td>
                            <td style={{ padding: '16px', fontWeight: '600' }}>₹{parseFloat(order.totalAmount).toFixed(2)}</td>
                            <td style={{ padding: '16px' }}>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                                onClick={() => handleGenerateBill(order.orderId)}
                              >
                                Reprint Bill
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', paddingBottom: '8px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', minWidth: '40px' }} 
                        onClick={() => setCurrentPage(1)} 
                        disabled={currentPage === 1}
                      >
                        «
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', minWidth: '40px' }} 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                      >
                        ‹
                      </button>

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (totalPages > 5) {
                          if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                            return (
                              <button
                                key={pageNum}
                                className={currentPage === pageNum ? "btn-primary" : "btn-secondary"}
                                style={{ padding: '6px 12px', minWidth: '40px' }}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} style={{ padding: '0 4px' }}>...</span>;
                          return null;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={currentPage === pageNum ? "btn-primary" : "btn-secondary"}
                            style={{ padding: '6px 12px', minWidth: '40px' }}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', minWidth: '40px' }} 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                      >
                        ›
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', minWidth: '40px' }} 
                        onClick={() => setCurrentPage(totalPages)} 
                        disabled={currentPage === totalPages}
                      >
                        »
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {bill && (
        <div
          onClick={() => setBill(null)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card modal-receipt-card"
            style={{ 
              width: '100%', 
              maxWidth: '450px', 
              padding: '30px', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div className="receipt-container">
              {/* Shop Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px dashed var(--border-color)' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>{bill.shopInfo?.shopName || 'RestoGenie'}</h2>
                {bill.shopInfo?.address && (
                  <div style={{ margin: '2px 0', fontSize: '12px', opacity: 0.8, lineHeight: '1.4' }}>
                    {bill.shopInfo.address.length > 45 ? (
                      <>
                        <div>{bill.shopInfo.address.substring(0, bill.shopInfo.address.lastIndexOf(" ", 45))}</div>
                        <div>{bill.shopInfo.address.substring(bill.shopInfo.address.lastIndexOf(" ", 45)).trim()}</div>
                      </>
                    ) : (
                      bill.shopInfo.address
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
                  {bill.shopInfo?.phone && <span style={{ fontSize: '12px', fontWeight: '600' }}>Ph: {bill.shopInfo.phone}</span>}
                  {bill.shopInfo?.gstNumber && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>GSTIN: {bill.shopInfo.gstNumber}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: '600' }}>
                <span>Order #{bill.orderId}</span>
                <span>Table: {bill.tableName}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {new Date().toLocaleString()}
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '8px 0', fontSize: '13px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '13px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 0', fontSize: '15px', fontWeight: '500' }}>{item.itemName}</td>
                      <td style={{ textAlign: 'center', padding: '10px 0', fontSize: '15px' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '15px', fontWeight: '600' }}>₹{parseFloat(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span>Subtotal</span>
                  <span>₹{parseFloat(bill.subtotal).toFixed(2)}</span>
                </div>
                {bill.gstAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                    <span>Total GST</span>
                    <span>₹{parseFloat(bill.gstAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '20px', marginTop: '10px', color: 'var(--text-primary)', borderTop: '2px solid var(--border-color)', paddingTop: '10px' }}>
                  <span>TOTAL</span>
                  <span>₹{parseFloat(bill.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* GST Breakup Table */}
              {bill.gstBreakup && bill.gstBreakup.length > 0 && (
                <div style={{ marginTop: '20px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'uppercase' }}>GST Breakup</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', opacity: 0.7 }}>
                        <th style={{ padding: '4px 0' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>Taxable</th>
                        <th style={{ textAlign: 'right' }}>CGST</th>
                        <th style={{ textAlign: 'right' }}>SGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.gstBreakup.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '4px 0' }}>{row.taxRate}%</td>
                          <td style={{ textAlign: 'right' }}>{row.taxableAmount.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>{row.cgstAmount.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>{row.sgstAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {bill.shopInfo?.footerMessage && (
                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  {bill.shopInfo.footerMessage}
                </p>
              )}
            </div>


            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => handleDownloadPDF(bill.orderId)}
                disabled={isDownloading}
                style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px' }}
              >
                <span>{isDownloading ? '...' : '📥'}</span> Download PDF
              </button>
              <div style={{ flex: 2, position: 'relative' }}>
                <button 
                  className="btn-primary" 
                  onClick={async () => { 
                    await handlePrint(bill.orderId); 
                    const order = orders.find(o => o.orderId === bill.orderId);
                    if (order) {
                      handleCompletePayment(bill.orderId); 
                    } else {
                      setBill(null);
                    }
                  }} 
                  disabled={isPrinting}
                  style={{ width: '100%', padding: '12px', backgroundColor: 'var(--success-color)', borderRadius: '10px', fontSize: '15px', fontWeight: '700' }}
                >
                  {isPrinting ? 'Printing...' : (orders.find(o => o.orderId === bill.orderId) ? 'Print & Complete' : 'Print Again')}
                </button>
                {showHotkeys && (
                  <span style={{ position: 'absolute', top: '-10px', right: '-5px', background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>P / ENTER</span>
                )}
              </div>
            </div>
            
            <button 
              className="btn-secondary" 
              onClick={() => setBill(null)} 
              style={{ width: '100%', marginTop: '12px', padding: '10px', border: 'none', color: 'var(--text-secondary)', fontSize: '13px' }}
            >
              Close Modal (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
