/**
 * Kitchen Display routing — which POS lines appear on the KDS.
 * Today: static config. Later: fetch from backend, e.g. GET /api/settings/kitchen-routes
 *
 * Backend contract (suggested):
 * - POS POST /api/orders/:id/send-kitchen → creates kitchen_ticket with same `orderId` as POS order id
 * - KDS GET /api/kitchen/tickets → [{ orderId, tableNumber, status, items[], createdAt, paid }]
 * - Item: { productId?, name, quantity, category?, prepared }
 */

/** Category slugs from menu — entire category goes to kitchen when listed here */
export const KITCHEN_CATEGORIES = new Set([
  'italian',
  'pizza',
  'pizzas',
  'pizzasa',
  'burger',
  'burgers',
  'pasta',
  'pastas',
  'dessert',
  'desserts',
  'snack',
  'snacks',
  'main',
  'mains',
  'chinese',
  'indian',
  'continental',
  'maggi',
]);

/** Extra routing by product name (e.g. "Classic Burger" under continental) */
export const KITCHEN_NAME_KEYWORDS = [
  'pizza',
  'burger',
  'pasta',
  'penne',
  'lasagna',
  'spaghetti',
  'ravioli',
  'carbonara',
  'arrabbiata',
  'sandwich',
  'fries',
  'maggi',
  'maggie',
  'roll',
  'coffee',
  'espresso',
  'omelette',
  'chicken',
  'paneer',
  'tikka',
  'momo',
  'dumpling',
  'farmhouse',
  'margherita',
  'alfredo',
  'pink sauce',
  'red sauce',
  'white sauce',
];

export function nameMatchesKitchenKeywords(name) {
  const n = String(name).toLowerCase();
  return KITCHEN_NAME_KEYWORDS.some((k) => n.includes(k));
}

/**
 * Kitchen routing — order of precedence (matches backend “product.kitchen” flag):
 * 1. `sendToKitchen` from Product Management / catalog (source of truth)
 * 2. Legacy: category allow-list + name keywords (older rows without flag)
 *
 * @param {{ name: string, category?: string, sendToKitchen?: boolean }} product
 */
export function isKitchenEligibleProduct(product) {
  if (!product?.name) return false;
  
  // If explicitly flagged for kitchen, return true immediately
  if (product.sendToKitchen === true || product.sendToKitchen === 'true') {
    return true;
  }
  
  // Note: We removed the hard 'return false' here so that even if the flag is off/missing, 
  // name-based keywords can still catch items (e.g. "Pizza" in name) and route them to KDS.
  
  // Safe category check - handles both string slugs and legacy object structures
  const cat = typeof product.category === 'object' ? product.category?.name : product.category;
  if (cat && KITCHEN_CATEGORIES.has(String(cat).toLowerCase())) {
    return true;
  }
  
  // Fallback to name keywords
  return nameMatchesKitchenKeywords(product.name);
}

/** Human-readable labels for the Kitchen header (sync with KITCHEN_CATEGORIES) */
export const KITCHEN_CATEGORY_LABELS = {
  italian: 'Italian (kitchen)',
};

export function getKitchenConfigSummary() {
  const cats = [...KITCHEN_CATEGORIES].map(
    (c) => KITCHEN_CATEGORY_LABELS[c] ?? `${c} (kitchen)`
  );
  return {
    categories: cats,
    alsoByName: 'Items whose names match kitchen keywords (e.g. Burger)',
  };
}

/** When catalog is available — products flagged in Product Management */
export function summarizeKitchenProducts(products) {
  if (!products?.length) {
    return { count: 0, items: [], legacyNote: getKitchenConfigSummary() };
  }
  const items = products
    .filter((p) => isKitchenEligibleProduct(p))
    .map((p) => ({ id: p.id, name: p.name, category: p.category }));
  return {
    count: items.length,
    items,
    legacyNote: null,
  };
}
