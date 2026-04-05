import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, DollarSign, BarChart2, FileText,
  Download, Calendar, Users, Package, ChevronDown, RefreshCw,
  FileSpreadsheet, ArrowUp, ArrowDown, Hash, CreditCard, Banknote,
  Wallet, AlertCircle, Loader2
} from 'lucide-react';
import API_BASE_URL from '../../config';

// ─── tiny helpers ───────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
const API_HDR = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

// ─── Mini Bar Chart (pure CSS / SVG) ──────────────────────────
function MiniBarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex h-40 items-center justify-center text-slate-300 text-sm font-medium">No data yet</div>
  );
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end justify-center gap-2 h-40 w-full pt-2">
      {data.map((d, i) => {
        const pct = (d.total / max) * 100;
        return (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 24 }}
            style={{ originY: 1 }}
            className="flex flex-1 flex-col justify-end items-center gap-1 group h-full max-w-[40px]"
          >
            <div
              className="relative w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 shadow-sm shadow-primary-500/20 group-hover:from-primary-700 group-hover:to-primary-500 transition-all"
              style={{ height: `${Math.max(pct, 4)}%` }}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                ₹{fmt(d.total)}
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 group-hover:text-primary-600 transition-colors">
              {fmtDate(d.date)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────
function DonutChart({ data }) {
  const COLORS = ['#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];
  const total = data.reduce((s, d) => s + d.total, 0);
  let offset = 0;
  const R = 40, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        {data.length === 0
          ? <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="14" />
          : data.map((d, i) => {
            const pct = d.total / total;
            const dash = pct * C;
            const gap = C - dash;
            const el = (
              <circle
                key={i}
                cx="50" cy="50" r={R}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
            );
            offset += dash;
            return el;
          })}
        <text x="50" y="53" textAnchor="middle" fontSize="11" fontWeight="900" fill="#0f172a">
          {data.length > 0 ? Math.round((Math.max(...data.map(d => d.total)) / total) * 100) + '%' : '—'}
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-xs font-bold text-slate-700 capitalize">{d.type}</span>
            <span className="ml-auto pl-4 text-xs font-black tabular-nums text-slate-500">₹{fmt(d.total)}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-slate-400">No payment data</p>}
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  const colorMap = {
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-700', shadow: 'shadow-purple-500/10' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', text: 'text-blue-700', shadow: 'shadow-blue-500/10' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-700', shadow: 'shadow-emerald-500/10' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', text: 'text-amber-700', shadow: 'shadow-amber-500/10' },
  };
  const c = colorMap[color] ?? colorMap.purple;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/60 ${c.bg} p-6 shadow-xl ${c.shadow} backdrop-blur-sm`}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
      <div className="flex items-start gap-4">
        <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${c.icon} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-black uppercase tracking-widest ${c.text} opacity-70`}>{label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 truncate">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Filter Dropdown ───────────────────────────────────────────
function FilterSelect({ icon: Icon, label, value, onChange, options }) {
  return (
    <div className="relative flex-1 min-w-[140px]">
      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState('');
  const [productId, setProductId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  // ── Fetch Helpers ──────────────────────────────────────────
  const buildQS = useCallback(() => {
    const p = new URLSearchParams();
    if (period !== 'custom') p.set('period', period);
    if (period === 'custom' && startDate) p.set('start_date', startDate);
    if (period === 'custom' && endDate) p.set('end_date', endDate);
    if (sessionId) p.set('session_id', sessionId);
    if (userId) p.set('user_id', userId);
    if (productId) p.set('product_id', productId);
    return p.toString();
  }, [period, startDate, endDate, sessionId, userId, productId]);

  const fetchDashboard = useCallback(async () => {
    setLoadingDash(true); setError('');
    try {
      const r = await fetch(`${API_BASE_URL}/reports/dashboard?${buildQS()}`, { headers: API_HDR() });
      if (!r.ok) throw new Error('Failed to load dashboard');
      setDashboard(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoadingDash(false); }
  }, [buildQS]);

  const fetchSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const r = await fetch(`${API_BASE_URL}/reports/sales?${buildQS()}`, { headers: API_HDR() });
      if (!r.ok) throw new Error('Failed to load sales');
      setSalesData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoadingSales(false); }
  }, [buildQS]);

  const fetchMeta = useCallback(async () => {
    try {
      const [sR, uR, pR] = await Promise.all([
        fetch(`${API_BASE_URL}/reports/sessions`, { headers: API_HDR() }),
        fetch(`${API_BASE_URL}/reports/staff`,    { headers: API_HDR() }),
        fetch(`${API_BASE_URL}/products`,          { headers: API_HDR() }),
      ]);
      if (sR.ok) setSessions(await sR.json());
      if (uR.ok) setUsers(await uR.json());
      if (pR.ok) setProducts(await pR.json());
    } catch (_) {}
  }, []);

  useEffect(() => { fetchDashboard(); fetchSales(); fetchMeta(); }, []);
  useEffect(() => { fetchSales(); fetchDashboard(); }, [buildQS]);

  // ── Export ─────────────────────────────────────────────────
  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/export/${type}?${buildQS()}`, { headers: API_HDR() });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = type === 'pdf' ? 'sales_report.pdf' : 'sales_report.xlsx';
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
    finally { setExporting(''); }
  };

  const totalRevenue = salesData.reduce((s, o) => s + parseFloat(o.total || 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 p-8 md:p-10 shadow-2xl"
      >
        {/* Orb decorations */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-60 w-60 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/10 ring-1 ring-white/20 shadow-xl backdrop-blur-sm">
              <BarChart2 className="h-8 w-8 text-purple-300" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-purple-400">
                <span className="text-[10px] font-black uppercase tracking-[0.25em]">Admin Only</span>
                <span className="h-1 w-1 rounded-full bg-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em]">Live Data</span>
              </div>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-white md:text-5xl">
                Analytics
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Sales reporting, insights &amp; data exports
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
              className="group flex items-center gap-2.5 rounded-2xl bg-red-500/20 px-5 py-3 text-sm font-black text-red-300 ring-1 ring-red-500/30 backdrop-blur-sm transition-all hover:bg-red-500/30 hover:text-red-200 disabled:opacity-50 active:scale-95"
            >
              {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Export PDF
            </button>
            <button
              onClick={() => handleExport('xls')}
              disabled={!!exporting}
              className="group flex items-center gap-2.5 rounded-2xl bg-emerald-500/20 px-5 py-3 text-sm font-black text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-sm transition-all hover:bg-emerald-500/30 hover:text-emerald-200 disabled:opacity-50 active:scale-95"
            >
              {exporting === 'xls' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Export XLS
            </button>
            <button
              onClick={() => { fetchDashboard(); fetchSales(); }}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/20 transition-all active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${loadingDash || loadingSales ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/80"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-xl bg-primary-50 flex items-center justify-center">
            <Download className="h-4 w-4 text-primary-600" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-600">Filters</h2>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Period */}
          <FilterSelect
            icon={Calendar}
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'custom', label: 'Custom Range' },
            ]}
          />

          {/* Custom date pickers */}
          <AnimatePresence>
            {period === 'custom' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex gap-3 overflow-hidden"
              >
                <div className="min-w-[140px]">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                  />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session */}
          <FilterSelect
            icon={Hash}
            label="Session"
            value={sessionId}
            onChange={setSessionId}
            options={[
              { value: '', label: 'All Sessions' },
              ...sessions.map(s => ({
                value: String(s.id),
                label: `#${s.id} — ${s.status === 'open' ? '🟢 Open' : '⚫ Closed'}${
                  s.start_time
                    ? ' (' + new Date(s.start_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ')'
                    : ''
                }`,
              }))
            ]}
          />

          {/* Responsible (User) */}
          <FilterSelect
            icon={Users}
            label="Responsible"
            value={userId}
            onChange={setUserId}
            options={[
              { value: '', label: 'All Staff' },
              ...users.map(u => ({ value: String(u.id), label: u.name || u.email }))
            ]}
          />

          {/* Product */}
          <FilterSelect
            icon={Package}
            label="Product"
            value={productId}
            onChange={setProductId}
            options={[
              { value: '', label: 'All Products' },
              ...products.map(p => ({ value: String(p.id), label: p.name }))
            ]}
          />
        </div>
      </motion.div>

      {/* ── Error Banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm font-bold text-red-700 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            {error} — backend may be offline. Showing placeholder state.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Stat Cards ───────────────────────────────────── */}
      {loadingDash ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[1.75rem] bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={DollarSign} label="Filtered Revenue" value={`₹${fmt(dashboard?.total_sales)}`} sub={`${dashboard?.total_orders ?? 0} orders`} color="purple" delay={0.05} />
          <StatCard icon={ShoppingBag} label="Filtered Orders" value={dashboard?.total_orders ?? 0} sub={`Avg ₹${fmt(dashboard?.avg_order_value)}/order`} color="blue" delay={0.1} />
          <StatCard icon={TrendingUp} label="Filtered Today" value={`₹${fmt(dashboard?.sales_today)}`} sub={`${dashboard?.orders_today ?? 0} orders`} color="emerald" delay={0.15} />
          <StatCard icon={BarChart2} label="Avg Order Value" value={`₹${fmt(dashboard?.avg_order_value)}`} sub="For filtered orders" color="amber" delay={0.2} />
        </div>
      )}

      {/* ── Charts Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="col-span-2 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg shadow-slate-100/80"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales Trend</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">Revenue Over Time</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          {loadingDash
            ? <div className="h-40 rounded-2xl bg-slate-50 animate-pulse" />
            : <MiniBarChart data={dashboard?.sales_by_day ?? []} />
          }
        </motion.div>

        {/* Payment Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg shadow-slate-100/80"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payments</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">Method Mix</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {loadingDash
            ? <div className="h-32 rounded-2xl bg-slate-50 animate-pulse" />
            : <DonutChart data={dashboard?.payment_breakdown ?? []} />
          }
        </motion.div>
      </div>

      {/* ── Top Products ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg shadow-slate-100/80"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bestsellers</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">Top 5 Products</h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Package className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        {loadingDash ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-2xl bg-slate-50 animate-pulse" />)}
          </div>
        ) : (dashboard?.top_products ?? []).length === 0 ? (
          <p className="py-12 text-center text-sm font-medium text-slate-400">No product data yet.</p>
        ) : (
          <div className="space-y-3">
            {(dashboard?.top_products ?? []).map((p, i) => {
              const maxQty = Math.max(...(dashboard?.top_products ?? []).map(x => x.quantity_sold), 1);
              const pct = (p.quantity_sold / maxQty) * 100;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-4 rounded-2xl bg-slate-50/80 p-4 hover:bg-primary-50/50 transition-colors"
                >
                  <span className="text-xl w-6 shrink-0">{medals[i] ?? `#${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate">{p.name}</p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1 * i, type: 'spring', stiffness: 220 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black tabular-nums text-slate-900">₹{fmt(p.revenue)}</p>
                    <p className="text-[10px] font-bold text-slate-400">{p.quantity_sold} sold</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Sales Table ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-100/80 overflow-hidden"
      >
        <div className="flex items-center justify-between px-7 pt-7 pb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtered Results</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">Sales Records</h3>
          </div>
          <div className="flex items-center gap-3">
            {loadingSales && <Loader2 className="h-4 w-4 animate-spin text-primary-500" />}
            <span className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-black text-primary-700 border border-primary-100">
              {salesData.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/80">
                {['Order #', 'Date & Time', 'Staff', 'Payment', 'Total'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="wait">
                {loadingSales ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 rounded-lg bg-slate-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : salesData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <p className="text-sm font-bold text-slate-400">No orders match the selected filters.</p>
                    </td>
                  </tr>
                ) : (
                  salesData.map((order, i) => (
                    <motion.tr
                      key={order.order_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 text-sm">{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-600">
                          {new Date(order.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-600">{order.staff_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
                          order.payment_method === 'cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {order.payment_method === 'cash'
                            ? <Banknote className="h-3 w-3" />
                            : <CreditCard className="h-3 w-3" />}
                          {order.payment_method ?? 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-black tabular-nums text-slate-900">₹{fmt(order.total)}</span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
            {salesData.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-100 bg-slate-50/80">
                  <td colSpan={4} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Total Revenue</td>
                  <td className="px-6 py-4 text-xl font-black tabular-nums text-primary-700">₹{fmt(totalRevenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>
    </div>
  );
}
