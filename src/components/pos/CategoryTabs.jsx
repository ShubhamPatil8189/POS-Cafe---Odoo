import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';

export default function CategoryTabs({ activeCategory, onSelect }) {
  const [categories, setCategories] = useState([{ id: 'all', name: 'All 🍽️' }]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        // Map backend categories to our format
        const fetchedCats = data.map(c => ({
          id: c.name.toLowerCase(),
          name: `${c.name} ${c.icon || ''}`
        }));
        
        setCategories([{ id: 'all', name: 'All 🍽️' }, ...fetchedCats]);
      } catch (err) {
        console.error('Category fetch error:', err);
      }
    };
    fetchCategories();
  }, []);
  return (
    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 w-full border-b border-border-light relative pt-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap outline-none
            ${
              activeCategory === cat.id
                ? 'text-primary-700 bg-primary-50 shadow-sm'
                : 'text-text-secondary hover:text-primary-600 hover:bg-surface-hover'
            }
          `}
        >
          {cat.name}
          {activeCategory === cat.id && (
            <span
              className="absolute -bottom-2.5 left-0 w-full h-[3px] bg-primary-500 rounded-t-md"
              style={{
                // Poor man's layoutId animation without Framer Motion
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
