import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import RegisterPage from './pages/auth/RegisterPage';
import Admin from './pages/admin/Admin';
import DashboardPage from './pages/dashboard/DashboardPage';
import POSPage from './pages/pos/POSPage';
import KitchenPage from './pages/kitchen/KitchenPage';
import BillingPage from './pages/billing/BillingPage';
import QRPage from './pages/qr/QRPage';
import QRGeneratorPage from './pages/admin/QRGeneratorPage';
import ReportsPage from './pages/reports/ReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        {/* Route Definitions */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/qr-codes" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QRGeneratorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WAITER']}>
                <POSPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'KITCHEN']}>
                <KitchenPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/billing" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WAITER']}>
                <BillingPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Public Route depending on business logic, assuming public for now */}
          <Route path="/qr/:tableId" element={<QRPage />} />
          
          {/* Default Route */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
