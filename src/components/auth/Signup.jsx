import React, { useState } from 'react';
import { Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';

export default function Signup({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Signup clicked');
    }, 1000);
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create Account ✨</h1>
        <p className="text-text-secondary">Join Odoo Cafe to manage your restaurant</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
