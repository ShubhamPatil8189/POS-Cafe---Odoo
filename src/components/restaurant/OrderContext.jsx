import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isKitchenEligibleProduct } from '../../config/kitchenConfig';
import API_BASE_URL from '../../config';

const STORAGE_KEY = 'cafe-pos-kds-v1';

/** @deprecated use isKitchenEligibleProduct from kitchenConfig */
export function isKitchenProductName(name) {
  return isKitchenEligibleProduct({ name, category: undefined });
}

/**
 * Lines sent to KDS — shape matches a future API payload.
 * orderId on the ticket === POS order number (same as `id` on kitchen order).
 */
export function kitchenLinesFromCart(cart) {
  return cart
    .filter((item) =>
      isKitchenEligibleProduct({
        name: item.name,
        category: item.category,
        sendToKitchen: item.sendToKitchen,
      })
    )
    .map((item) => ({
      productId: item.id,
      name: item.name,
      qty: item.quantity,
      price: item.price,
      category: item.category?.name || item.category || null,
      sendToKitchen: item.sendToKitchen === true,
      prepared: false,
    }));
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const OrderContext = createContext(null);

export function OrderProvider({ children, onExternalPayment }) {
  const persisted = useRef(loadPersisted());
  const [orders, setOrders] = useState(() => persisted.current?.orders ?? []);
  const [nextOrderId, setNextOrderId] = useState(
    () => persisted.current?.nextOrderId ?? 101
  );
  const [kitchenPulse, setKitchenPulse] = useState(false);
  const [kitchenGlow, setKitchenGlow] = useState(false);
  const [kdsToasts, setKdsToasts] = useState([]);
  const [kitchenFilter, setKitchenFilter] = useState('all');

  const syncOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch(`${API_BASE_URL}/orders?limit=100`, { headers });
      if (!res.ok) return;
      const dbOrders = await res.json();
      
      // Fetch items for each order to build the full object
      const fullOrders = await Promise.all(dbOrders.map(async (dbo) => {
        const itemRes = await fetch(`${API_BASE_URL}/orders/${dbo.id}/items`, { headers });
        const items = itemRes.ok ? await itemRes.json() : [];
        
        return {
          id: dbo.id,
          orderNumber: dbo.order_number || `#${dbo.id}`,
          tableNumber: parseInt(dbo.table_id), // Assuming table_id is the number here, adjust if needed
          items: items.map(it => ({
            productId: it.product_id,
            name: it.product_name,
            qty: it.quantity,
            price: it.price,
            category: it.category_id, // Simplified
            prepared: dbo.status !== 'toCook'
          })),
          status: dbo.status === 'draft' ? 'toCook' : (dbo.status === 'toCook' ? 'toCook' : (dbo.status === 'preparing' ? 'preparing' : 'completed')),
          createdAt: new Date(dbo.created_at).getTime(),
          paid: dbo.is_paid === 1 || dbo.is_paid === true,
          source: dbo.source
        };
      }));

      // Merge with local only if new ones found or status changed
      setOrders(fullOrders);
    } catch (err) {
      console.error('Order sync error:', err);
    }
  }, []);

  useEffect(() => {
    syncOrders();
    const interval = setInterval(syncOrders, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [syncOrders]);

  useEffect(() => {
    // Only persist nextOrderId locally for POS-created draft numbers
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nextOrderId })
    );
  }, [nextOrderId]);

  const pushToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setKdsToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setKdsToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const removeKdsToast = useCallback((id) => {
    setKdsToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerKitchenIcon = useCallback(() => {
    setKitchenPulse(true);
    setKitchenGlow(true);
    setTimeout(() => {
      setKitchenPulse(false);
      setKitchenGlow(false);
    }, 2800);
  }, []);

  /**
   * @returns {boolean} true if at least one kitchen ticket was created
   */
  const sendToKitchen = useCallback(
    async (tableNumber, cart, isPaid = false) => {
      const lines = kitchenLinesFromCart(cart);
      if (lines.length === 0) {
        pushToast('Add a kitchen item (pizza, pasta, burger…) to send to KDS', 'preparing');
        return false;
      }

      try {
        const token = localStorage.getItem('token');
        
        // 1. Create order on backend
        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            order_type: 'pos',
            table_number: tableNumber,
            status: 'toCook'
          })
        });
        
        if (!orderRes.ok) throw new Error('Backend order creation failed');
        const dbOrder = await orderRes.json();

        // 2. Add items to backend order
        for (const line of lines) {
           await fetch(`${API_BASE_URL}/orders/${dbOrder.id}/items`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({
               product_id: line.productId,
               product_name: line.name,
               quantity: line.qty,
               price: line.price,
               tax_rate: 5
             })
           });
        }

        /** `id` is the backend database ID, but we also keep orderNumber for display */
        const order = {
          id: dbOrder.id,
          orderNumber: dbOrder.order_number || nextOrderId,
          tableNumber,
          items: lines,
          status: 'toCook',
          createdAt: Date.now(),
          paid: isPaid,
          source: 'pos',
        };

        setOrders((prev) => [...prev, order]);
        setNextOrderId((n) => n + 1);
        triggerKitchenIcon();
        pushToast('New Order Received 🍽️', 'success');
        return true;
      } catch (err) {
        console.error('Error syncing order to kitchen:', err);
        pushToast('Failed to sync order to server. Check connection.', 'error');
        return false;
      }
    },
    [nextOrderId, pushToast, triggerKitchenIcon]
  );

  const advanceOrder = useCallback(
    (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (order.status === 'toCook') {
        pushToast('Cooking Started 🔥', 'preparing');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
      } else if (order.status === 'preparing') {
        pushToast('Order Ready ✅', 'success');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed', completedAt: Date.now() } : o));
      }
    },
    [orders, pushToast]
  );

  const toggleItemPrepared = useCallback((orderId, itemIndex) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const items = o.items.map((it, i) =>
          i === itemIndex ? { ...it, prepared: !it.prepared } : it
        );
        return { ...o, items };
      })
    );
  }, []);

  const markPaid = useCallback(
    (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (order && !order.paid) {
        if (onExternalPayment) {
          setTimeout(() => onExternalPayment(order.tableNumber), 0);
        }
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paid: true } : o)));
        pushToast('Payment Completed ✔', 'success');
      }
    },
    [orders, pushToast, onExternalPayment]
  );

  const ordersByStatus = useMemo(() => {
    const buckets = { toCook: [], preparing: [], completed: [] };
    orders.forEach((o) => {
      if (buckets[o.status]) buckets[o.status].push(o);
    });
    return buckets;
  }, [orders]);

  const value = useMemo(
    () => ({
      orders,
      ordersByStatus,
      sendToKitchen,
      advanceOrder,
      toggleItemPrepared,
      markPaid,
      kitchenPulse,
      kitchenGlow,
      kdsToasts,
      removeKdsToast,
      kitchenFilter,
      setKitchenFilter,
    }),
    [
      orders,
      ordersByStatus,
      sendToKitchen,
      advanceOrder,
      toggleItemPrepared,
      markPaid,
      kitchenPulse,
      kitchenGlow,
      kdsToasts,
      removeKdsToast,
      kitchenFilter,
    ]
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
