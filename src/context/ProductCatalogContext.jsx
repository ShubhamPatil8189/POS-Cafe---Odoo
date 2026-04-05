import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { INITIAL_PRODUCTS } from '../data/productCatalog';
import API_BASE_URL from '../config';

const STORAGE_KEY = 'cafe-product-catalog-v1';

function mergeWithSeed(savedList) {
  const byId = new Map(INITIAL_PRODUCTS.map((p) => [p.id, { ...p }]));
  
  // 1. Overwrite initial products with saved versions
  // 2. Insert any new products that are not in the initial set (like the 40 new ones)
  for (const p of savedList) {
    const existing = byId.get(p.id) || {};
    byId.set(p.id, { ...existing, ...p });
  }

  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

function loadProductsFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PRODUCTS.map((p) => ({ ...p }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_PRODUCTS.map((p) => ({ ...p }));
    return mergeWithSeed(parsed);
  } catch {
    return INITIAL_PRODUCTS.map((p) => ({ ...p }));
  }
}

const ProductCatalogContext = createContext(null);

export function ProductCatalogProvider({ children }) {
  const [products, setProducts] = useState(loadProductsFromLocal);
  const [loading, setLoading] = useState(false);

  // Sync with Backend
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (response.ok) {
        const data = await response.json();
        const merged = mergeWithSeed(data);
        setProducts(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Backend products fetch failed, using local storage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(product)
      });
      if (response.ok) {
        await fetchProducts(); // Refresh from DB
      } else {
        // Fallback for demo if backend fails
        setProducts((prev) => {
          const newId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 101;
          return [...prev, { ...product, id: newId }];
        });
      }
    } catch (err) {
      console.error('Failed to add product to DB:', err);
      // Fallback to local
      setProducts((prev) => {
        const newId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 101;
        return [...prev, { ...product, id: newId }];
      });
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id, patch) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(patch)
      });
      if (response.ok) {
        await fetchProducts();
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
        );
      }
    } catch (err) {
      console.error('Failed to update product in DB:', err);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        await fetchProducts();
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete product from DB:', err);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }, [fetchProducts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const kitchenProductCount = useMemo(
    () => products.filter((p) => p.sendToKitchen).length,
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      loading,
      addProduct,
      updateProduct,
      deleteProduct,
      kitchenProductCount,
      refresh: fetchProducts
    }),
    [products, loading, addProduct, updateProduct, deleteProduct, kitchenProductCount, fetchProducts]
  );

  return (
    <ProductCatalogContext.Provider value={value}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog() {
  const ctx = useContext(ProductCatalogContext);
  if (!ctx) {
    throw new Error('useProductCatalog must be used within ProductCatalogProvider');
  }
  return ctx;
}
