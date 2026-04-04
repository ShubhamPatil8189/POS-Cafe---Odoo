import React, { useState, useEffect } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import PaymentScreen from './PaymentScreen';
import { Search, Menu, Home } from 'lucide-react';
import API_BASE_URL from '../../config';

const mockProducts = [
  // Fallback data
  { id: 101, name: 'Margherita Pizza', price: 450, category: 'italian', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop', available: true },
];

export default function POSLayout({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(true);

  // Fetch real products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotalWithTax = cartTotal * 1.05; // 5% tax

  const filteredProducts = products.filter(p => {
    // Map category_name from backend or category from mock
    const cat = p.category_name || p.category;
    const matchesCat = activeCategory === 'all' || cat.toLowerCase() === activeCategory.toLowerCase();
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
