
/** Category slugs from menu — entire category goes to kitchen when listed here */
export const KITCHEN_CATEGORIES = new Set(['italian']);

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
  
  // Safe boolean check (handles strings from possible localstorage serialization)
  if (product.sendToKitchen === true || product.sendToKitchen === 'true') {
    return true;
  }
  if (product.sendToKitchen === false || product.sendToKitchen === 'false') {
    return false;
  }
  
  // Safe category check
  if (product.category && KITCHEN_CATEGORIES.has(String(product.category).toLowerCase())) {
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
