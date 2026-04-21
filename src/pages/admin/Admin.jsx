import React, { useState } from 'react';
import TablesManagement from '../../components/admin/TablesManagement';
import CategoryManagement from '../../components/admin/CategoryManagement';
import MenuItemManagement from '../../components/admin/MenuItemManagement';
import BillingSettings from '../../components/admin/BillingSettings';
import StaffManagement from '../../components/admin/StaffManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('billing');

  const tabs = [
    { id: 'billing', label: 'Billing Settings', icon: '🧾' },
    { id: 'tables', label: 'Tables', icon: '🪑' },
    { id: 'categories', label: 'Categories', icon: '📁' },
    { id: 'items', label: 'Menu Items', icon: '🍔' },
    { id: 'staff', label: 'Staff Management', icon: '👥' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'billing': return <BillingSettings />;
      case 'tables': return <TablesManagement />;
      case 'categories': return <CategoryManagement />;
      case 'items': return <MenuItemManagement />;
      case 'staff': return <StaffManagement />;
      default: return <BillingSettings />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar / Tab bar */}
      <aside className="admin-sidebar">
        <h1 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--primary-color)', fontWeight: '700' }}>
          Admin Panel
        </h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="admin-content">
        <div className="card" style={{ padding: '20px', minHeight: '300px' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
