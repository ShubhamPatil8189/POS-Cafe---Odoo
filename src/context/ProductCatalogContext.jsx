import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { INITIAL_PRODUCTS } from '../data/productCatalog';

const STORAGE_KEY = 'cafe-product-catalog-v1';

function mergeWithSeed(savedList) {
  const byId = new Map(INITIAL_PRODUCTS.map((p) => [p.id, { ...p }]));
  for (const p of savedList) {
    if (byId.has(p.id)) {
      byId.set(p.id, { ...byId.get(p.id), ...p });
    }
  }
  for (const p of INITIAL_PRODUCTS) {
    if (!byId.has(p.id)) byId.set(p.id, { ...p });
  }
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

function loadProducts() {
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
  const [products, setProducts] = useState(loadProducts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const updateProduct = useCallback((id, patch) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const kitchenProductCount = useMemo(
    () => products.filter((p) => p.sendToKitchen).length,
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      updateProduct,
      kitchenProductCount,
    }),
    [products, updateProduct, kitchenProductCount]
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
