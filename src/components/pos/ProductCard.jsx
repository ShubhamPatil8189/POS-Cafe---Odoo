import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Edit, Trash2, ChefHat } from 'lucide-react';

export default function ProductCard({ product, onAdd, onEdit, onDelete }) {
  const [clicked, setClicked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = (e) => {
    // If clicking menu, don't trigger add
    if (showMenu) return;
    
    setClicked(true);
    onAdd(product);
    setTimeout(() => setClicked(false), 200);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-3 cursor-pointer transition-all duration-300
        hover:shadow-xl hover:-translate-y-1 hover:border-primary-200
        ${clicked ? 'scale-95 bg-primary-50' : 'scale-100 shadow-md'}
      `}
    >
      {/* Three Dots Menu - Only for Admin/Manager usually, but user asked for it explicitly */}
      <div className="absolute top-2 right-2 z-30" ref={menuRef}>
        <button 
          onClick={handleMenuClick}
          className="p-1.5 rounded-lg bg-white/80 backdrop-blur-md shadow-sm border border-border/50 hover:bg-primary-50 text-text-secondary hover:text-primary-600 transition-all opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-2xl border border-border p-1 animate-in zoom-in-95 duration-200 origin-top-right z-40">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(product); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-secondary hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit Item
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(product); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Ripple element */}
      {clicked && (
        <span className="absolute inset-0 rounded-2xl bg-primary-100/30 animate-ping opacity-0" />
      )}

      {/* Image container with scale effect */}
      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-surface-hover flex items-center justify-center relative">
        <div className="absolute inset-0 bg-primary-50/50 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <img
          src={product.image || 'default.jpg'}
          alt={product.name}
          onError={(e) => { e.target.src = 'default.jpg'; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Availability Badge */}
        {!product.available && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
            <span className="bg-danger-100 text-danger-700 text-xs font-bold px-2 py-1 rounded-md">Sold Out</span>
          </div>
        )}
        {product.sendToKitchen && product.available && (
          <div className="absolute left-2 top-2 z-[15] flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md shadow-orange-500/30">
            <ChefHat className="h-3 w-3" strokeWidth={2.5} />
            Kitchen
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between relative z-10">
        <div>
          <h3 className="font-semibold text-text-primary text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>
          {product.category_name && (
            <span className="text-[10px] uppercase font-black text-text-tertiary mt-1 block tracking-wider px-1.5 py-0.5 rounded-md bg-surface-base w-fit">{product.category_name}</span>
          )}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="font-extrabold text-primary-700">₹{product.price}</span>
          <button className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600 hover:text-white">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
