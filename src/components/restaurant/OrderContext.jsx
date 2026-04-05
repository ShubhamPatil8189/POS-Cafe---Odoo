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
      category: item.category ?? null,
      sendToKitchen: isKitchen,
      prepared: !isKitchen,
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

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ orders, nextOrderId })
    );
  }, [orders, nextOrderId]);

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
    (tableNumber, cart, customerName = null, isPaid = false) => {
      const lines = fullLinesFromCart(cart);
      if (lines.length === 0) return false;

      const hasPrepItems = lines.some((l) => l.sendToKitchen);

      /** `id` is the order number shown as Ticket # / Order # on KDS and Orders page */
      const order = {
        id: nextOrderId,
        orderNumber: nextOrderId,
        tableNumber,
        customerName,
        items: lines,
        status: hasPrepItems ? 'toCook' : 'completed',
        createdAt: Date.now(),
        completedAt: hasPrepItems ? undefined : Date.now(),
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

  const markTableOrdersPaid = useCallback(
    (tableNumber) => {
      setOrders(prev => prev.map(o => o.tableNumber === tableNumber ? { ...o, paid: true } : o));
    },
    []
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
