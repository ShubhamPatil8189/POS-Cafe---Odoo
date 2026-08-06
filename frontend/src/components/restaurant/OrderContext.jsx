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

export function fullLinesFromCart(cart) {
  return cart.map((item) => {
    const isKitchen = isKitchenEligibleProduct({
      name: item.name,
      category: item.category,
      sendToKitchen: item.sendToKitchen,
    });
    return {
      productId: item.id,
      name: item.name,
      qty: item.quantity,
      price: item.price,
      category: item.category?.name || item.category || null,
      sendToKitchen: isKitchen,
      prepared: !isKitchen,
      tax: item.tax || 0,
    };
  });
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
          tableId: dbo.table_id,
          tableNumber: dbo.table_number || dbo.table_id,
          total: parseFloat(dbo.total || 0),
          items: items.map(it => ({
            productId: it.product_id,
            name: it.product_name,
            qty: parseFloat(it.quantity || 1),
            price: parseFloat(it.unit_price || 0),
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

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const { orders: newOrders, nextOrderId: newNextId } = JSON.parse(e.newValue);
          setOrders(newOrders || []);
          setNextOrderId(newNextId || 101);
        } catch (err) {
          console.error("Sync error:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
    async (tableId, tableNumber, cart, customerName = null, isPaid = false, paymentMethodType = 'cash', sessionId = null) => {
      const lines = fullLinesFromCart(cart);
      if (lines.length === 0) return false;

      const hasPrepItems = lines.some((l) => l.sendToKitchen);

      try {
        const token = localStorage.getItem('token');
        
        // 1. Create order on backend
        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            order_type: 'pos',
            table_id: tableId,
            session_id: sessionId,
            customer_name: customerName,
            status: hasPrepItems ? 'toCook' : 'completed',
            is_paid: 0 // We will update this later if isPaid is true
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
               tax_rate: line.tax
             })
           });
        }

        if (isPaid) {
          await fetch(`${API_BASE_URL}/orders/${dbOrder.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: hasPrepItems ? 'toCook' : 'completed', is_paid: true, payment_method_type: paymentMethodType, session_id: sessionId })
          });
        }

        const order = {
          id: dbOrder.id,
          orderNumber: dbOrder.order_number || nextOrderId,
          tableId,
          tableNumber,
          customerName,
          items: lines,
          status: hasPrepItems ? 'toCook' : 'completed',
          createdAt: Date.now(),
          paid: isPaid,
          source: 'pos',
        };

        setOrders((prev) => [...prev, order]);
        setNextOrderId((n) => n + 1);

        if (hasPrepItems) {
          triggerKitchenIcon();
          pushToast('New Order Received 🍽️', 'success');
        } else {
          pushToast('Order locally completed ✅', 'success');
        }
        return true;
      } catch (err) {
        console.error('Error syncing order to kitchen:', err);
        pushToast('Failed to sync order to server.', 'error');
        return false;
      }
    },
    [nextOrderId, pushToast, triggerKitchenIcon]
  );

  const advanceOrder = useCallback(
    async (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      let nextStatus = '';
      if (order.status === 'toCook') {
        nextStatus = 'preparing';
      } else if (order.status === 'preparing') {
        nextStatus = 'completed';
      }

      if (!nextStatus) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: nextStatus })
        });

        if (response.ok) {
          if (nextStatus === 'preparing') {
            pushToast('Cooking Started 🔥', 'preparing');
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
          } else if (nextStatus === 'completed') {
            pushToast('Order Ready ✅', 'success');
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed', completedAt: Date.now() } : o));
          }
        } else {
          const errorData = await response.json();
          pushToast(errorData.error || 'Failed to update status on server.', 'error');
        }
      } catch (err) {
        console.error('Error advancing order status:', err);
        pushToast('Network error while advancing status.', 'error');
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
    async (orderId, paymentMethodType = 'cash', sessionId = null) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/orders/${order.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'completed', is_paid: true, payment_method_type: paymentMethodType, session_id: sessionId })
        });

        if (response.ok) {
          if (onExternalPayment) {
            setTimeout(() => onExternalPayment(order.tableNumber), 0);
          }
          setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paid: true, status: 'completed' } : o)));
          pushToast('Payment Completed ✔', 'success');
        } else {
          const errorData = await response.json();
          pushToast(errorData.error || 'Failed to complete payment on server.', 'error');
        }
      } catch (err) {
        console.error('Error completing payment:', err);
        pushToast('Network error while completing payment.', 'error');
      }
    },
    [orders, pushToast, onExternalPayment]
  );

  const markTableOrdersPaid = useCallback(
    async (tableNumber, paymentMethodType = 'cash', sessionId = null) => {
      const ordersToPay = orders.filter(o => o.tableNumber === tableNumber && !o.paid);
      for (const o of ordersToPay) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${API_BASE_URL}/orders/${o.id}/status`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({ status: 'completed', is_paid: true, payment_method_type: paymentMethodType, session_id: sessionId })
          });
        } catch (e) {
          console.error(e);
        }
      }
      setOrders(prev => prev.map(o => o.tableNumber === tableNumber ? { ...o, paid: true, status: 'completed' } : o));
    },
    [orders]
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
      markTableOrdersPaid,
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
      markTableOrdersPaid,
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
