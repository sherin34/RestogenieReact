import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { getRole } from '../../utils/auth';
import { useToast } from '../../context/ToastContext';
import TimelineChart from '../../components/admin/TimelineChart';

const DashboardPage = () => {
  const role = getRole();
  if (role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [customDates, setCustomDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const getDateParams = (range) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'custom') {
      return customDates;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const params = getDateParams(dateRange);
        const [summaryRes, topItemsRes, timelineRes, recentOrdersRes] = await Promise.all([
          api.get('/admin/dashboard/summary', { params }),
          api.get('/admin/dashboard/top-items', { params }),
          api.get('/admin/dashboard/timeline', { params }),
          api.get('/admin/dashboard/recent-orders'), // Always recent, regardless of filter
        ]);
        setSummary(summaryRes.data);
        setTopItems(topItemsRes.data);
        setTimelineData(timelineRes.data);
        setRecentOrders(recentOrdersRes.data);
      } catch (err) {
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [dateRange, customDates]);

  if (loading) {
    return (
      <div className="container">
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 32px)' }}>Dashboard</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Filter:</span>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="date" 
                value={customDates.startDate}
                onChange={(e) => setCustomDates(prev => ({ ...prev, startDate: e.target.value }))}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input 
                type="date" 
                value={customDates.endDate}
                onChange={(e) => setCustomDates(prev => ({ ...prev, endDate: e.target.value }))}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--success-color)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {dateRange === 'today' ? "Today's Revenue" : 'Total Revenue'}
          </p>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{summary?.totalRevenueToday != null ? summary.totalRevenueToday.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
        </div>

        <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--primary-color)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Total Orders
          </p>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {summary?.totalOrdersToday ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--success-color)', marginTop: '4px', fontWeight: '600' }}>
            {summary?.completedOrdersToday ?? 0} {dateRange === 'today' ? 'completed today' : 'completed'}
          </div>
        </div>

        <div className="card" style={{ padding: '24px', borderLeft: '4px solid #F59E0B' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Active Orders
          </p>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {summary?.activeOrdersCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Currently in kitchen/ready
          </div>
        </div>
        
        <div className="card" style={{ padding: '24px', borderLeft: '4px solid #EC4899' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Avg. Order Value
          </p>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{summary?.totalOrdersToday > 0 ? (summary.totalRevenueToday / summary.totalOrdersToday).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Metrics Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{dateRange === 'today' ? "Today's Performance" : "Performance Over Period"}</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {dateRange === 'today' ? 'Revenue and order distributions over the last 24 hours.' : `Revenue and order distributions for the selected ${dateRange}.`}
        </p>
        <TimelineChart data={timelineData} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '32px' }}>
        {/* Top Selling Items */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Top Selling Items ({dateRange === 'today' ? 'Today' : 'Period'})</h2>

          {topItems.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No sales data available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {topItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: index < topItems.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '28px', height: '28px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 'bold', flexShrink: 0
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontWeight: '500' }}>{item.itemName || item.name || item.menuItemName}</span>
                  </div>
                  <span style={{
                    background: 'var(--primary-color)10',
                    color: 'var(--primary-color)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    lineHeight: '1.2'
                  }}>
                    <span>{item.orderCount ?? 0} orders</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{item.totalQuantitySold ?? 0} items</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentOrders.map((order) => (
                <div key={order.orderId} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{order.tableName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Order #{order.orderId}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>₹{order.totalAmount?.toFixed(2)}</div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: order.status === 'COMPLETED' ? 'var(--success-color)' : 
                             order.status === 'CANCELLED' ? 'red' : 'var(--primary-color)',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
