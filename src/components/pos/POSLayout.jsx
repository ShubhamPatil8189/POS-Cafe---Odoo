import React, { useState } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import { Search, Menu, Home } from 'lucide-react';

const mockProducts = [
  // Hot Coffee
  { id: 1, name: 'Latte Macchiato', price: 180, category: 'coffee', calories: 120, image: 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 2, name: 'Espresso Double', price: 120, category: 'coffee', calories: 10, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 8, name: 'Flat White', price: 160, category: 'coffee', calories: 110, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 9, name: 'Cappuccino', price: 170, category: 'coffee', calories: 130, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 10, name: 'Americano', price: 140, category: 'coffee', calories: 15, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 11, name: 'Café Mocha', price: 190, category: 'coffee', calories: 210, image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?q=80&w=600&auto=format&fit=crop', available: true },
  // Iced Beverages
  { id: 3, name: 'Iced Caramel Cafe', price: 220, category: 'iced', calories: 240, image: 'https://images.unsplash.com/photo-1461023058943-07cb84a0d8da?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 6, name: 'Matcha Boba', price: 260, category: 'iced', calories: 180, image: 'https://images.unsplash.com/photo-1558857463-bd150a006cbd?q=80&w=600&auto=format&fit=crop', available: false },
  { id: 12, name: 'Iced Latte', price: 200, category: 'iced', calories: 150, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 13, name: 'Cold Brew', price: 190, category: 'iced', calories: 10, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 14, name: 'Lemon Iced Tea', price: 150, category: 'iced', calories: 90, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600&auto=format&fit=crop', available: true },
  // Pastries
  { id: 4, name: 'Almond Croissant', price: 150, category: 'pastry', calories: 310, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 7, name: 'Blueberry Muffin', price: 130, category: 'pastry', calories: 280, image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 15, name: 'Chocolate Cookie', price: 90, category: 'pastry', calories: 220, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 16, name: 'Cinnamon Roll', price: 160, category: 'pastry', calories: 380, image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 17, name: 'Butter Croissant', price: 120, category: 'pastry', calories: 260, image: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=600&auto=format&fit=crop', available: true },
  // Hot Food
  { id: 5, name: 'Avocado Toast', price: 320, category: 'food', calories: 420, image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 18, name: 'Breakfast Sandwich', price: 280, category: 'food', calories: 510, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 19, name: 'Grilled Cheese', price: 240, category: 'food', calories: 480, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 20, name: 'Caesar Salad', price: 290, category: 'food', calories: 340, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop', available: true },
  // Merchandise
  { id: 21, name: 'Cafe Mug', price: 450, category: 'merch', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 22, name: 'Coffee Beans 250g', price: 650, category: 'merch', image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 23, name: 'Canvas Tote Bag', price: 350, category: 'merch', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 24, name: 'Insulated Tumbler', price: 850, category: 'merch', image: 'https://images.unsplash.com/photo-1582121516243-7f28edfe25e0?q=80&w=600&auto=format&fit=crop', available: true },
];

export default function POSLayout({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const filteredProducts = mockProducts.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [{ ...product, quantity: 1 }, ...prev];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* LEFT PANE: Terminal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-primary-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between gap-4 z-10 bg-white/50 backdrop-blur-md border-b border-border-light">
          <div className="flex items-center gap-3">
             <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-xl bg-white shadow-sm border border-border-light hover:bg-surface-hover hover:border-primary-300 transition-colors">
               <Home className="w-5 h-5 text-primary-700" />
             </button>
             <div>
               <h1 className="text-xl font-bold text-text-primary leading-none tracking-tight">Odoo Cafe POS</h1>
               <p className="text-xs text-text-secondary mt-1 font-medium">Register 1 • <span className="text-success-500">Online</span></p>
             </div>
          </div>
          
          <div className="flex-1 max-w-md relative group">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search products, barcodes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            />
          </div>
        </header>

        {/* Horizontal Category Tabs */}
        <div className="px-6 z-10 bg-white/30 backdrop-blur-sm">
           <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="animate-scale-in">
                <ProductCard product={product} onAdd={addToCart} />
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center text-text-tertiary mb-4">
                 <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">No products found</h3>
              <p className="text-text-secondary mt-1">Try adjusting your search or category filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Cart */}
      <div className="w-[380px] h-full shadow-2xl z-20 shrink-0">
        <CartPanel 
          cartItems={cart} 
          updateQuantity={updateQuantity} 
          clearCart={() => setCart([])}
          onPay={() => alert("Payment screen sliding in...")}
        />
      </div>

      {/* Global generic animations override just for this layout */}
      <style>{`
        .animate-slide-left {
           animation: slideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideLeft {
           from { transform: translateX(20px); opacity: 0; }
           to { transform: translateX(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(61,29,107,0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(61,29,107,0.2);
        }
      `}</style>
    </div>
  );
}
