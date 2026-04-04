import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';

export default function Login({ onNavigate }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Login clicked');
    }, 1000);
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome Back 👋</h1>
        <p className="text-text-secondary">Login to manage your restaurant</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-4 h-4 border border-border rounded shadow-sm bg-white peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors"></div>
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-text-secondary group-hover:text-text-primary transition-colors">Remember Me</span>
          </label>
          <a href="#" className="font-semibold text-primary-600 hover:text-primary-800 transition-colors">
            Forgot Password?
          </a>
        </div>

        <AuthButton type="submit" loading={loading} icon={ArrowRight}>
          Sign In
        </AuthButton>
      </form>

      <div className="mt-8 flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-border"></div>
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Or continue with</span>
        <div className="h-[1px] flex-1 bg-border"></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <AuthButton variant="outline" className="!py-2.5">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </AuthButton>
        <AuthButton variant="outline" className="!py-2.5">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.88 3.5-.8 1.48.11 2.68.74 3.39 1.83-3.1 1.8-2.61 5.92.35 7.09-.72 1.63-1.63 3.12-2.32 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.38-1.92 4.31-3.74 4.25z" />
          </svg>
          Apple
        </AuthButton>
      </div>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <button onClick={() => onNavigate('signup')} className="font-semibold text-primary-600 hover:text-primary-800 transition-colors">
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}
