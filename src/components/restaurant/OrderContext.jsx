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
      category: item.category ?? null,
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

export function OrderProvider({ children }) {
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
    (tableNumber, cart) => {
      const lines = kitchenLinesFromCart(cart);
      if (lines.length === 0) {
        pushToast('Add a kitchen item (pizza, pasta, burger…) to send to KDS', 'preparing');
        return false;
      }

      /** `id` is the order number shown as Ticket # / Order # on KDS and Orders page */
      const order = {
        id: nextOrderId,
        orderNumber: nextOrderId,
        tableNumber,
        items: lines,
        status: 'toCook',
        createdAt: Date.now(),
        paid: false,
        source: 'pos',
      };

      setOrders((prev) => [...prev, order]);
      setNextOrderId((n) => n + 1);
      triggerKitchenIcon();
      pushToast('New Order Received 🍽️', 'success');
      return true;
    },
    [nextOrderId, pushToast, triggerKitchenIcon]
  );

  const advanceOrder = useCallback(
    (orderId) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          if (o.status === 'toCook') {
            pushToast('Cooking Started 🔥', 'preparing');
            return { ...o, status: 'preparing' };
          }
          if (o.status === 'preparing') {
            pushToast('Order Ready ✅', 'success');
            return { ...o, status: 'completed' };
          }
          return o;
        })
      );
    },
    [pushToast]
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paid: true } : o))
      );
      pushToast('Payment Completed ✔', 'success');
    },
    [pushToast]
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
