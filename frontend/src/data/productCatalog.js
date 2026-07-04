/**
 * Default menu — synced with POS + Kitchen via ProductCatalogContext (localStorage).
 * Each product can be toggled for KDS in Product Management (`sendToKitchen`).
 */
export const INITIAL_PRODUCTS = [
  {
    id: 101,
    name: 'Margherita Pizza',
    price: 450,
    category: 'italian',
    calories: 800,
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 102,
    name: 'Penne Arrabbiata',
    price: 380,
    category: 'italian',
    calories: 650,
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 103,
    name: 'Classic Lasagna',
    price: 520,
    category: 'italian',
    calories: 950,
    image:
      'https://images.unsplash.com/photo-1619881589316-56c7f9e6b587?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 201,
    name: 'Caesar Salad',
    price: 290,
    category: 'continental',
    calories: 340,
    image:
      'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: false,
  },
  {
    id: 202,
    name: 'Grilled Chicken',
    price: 580,
    category: 'continental',
    calories: 680,
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 203,
    name: 'Classic Burger',
    price: 420,
    category: 'continental',
    calories: 720,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 501,
    name: 'Paneer Masala',
    price: 340,
    category: 'indian',
    calories: 480,
    image:
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 502,
    name: 'Chicken Biryani',
    price: 450,
    category: 'indian',
    calories: 720,
    image:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: true,
  },
  {
    id: 601,
    name: 'Latte Macchiato',
    price: 180,
    category: 'beverages',
    calories: 120,
    image:
      'https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: false,
  },
  {
    id: 602,
    name: 'Iced Caramel',
    price: 220,
    category: 'beverages',
    calories: 240,
    image:
      'https://images.unsplash.com/photo-1461023058943-07cb84a0d8da?q=80&w=600&auto=format&fit=crop',
    available: true,
    sendToKitchen: false,
  },
];
