import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ReportsPage = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('today');
    const [customDates, setCustomDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    
    const [summary, setSummary] = useState(null);
    const [itemSales, setItemSales] = useState([]);
    const [sourceData, setSourceData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [statementData, setStatementData] = useState([]);
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    
    // Independent date state for Statement
    const [statementRange, setStatementRange] = useState('today');
    const [statementCustomDates, setStatementCustomDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const getDateParams = (range, custom = null) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (range === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (range === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (range === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (range === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
        } else if (range === 'custom') {
            return custom || customDates;
        }
        
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = getDateParams(dateRange);
            const [summaryRes, itemsRes, sourceRes, hourlyRes] = await Promise.all([
                api.get('/admin/reports/daily-summary', { params }),
                api.get('/admin/reports/item-sales', { params }),
                api.get('/admin/reports/order-source', { params }),
                api.get('/admin/reports/hourly-sales', { params })
            ]);

            setSummary(summaryRes.data);
            setItemSales(itemsRes.data);
            setSourceData(sourceRes.data);
            setHourlyData(hourlyRes.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            showToast('Failed to fetch report data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatement = async () => {
        try {
            const params = getDateParams(statementRange, statementCustomDates);
            const res = await api.get('/admin/reports/statement', { params });
            setStatementData(res.data);
        } catch (error) {
            showToast('Failed to fetch statement data', 'error');
        }
    };

    const handleDownloadCSV = () => {
        if (statementData.length === 0) return;
        
        const headers = ["Date", "Time", "Order ID", "Item ID", "Item Name", "Qty", "Rate", "GST %", "Tax Amount", "Total"];
        const rows = statementData.map(d => {
            const date = new Date(d.dateTime);
            const taxAmount = (d.total * d.tax) / 100;
            const grandTotal = d.total + taxAmount;
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                `#${d.orderId}`,
                d.itemId,
                d.itemName,
                d.quantity,
                d.rate,
                `${d.tax}%`,
                taxAmount.toFixed(2),
                grandTotal.toFixed(2)
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `statement_${statementRange}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, customDates]);

    useEffect(() => {
        fetchStatement();
    }, [statementRange, statementCustomDates]);

    return (
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ margin: 0, fontSize: '28px' }}>Reports</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label htmlFor="range-select" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Period:</label>
                        <select 
                            id="range-select"
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: '500',
                                outline: 'none'
                            }}
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    
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
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading report data...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Orders</p>
                            <h2 style={{ margin: 0, fontSize: '32px' }}>{summary?.totalOrders ?? 0}</h2>
                        </div>
                        <div className="card" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid var(--success-color)' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{dateRange === 'today' ? "Today's Revenue" : "Total Revenue"}</p>
                            <h2 style={{ margin: 0, fontSize: '32px' }}>₹{(summary?.totalRevenue ?? 0).toFixed(2)}</h2>
                        </div>
                        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Avg Order Value</p>
                            <h2 style={{ margin: 0, fontSize: '32px' }}>₹{(summary?.avgOrderValue ?? 0).toFixed(2)}</h2>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '24px' }}>
                        {/* Item Sales Table */}
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Item Sales ({dateRange === 'today' ? 'Today' : 'Period'})</h3>
                            {itemSales.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No items sold in this period.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '10px 4px', fontSize: '14px' }}>Item Name</th>
                                                <th style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'right' }}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemSales.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px 4px', fontSize: '14px' }}>{item.itemName}</td>
                                                    <td style={{ padding: '12px 4px', fontSize: '14px', textAlign: 'center' }}>{item.quantitySold}</td>
                                                    <td style={{ padding: '12px 4px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold' }}>₹{item.totalRevenue.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Order Source Table */}
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Order Sources</h3>
                            {sourceData.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No source data available.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '10px 4px', fontSize: '14px' }}>Source</th>
                                                <th style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'center' }}>Orders</th>
                                                <th style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'right' }}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sourceData.map((data, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px 4px', fontSize: '14px', fontWeight: 'bold' }}>{data.orderSource}</td>
                                                    <td style={{ padding: '12px 4px', fontSize: '14px', textAlign: 'center' }}>{data.totalOrders}</td>
                                                    <td style={{ padding: '12px 4px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold' }}>₹{data.totalRevenue.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Hourly Sales Table */}
                        <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Hourly Sales Trend ({dateRange === 'today' ? 'Today' : 'Period Summary'})</h3>
                            {hourlyData.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No hourly data available.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '10px 4px', fontSize: '14px' }}>Hour</th>
                                                <th style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'center' }}>Orders</th>
                                                <th style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'right' }}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hourlyData.map((data, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'transparent' }}>
                                                    <td style={{ padding: '10px 4px', fontSize: '14px' }}>{data.hour}</td>
                                                    <td style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'center' }}>{data.totalOrders}</td>
                                                    <td style={{ padding: '10px 4px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold' }}>₹{data.totalRevenue.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statement Accordion */}
                    <div className="card" style={{ marginTop: '32px', overflow: 'hidden', padding: 0 }}>
                        <div 
                            onClick={() => setIsStatementOpen(!isStatementOpen)}
                            style={{ 
                                padding: '20px 24px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                background: isStatementOpen ? 'var(--bg-secondary)' : 'transparent',
                                borderBottom: isStatementOpen ? '1px solid var(--border-color)' : 'none'
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Detailed Statement</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {statementData.length > 0 && isStatementOpen && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownloadCSV(); }}
                                        className="btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <span>📥</span> Download CSV
                                    </button>
                                )}
                                <span style={{ 
                                    transition: 'transform 0.3s', 
                                    transform: isStatementOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    fontSize: '20px'
                                }}>▾</span>
                            </div>
                        </div>
                        
                        {isStatementOpen && (
                            <div style={{ padding: '24px' }}>
                                {/* Statement Filters */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>STATEMENT PERIOD:</span>
                                    <select 
                                        value={statementRange} 
                                        onChange={(e) => setStatementRange(e.target.value)}
                                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                                    >
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="year">This Year</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                    
                                    {statementRange === 'custom' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="date" 
                                                value={statementCustomDates.startDate}
                                                onChange={(e) => setStatementCustomDates(prev => ({ ...prev, startDate: e.target.value }))}
                                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                                            />
                                            <input 
                                                type="date" 
                                                value={statementCustomDates.endDate}
                                                onChange={(e) => setStatementCustomDates(prev => ({ ...prev, endDate: e.target.value }))}
                                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {statementData.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No transactions found for this period.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                                    <th style={{ padding: '12px 6px' }}>Date/Time</th>
                                                    <th style={{ padding: '12px 6px' }}>Order</th>
                                                    <th style={{ padding: '12px 6px' }}>Item</th>
                                                    <th style={{ padding: '12px 6px', textAlign: 'center' }}>Qty</th>
                                                    <th style={{ padding: '12px 6px', textAlign: 'right' }}>Rate</th>
                                                    <th style={{ padding: '12px 6px', textAlign: 'center' }}>GST %</th>
                                                    <th style={{ padding: '12px 6px', textAlign: 'right' }}>Tax</th>
                                                    <th style={{ padding: '12px 6px', textAlign: 'right' }}>Gross Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statementData.map((data, idx) => {
                                                    const dateObj = new Date(data.dateTime);
                                                    const taxAmount = (data.total * data.tax) / 100;
                                                    const grandTotal = data.total + taxAmount;
                                                    
                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                                                            <td style={{ padding: '10px 6px' }}>
                                                                <div style={{ fontWeight: '600' }}>{dateObj.toLocaleDateString()}</div>
                                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </td>
                                                            <td style={{ padding: '10px 6px', color: 'var(--text-secondary)' }}>#{data.orderId}</td>
                                                            <td style={{ padding: '10px 6px' }}>
                                                                <div style={{ fontWeight: '500' }}>{data.itemName}</div>
                                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ID: {data.itemId}</div>
                                                            </td>
                                                            <td style={{ padding: '10px 6px', textAlign: 'center' }}>{data.quantity}</td>
                                                            <td style={{ padding: '10px 6px', textAlign: 'right' }}>₹{data.rate.toFixed(2)}</td>
                                                            <td style={{ padding: '10px 6px', textAlign: 'center' }}>{data.tax}%</td>
                                                            <td style={{ padding: '10px 6px', textAlign: 'right' }}>₹{taxAmount.toFixed(2)}</td>
                                                            <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 'bold' }}>₹{grandTotal.toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;
