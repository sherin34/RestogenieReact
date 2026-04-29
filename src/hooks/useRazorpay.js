import { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePayment = async (plan) => {
    setLoading(true);
    try {
      // 1. Create order on the backend with the selected plan
      const orderResponse = await api.post('/payments/create-order', { plan });
      const { orderId, amount: orderAmount, currency, key, restaurantName, description } = orderResponse.data;

      // 2. Configure Razorpay options
      const options = {
        key: key,
        amount: orderAmount,
        currency: currency,
        name: restaurantName || "RestoGenie",
        description: description || "Subscription Payment",
        order_id: orderId,
        handler: async (response) => {
          // 3. Verify payment on the backend
          try {
            const verifyResponse = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan
            });

            if (verifyResponse.status === 200) {
              showToast("Payment successful. Subscription activated.", "success");
              // Refresh page or update state to reflect active subscription
              window.location.reload();
            }
          } catch (verifyErr) {
            console.error("Verification failed", verifyErr);
            showToast(verifyErr.response?.data?.message || "Payment verification failed", "error");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#2563eb"
        }
      };

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        showToast(response.error.description || "Payment failed", "error");
      });
      rzp.open();
    } catch (err) {
      console.error("Order creation failed", err);
      showToast(err.response?.data?.message || "Failed to initiate payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return { handlePayment, loading };
};
