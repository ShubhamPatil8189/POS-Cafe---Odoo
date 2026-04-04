import React, { useState, useEffect } from 'react';
import { X, Check, Image as ImageIcon, Briefcase, Tag, Hash, Percent, ShoppingCart, Info, MessageSquare } from 'lucide-react';
import API_BASE_URL from '../../config';

export default function ProductModal({ isOpen, onClose, onSave, product = null }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    tax: 0,
    uom: 'piece',
    description: '',
    image_url: '',
    is_active: true,
    send_to_kitchen: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        setFormData({
          name: product.name || '',
          category_id: product.category_id || '',
          price: product.price || '',
          tax: product.tax || 0,
          uom: product.uom || 'piece',
          description: product.description || '',
          image_url: product.image_url || product.image || '',
          is_active: product.available !== undefined ? product.available : (product.is_active !== undefined ? product.is_active : true),
          send_to_kitchen: product.send_to_kitchen !== undefined ? product.send_to_kitchen : true
        });
      } else {
        setFormData({
          name: '',
          category_id: '',
          price: '',
          tax: 0,
          uom: 'piece',
          description: '',
          image_url: '',
          is_active: true,
          send_to_kitchen: true
        });
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      setCategories(data);
      // Auto select first category if new product
      if (!product && data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use default image if none provided
      const finalData = {
        ...formData,
        image_url: formData.image_url || 'default.jpg'
      };

      const method = product ? 'PUT' : 'POST';
      const url = product ? `${API_BASE_URL}/products/${product.id}` : `${API_BASE_URL}/products`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(finalData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      await onSave();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary-50/10">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">Manage your cafe menu items</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-hover text-text-tertiary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Tag className="w-4 h-4" /> Item Name *
              </label>
              <input
                required
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                placeholder="e.g. Classic Cappuccino"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Category *
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category_id: cat.id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                      ${formData.category_id === cat.id 
                        ? 'bg-primary-500 text-white border-primary-500 shadow-md' 
                        : 'bg-white text-text-secondary border-border hover:border-primary-300'}
                    `}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Hash className="w-4 h-4" /> Price (₹) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                placeholder="0.00"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Percent className="w-4 h-4" /> Tax Rate (%)
              </label>
              <input
                type="number"
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                placeholder="5"
                value={formData.tax}
                onChange={e => setFormData({ ...formData, tax: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Unit of Measure
              </label>
              <select
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium cursor-pointer"
                value={formData.uom}
                onChange={e => setFormData({ ...formData, uom: e.target.value })}
              >
                <option value="piece">Piece</option>
                <option value="portion">Portion</option>
                <option value="cup">Cup</option>
                <option value="glass">Glass</option>
                <option value="plate">Plate</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Image URL
              </label>
              <input
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                placeholder="Unsplash URL or blank for default"
                value={formData.image_url === 'default.jpg' ? '' : formData.image_url}
                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Description
              </label>
              <textarea
                className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium resize-none"
                rows={3}
                placeholder="High quality Arabica beans with frothy milk..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="hidden"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${formData.is_active ? 'bg-primary-500' : 'bg-text-tertiary/30'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                 <Info className="w-4 h-4" /> Available In Menu
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="hidden"
                checked={formData.send_to_kitchen}
                onChange={e => setFormData({ ...formData, send_to_kitchen: e.target.checked })}
              />
              <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${formData.send_to_kitchen ? 'bg-primary-500' : 'bg-text-tertiary/30'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.send_to_kitchen ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-bold text-text-primary">Send to Kitchen</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-surface-base">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : <><Check className="w-4 h-4" /> {product ? 'Update Item' : 'Add to Menu'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
