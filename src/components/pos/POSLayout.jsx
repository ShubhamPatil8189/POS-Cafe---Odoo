import React, { useState, useEffect } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import PaymentScreen from './PaymentScreen';
import ProductModal from './ProductModal';
import { Search, Plus, Home, LayoutGrid, PackagePlus } from 'lucide-react';
import API_BASE_URL from '../../config';

export default function POSLayout({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProductsAndMethods = async () => {
    try {
      // 1. Fetch Products (Public Endpoint)
      const prodRes = await fetch(`${API_BASE_URL}/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      } else {
        console.warn('Failed to fetch products');
      }

      // 2. Fetch Payment Methods (Auth Endpoint)
      const payRes = await fetch(`${API_BASE_URL}/payment-methods`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        setPaymentMethods(payData);
      } else {
        console.warn('Failed to fetch payment methods (Likely No Token)');
      }
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndMethods();
  }, []);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotalWithTax = cartTotal * 1.05; // 5% tax

  const filteredProducts = products.filter(p => {
    const cat = p.category_name || '';
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

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete product');
      await fetchProductsAndMethods();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* LEFT PANE: Terminal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-primary-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between gap-4 z-10 bg-white/70 backdrop-blur-md border-b border-border-light shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-xl bg-white shadow-sm border border-border-light hover:bg-surface-hover hover:border-primary-300 transition-colors">
               <Home className="w-5 h-5 text-primary-700" />
             </button>
             <div>
               <h1 className="text-xl font-bold text-text-primary leading-none tracking-tight">Odoo Cafe POS</h1>
               <p className="text-xs text-text-secondary mt-1 font-medium">Dashboard • <span className="text-success-500">Live Menu</span></p>
             </div>
          </div>
          
          <div className="flex-1 max-w-md relative group">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Quick search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 active:scale-95 hover:bg-primary-700 transition-all"
          >
            <PackagePlus className="w-4 h-4" /> Add Product
          </button>
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
                <ProductCard 
                  product={product} 
                  onAdd={addToCart} 
                  onEdit={() => { setEditingProduct(product); setIsModalOpen(true); }}
                  onDelete={() => handleDelete(product)}
                />
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
              <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center text-text-tertiary mb-4 border border-border-light shadow-inner">
                 <LayoutGrid className="w-10 h-10 opacity-20" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">No products found</h3>
              <p className="text-text-secondary mt-1">Try adding your first product to this category!</p>
            </div>
          )}
          {loading && (
             <div className="grid grid-cols-5 gap-4 opacity-50">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square bg-surface-hover animate-pulse rounded-2xl" />
                ))}
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
        cartItems={cart}
        paymentMethods={paymentMethods}
        onPaymentSuccess={() => {
          setCart([]);
          setShowPayment(false);
        }}
      />

      {/* Product Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchProductsAndMethods}
        product={editingProduct}
      />

      {/* Global generic animations override */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.1); }
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
