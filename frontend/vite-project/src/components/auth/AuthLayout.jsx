import React from 'react';
import { Coffee } from 'lucide-react';

export default function AuthLayout({ children, imageSrc }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4 sm:p-6 overflow-hidden relative">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary-400/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-accent-400/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[1000px] flex rounded-3xl shadow-2xl bg-white/80 backdrop-blur-2xl border border-white/40 overflow-hidden z-10 animate-scale-in">
        
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative">
          
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-700/30">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-primary-900 tracking-tight">Odoo Cafe</span>
          </div>

          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>

        {/* Presentation Section (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 relative bg-primary-900 p-12 overflow-hidden items-center justify-center">
          {/* subtle background pattern in presentation side */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
          
          {/* Abstract aesthetic element / illustration area */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="w-64 h-64 bg-gradient-to-tr from-accent-400 to-primary-500 rounded-full blur-2xl opacity-40 absolute mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl relative">
               <Coffee className="w-16 h-16 text-accent-300 mx-auto mb-6" />
               <h3 className="text-2xl font-bold text-white mb-2 leading-tight">Elevate Your<br/>Restaurant POS</h3>
               <p className="text-primary-200 text-sm max-w-[220px]">
                 Manage orders, inventory, and staff with a streamlined intuitive experience.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
