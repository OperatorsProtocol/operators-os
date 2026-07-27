'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UpgradeButtonProps {
  userId?: string;
}

export default function UpgradeButton({ userId }: UpgradeButtonProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // Fallback: grab user ID directly from Supabase session if prop is missing
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        activeUserId = session?.user?.id;
      }

      if (!activeUserId) {
        alert('Authentication error: Please sign out and sign back in.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: activeUserId,
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
      alert('Checkout connection error.');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading}
      className="px-6 py-2 font-bold text-black bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-[0_0_10px_rgba(234,179,8,0.3)] disabled:opacity-50"
    >
      {loading ? 'Initializing...' : 'Upgrade to Pro - $49.99/mo'}
    </button>
  );
}