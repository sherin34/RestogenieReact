import { useState, useEffect } from 'react';
import api from '../services/api';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [subscriptionValid, setSubscriptionValid] = useState(true);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineOrders();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and sync
    if (navigator.onLine) {
      checkSubscription();
      syncOfflineOrders();
    } else {
      checkOfflineSubscription();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkSubscription = async () => {
    try {
      const res = await api.get('/subscription/status');
      setSubscriptionStatus(res.data);
      const { validTill } = res.data;
      localStorage.setItem('validTill', validTill);
      localStorage.setItem('subscriptionStatus', JSON.stringify(res.data));
      validateDate(validTill);
    } catch (err) {
      console.error('Subscription check failed', err);
      checkOfflineSubscription();
    }
  };

  const checkOfflineSubscription = () => {
    const validTill = localStorage.getItem('validTill');
    const status = localStorage.getItem('subscriptionStatus');
    if (status) setSubscriptionStatus(JSON.parse(status));
    if (validTill) {
      validateDate(validTill);
    }
  };

  const validateDate = (validTill) => {
    const expiryDate = new Date(validTill);
    const currentDate = new Date();
    if (currentDate > expiryDate) {
      setSubscriptionValid(false);
      setSubscriptionMessage('Subscription expired. Please renew to continue.');
    } else {
      setSubscriptionValid(true);
    }
  };

  const isReadOnly = !subscriptionValid && subscriptionStatus?.status !== 'GRACE_PERIOD';

  const syncOfflineOrders = async () => {
    const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
    if (offlineOrders.length === 0) return;

    setIsSyncing(true);
    try {
      await api.post('/orders/sync', offlineOrders);
      localStorage.setItem('offlineOrders', '[]');
      console.log('Offline orders synced successfully');
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveOfflineOrder = (order) => {
    const offlineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
    const newOrder = {
      ...order,
      clientOrderId: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    offlineOrders.push(newOrder);
    localStorage.setItem('offlineOrders', JSON.stringify(offlineOrders));
    return newOrder;
  };

  const cacheData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getCachedData = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  };

  return {
    isOffline,
    isSyncing,
    subscriptionValid,
    subscriptionStatus,
    subscriptionMessage,
    isReadOnly,
    saveOfflineOrder,
    cacheData,
    getCachedData,
    syncOfflineOrders
  };
};
