import React, { useEffect, useState, useMemo } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import * as db from '../services/db';
import { TrendingUp, Trash2, Calendar, ChevronDown, ChevronUp, AlertCircle, Search, Filter, X } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters State
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setTransactions(db.getTransactions());
  }, []);

  // Stats Logic (Always shows last 7 days regardless of filter to show Trend)
  const getLast7DaysStats = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const relevant = transactions.filter(t => 
      t.timestamp >= sevenDaysAgo.getTime() && 
      t.type === TransactionType.SALE
    );

    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);

      const daysTrans = relevant.filter(t => t.timestamp >= dayStart.getTime() && t.timestamp <= dayEnd.getTime());
      
      const revenue = daysTrans.reduce((acc, t) => acc + t.totalPriceSaleAtTime, 0);
      const profit = daysTrans.reduce((acc, t) => acc + (t.totalPriceSaleAtTime - t.totalPricePurchaseAtTime), 0);

      stats.push({ label, revenue, profit });
    }
    return stats;
  };

  const stats = getLast7DaysStats();
  const maxVal = Math.max(...stats.map(s => s.revenue), 10);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Name Filter
      if (searchName && !t.userName.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      
      // Date Range Filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (t.timestamp < start.getTime()) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (t.timestamp > end.getTime()) return false;
      }

      return true;
    });
  }, [transactions, searchName, startDate, endDate]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const clearFilters = () => {
    setSearchName('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = searchName || startDate || endDate;

  return (
    <div className="pb-24 pt-4 px-4 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Historique & Stats</h1>

      {/* Chart (Fixed 7 Days Trend) */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp className="text-yellow-500" />
                <h2 className="font-semibold">Tendance (7 derniers jours)</h2>
            </div>
        </div>
        
        <div className="flex justify-between items-end h-56 gap-1 border-b border-slate-700/50 pb-2">
          {stats.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
              <div className="flex items-end justify-center gap-1 h-full w-full px-1">
                {/* Revenue Bar */}
                <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[20px]">
                  <span className="text-[9px] text-slate-400 font-bold mb-1">
                    {Math.round(s.revenue)}
                  </span>
                  <div 
                    style={{ height: `${Math.max((s.revenue / maxVal) * 100, 1)}%` }} 
                    className="w-full bg-slate-600 rounded-t-sm min-h-[4px]"
                  />
                </div>
                {/* Profit Bar */}
                <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[20px]">
                  <span className="text-[9px] text-yellow-500 font-bold mb-1">
                    {Math.round(s.profit)}
                  </span>
                  <div 
                    style={{ height: `${Math.max((s.profit / maxVal) * 100, 1)}%` }} 
                    className="w-full bg-yellow-500 rounded-t-sm min-h-[4px]"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 uppercase font-medium">{s.label}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-600 rounded-sm"></div>CA</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>Bénéfice</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 mb-1">
          <Filter size={16} className="text-yellow-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Filtrer les transactions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Nom du client..." 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-600"
            />
          </div>

          {/* Date Inputs */}
          <div className="flex gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-600"
            />
            <span className="self-center text-slate-500">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-600"
            />
          </div>
        </div>

        {hasFilters && (
          <div className="flex justify-between items-center pt-2">
             <div className="text-xs text-slate-400">
                {filteredTransactions.length} résultat(s) trouvé(s)
             </div>
             <button 
                onClick={clearFilters}
                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-900/20 px-2 py-1 rounded"
              >
                <X size={12} /> Effacer filtres
              </button>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.map(t => {
          const isDeletion = t.type === TransactionType.DELETION;
          const isExpanded = expandedId === t.id;
          const dateObj = new Date(t.timestamp);
          
          return (
            <div 
              key={t.id} 
              className={`bg-slate-800 border ${isDeletion ? 'border-red-900/50 bg-red-950/10' : 'border-slate-700'} rounded-xl overflow-hidden transition-all`}
            >
              <div 
                onClick={() => toggleExpand(t.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isDeletion ? 'bg-red-900/20 text-red-500' : 'bg-slate-700 text-yellow-500'}`}>
                    {isDeletion ? <Trash2 size={18} /> : <Calendar size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      {t.userName}
                      {isDeletion && <span className="text-xs bg-red-900 text-red-200 px-1.5 py-0.5 rounded">SUPPRIMÉ</span>}
                    </div>
                    <div className="text-sm text-slate-400 flex gap-1">
                      {/* Date and Time Display */}
                      <span>{dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit'})}</span>
                      <span>à</span>
                      <span>{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span>•</span>
                      <span>{t.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold ${isDeletion ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {t.totalPriceSaleAtTime.toFixed(2)}€
                  </div>
                  {!isExpanded && (
                    <div className="text-xs text-slate-500 max-w-[150px] truncate">
                      {t.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="ml-2 text-slate-500">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-900/50 p-4 border-t border-slate-700/50 text-sm">
                   {isDeletion && (
                    <div className="flex items-center gap-2 text-red-400 mb-3 text-xs bg-red-950/30 p-2 rounded">
                      <AlertCircle size={14} />
                      <span>Ardoise abandonnée lors de la suppression</span>
                    </div>
                  )}
                  <table className="w-full text-slate-300">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-700">
                        <th className="pb-2">Produit</th>
                        <th className="pb-2 text-right">Qté</th>
                        <th className="pb-2 text-right">P.U</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-800/50 last:border-0">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 text-right">{item.quantity}</td>
                          <td className="py-2 text-right">{item.unitPriceSale.toFixed(2)}</td>
                          <td className="py-2 text-right font-medium text-slate-200">{(item.unitPriceSale * item.quantity).toFixed(2)}€</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-700">
                        <td colSpan={3} className="pt-2 text-right text-slate-400">Total Achat (Coût):</td>
                        <td className="pt-2 text-right text-slate-400">{t.totalPricePurchaseAtTime.toFixed(2)}€</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="text-right font-bold text-yellow-500">Marge:</td>
                        <td className="text-right font-bold text-yellow-500">
                          {(t.totalPriceSaleAtTime - t.totalPricePurchaseAtTime).toFixed(2)}€
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {filteredTransactions.length === 0 && (
          <div className="text-center text-slate-500 py-10">Aucune transaction trouvée</div>
        )}
      </div>
    </div>
  );
};