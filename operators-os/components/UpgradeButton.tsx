'use client';

import { useState } from 'react';

interface UpgradeButtonProps {
  userId: string;
}

export default function UpgradeButton({ userId }: UpgradeButtonProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          priceId: 'price_1TxbhN00WvSfpixtXwY5oFx1' 
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert(data.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading}
      className="px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
    >
      {loading ? 'Initializing...' : 'Upgrade to Pro - $49.99/mo'}
    </button>
  );
}