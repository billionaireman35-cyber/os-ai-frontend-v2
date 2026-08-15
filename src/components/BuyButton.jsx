import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function BuyButton({ className = '' }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/moonpay/buy-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Open MoonPay widget in a new window
        const width = 600, height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
          data.url,
          '_blank',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      } else {
        toast.error(data.detail || 'Failed to generate buy URL');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ${className}`}
    >
      {loading ? 'Loading...' : 'Buy CLOSE with Card'}
    </button>
  );
}
