import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import AuthLayout from './AuthLayout';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';

import API_BASE_URL from '../../config';

export default function Signup({ onNavigate }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    adminCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple password strength calculation
  const getPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length > 5) strength++;
    if (pass.length > 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const strength = getPasswordStrength(formData.password);
  
  const strengthColors = ['bg-border', 'bg-danger-500', 'bg-warning-500', 'bg-success-400', 'bg-success-600'];
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          adminCode: formData.adminCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setLoading(false);
      alert('Account created successfully! Please login.');
      onNavigate('login');
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create Account ✨</h1>
        <p className="text-text-secondary">Join Odoo Cafe to manage your restaurant</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Role Selection Chips */}
      <div className="mb-6">
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Join as</p>
        <div className="flex gap-3">
          {[
            { id: 'staff', label: 'Staff Member', icon: Users },
            { id: 'admin', label: 'Administrator', icon: ShieldCheck }
          ].map((r) => {
            const Icon = r.icon;
            const isSelected = formData.role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setFormData({ ...formData, role: r.id })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50/50 text-primary-700 shadow-sm' 
                    : 'border-border bg-white text-text-secondary hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">{r.label}</span>
                {isSelected && (
                  <motion.div layoutId="signupRole" className="absolute" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formData.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl"
          >
            <AuthInput 
              id="adminCode"
              label="Admin Security Code"
              type="text"
              placeholder="Enter 4-digit code"
              icon={ShieldCheck}
              value={formData.adminCode}
              onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
              required
            />
            <p className="mt-2 text-[11px] text-amber-700 font-medium">Secured with port code of your development 5173</p>
          </motion.div>
        )}
        <AuthInput
          id="name"
          label="Full Name"
          type="text"
          placeholder="e.g. Alex Johnson"
          icon={User}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="admin@odoocafe.com"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <div className="space-y-1">
          <AuthInput
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          {formData.password.length > 0 && (
             <div className="pt-1 animate-fade-in pl-1">
               <div className="flex gap-1 mb-1">
                 {[1, 2, 3, 4].map((level) => (
                   <div 
                     key={level} 
                     className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strength >= level ? strengthColors[strength] : 'bg-border'}`}
                   />
                 ))}
               </div>
               <p className={`text-xs font-medium ${strength >= 3 ? 'text-success-600' : 'text-text-secondary'}`}>
                 Password strength: {strengthLabels[strength]}
               </p>
             </div>
          )}
        </div>

        <AuthInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />

        <div className="pt-2">
           <label className="flex items-start gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
               <input type="checkbox" className="peer sr-only" required />
               <div className="w-4 h-4 border border-border rounded shadow-sm bg-white peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors"></div>
               <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors leading-tight">
               I agree to the <a href="#" className="font-medium text-primary-600 hover:text-primary-800">Terms & Conditions</a> and <a href="#" className="font-medium text-primary-600 hover:text-primary-800">Privacy Policy</a>.
             </span>
           </label>
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={loading} icon={CheckCircle2}>
            Sign Up
          </AuthButton>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <button onClick={() => onNavigate('login')} className="font-semibold text-primary-600 hover:text-primary-800 transition-colors">
          Log in
        </button>
      </p>
    </AuthLayout>
  );
}
