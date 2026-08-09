import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface InventoryItem {
  id: string;
  store_id: string;
  product_id: string;
  price: number;
  stock_count: number;
  is_available: boolean;
}

export const useInventorySync = (storeId: string) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchInventory = async () => {
      const { data } = await supabase
        .from('store_inventory')
        .select('*')
        .eq('store_id', storeId);
      if (data) setInventory(data as InventoryItem[]);
    };

    fetchInventory();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`admin-inventory-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_inventory',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setInventory((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as InventoryItem) : item
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return { inventory };
};
