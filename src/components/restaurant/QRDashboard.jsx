import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, RefreshCw, QrCode, Search } from 'lucide-react';
import { Button, Card, Badge, Input } from '../ui';
import API_BASE_URL from '../../config';

export default function QRDashboard({ tables }) {
  const [search, setSearch] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const filteredTables = tables.filter(t => 
    t.number.toString().includes(search) || 
    t.floor.toString().toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Header / Controls */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 no-print">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Table QR Management</h1>
            <p className="text-sm text-slate-500 font-medium">Print stickers for customer self-ordering</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search table..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" icon={Printer} onClick={handlePrint} className="shadow-lg shadow-indigo-600/20">
            Print All Stickers
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 print:grid-cols-3 print:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTables.map((table, idx) => (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="print:break-inside-avoid print:mb-8"
              >
                <div className="group relative bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:border-indigo-200 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.12)] print:shadow-none print:border-slate-300 print:rounded-3xl">
                  {/* Sticker Header */}
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Table</div>
                      <div className="text-4xl font-black">{table.number}</div>
                    </div>
                  </div>

                  {/* QR Body */}
                  <div className="p-8 flex flex-col items-center">
                    <div className="relative p-2 bg-white rounded-3xl ring-8 ring-slate-50 transition-all group-hover:ring-indigo-50">
                      <img 
                        src={`${API_BASE_URL}/self-order/qr/${table.id}`} 
                        alt={`QR Code for Table ${table.number}`}
                        className="w-40 h-40 object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="mt-8 text-center">
                      <div className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2">Scan to Order</div>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-[120px]">
                        Seamless digital menu & instant checkout
                      </p>
                    </div>
                  </div>

                  {/* Individual Print Button (Hidden on actual Print) */}
                  <div className="absolute bottom-4 right-4 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="icon-sm" 
                      variant="secondary" 
                      icon={Printer}
                      onClick={() => {
                        // Temp single print logic
                        const win = window.open('', '_blank');
                        win.document.write(`
                          <html>
                            <head><title>Table ${table.number} QR</title>
                            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                            </head>
                            <body onload="window.print(); window.close();" class="p-10 flex justify-center">
                               ${document.getElementById('qr-sticker-' + table.id)?.outerHTML || 'Error printing individual sticker.'}
                            </body>
                          </html>
                        `);
                      }}
                    />
                  </div>

                  {/* Hidden anchor for individual print */}
                  <div id={`qr-sticker-${table.id}`} className="hidden print:block">
                     {/* Replica of the card without hover states for print purity if needed */}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .custom-scrollbar { overflow: visible !important; }
          main { overflow: visible !important; }
        }
      ` }} />
    </div>
  );
}
