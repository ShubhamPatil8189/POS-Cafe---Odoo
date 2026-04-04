import React, { useState } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import PaymentScreen from './PaymentScreen';
import { Search, Menu, Home } from 'lucide-react';

const mockProducts = [
  // Italian
  { id: 101, name: 'Margherita Pizza', price: 450, category: 'italian', calories: 800, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 102, name: 'Penne Arrabbiata', price: 380, category: 'italian', calories: 650, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 103, name: 'Classic Lasagna', price: 520, category: 'italian', calories: 950, image: 'https://images.unsplash.com/photo-1619881589316-56c7f9e6b587?q=80&w=600&auto=format&fit=crop', available: true },
  // Continental
  { id: 201, name: 'Caesar Salad', price: 290, category: 'continental', calories: 340, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 202, name: 'Grilled Chicken Steak', price: 580, category: 'continental', calories: 680, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 203, name: 'Avocado Toast', price: 320, category: 'continental', calories: 420, image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?q=80&w=600&auto=format&fit=crop', available: true },
  // Chinese
  { id: 301, name: 'Hakka Noodles', price: 260, category: 'chinese', calories: 410, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 302, name: 'Veg Manchurian', price: 280, category: 'chinese', calories: 380, image: 'https://plus.unsplash.com/premium_photo-1661600135894-0d32bb57a912?q=80&w=600&auto=format&fit=crop', available: true },
  // Korean
  { id: 401, name: 'Spicy Ramen', price: 420, category: 'korean', calories: 530, image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 402, name: 'Bibimbap', price: 480, category: 'korean', calories: 620, image: 'https://images.unsplash.com/photo-1583224964978-225ddb3ea18e?q=80&w=600&auto=format&fit=crop', available: true },
  // Indian
  { id: 501, name: 'Paneer Butter Masala', price: 340, category: 'indian', calories: 480, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 502, name: 'Chicken Biryani', price: 450, category: 'indian', calories: 720, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 503, name: 'Samosa Chaat', price: 180, category: 'indian', calories: 350, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop', available: true },
  // Beverages
  { id: 601, name: 'Latte Macchiato', price: 180, category: 'beverages', calories: 120, image: 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 602, name: 'Iced Caramel Cafe', price: 220, category: 'beverages', calories: 240, image: 'https://images.unsplash.com/photo-1461023058943-07cb84a0d8da?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 603, name: 'Matcha Boba', price: 260, category: 'beverages', calories: 180, image: 'https://images.unsplash.com/photo-1558857463-bd150a006cbd?q=80&w=600&auto=format&fit=crop', available: false },
  // Desserts
  { id: 701, name: 'Chocolate Brownie', price: 210, category: 'desserts', calories: 450, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 702, name: 'Cheesecake', price: 280, category: 'desserts', calories: 510, image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?q=80&w=600&auto=format&fit=crop', available: true },
];

export default function POSLayout({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotalWithTax = cartTotal * 1.05; // 5% tax

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
          onPay={() => setShowPayment(true)}
        />
      </div>

      <PaymentScreen 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)}
        total={cartTotalWithTax}
        onPaymentSuccess={() => {
          setCart([]);
          setShowPayment(false);
        }}
      />

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
