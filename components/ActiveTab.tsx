import React, { useState, useEffect, useMemo } from 'react';
import { User, Drink, Consumption, DrinkCategory, TransactionType, PaymentMethod } from '../types';
import * as db from '../services/db';
import { Minus, Trash2, ArrowLeft, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal';

interface ActiveTabProps {
  user: User;
  onClose: () => void;
}

export const ActiveTab: React.FC<ActiveTabProps> = ({ user, onClose }) => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [filter, setFilter] = useState<DrinkCategory | 'ALL'>('ALL');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setDrinks(db.getDrinks());
    refreshConsumptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const refreshConsumptions = () => {
    setConsumptions(db.getConsumptionsForUser(user.id));
  };

  const handleAddDrink = (drink: Drink) => {
    db.addConsumption(user.id, drink);
    refreshConsumptions();
  };

  const handleRemoveOne = (id: string) => {
    db.removeOneConsumption(id);
    refreshConsumptions();
  };

  const total = useMemo(() => {
    return consumptions.reduce((acc, c) => acc + (c.priceSaleAtTime * c.quantity), 0);
  }, [consumptions]);

  const handlePayment = (method: PaymentMethod) => {
    db.createTransaction(user, consumptions, TransactionType.SALE, method);
    setIsPaymentModalOpen(false);
    onClose(); // Returns to main screen, user is gone
  };

  const filteredDrinks = drinks.filter(d => filter === 'ALL' || d.category === filter);

  return (
    <div className="fixed inset-0 bg-slate-900 z-40 flex flex-col md:flex-row h-full">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400">
          <ArrowLeft />
        </button>
        <h2 className="font-bold text-white">{user.name}</h2>
        <div className="font-mono text-yellow-500 font-bold">{total.toFixed(2)}€</div>
      </div>

      {/* LEFT PANEL: Menu (Scrollable) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Categories & Navigation */}
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 items-center">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 transition-colors mr-2"
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </button>
          
          <div className="h-6 w-px bg-slate-700 mx-1 flex-shrink-0" />

          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${filter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
          >
            Tout
          </button>
          {Object.values(DrinkCategory).map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${filter === cat ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Drink Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 content-start pb-32 md:pb-4">
          {filteredDrinks.map(drink => (
            <button
              key={drink.id}
              onClick={() => handleAddDrink(drink)}
              className="bg-slate-800 border-2 border-slate-700 hover:border-yellow-500/50 active:scale-95 transition-all p-4 rounded-xl flex flex-col justify-between aspect-[4/3] group shadow-lg"
            >
              <span className="font-bold text-slate-100 text-left leading-tight line-clamp-2">{drink.name}</span>
              <span className="self-end font-mono text-yellow-500 font-bold text-xl group-hover:scale-110 transition-transform">{drink.price_sale.toFixed(2)}€</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Current Tab (Bottom sheet on mobile, Sidebar on desktop) */}
      <div className="h-[45vh] md:h-full md:w-[400px] bg-slate-800 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col shadow-2xl z-20">
        
        {/* Desktop Header */}
        <div className="hidden md:flex p-4 border-b border-slate-700 items-center justify-between">
          <button onClick={onClose} className="text-slate-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={18} /> Retour
          </button>
          <h2 className="font-bold text-xl text-white">{user.name}</h2>
        </div>

        {/* Tab Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {consumptions.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">Ardoise vide</div>
          ) : (
            consumptions.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex-1">
                  <div className="text-slate-200 font-medium">{c.drinkName}</div>
                  <div className="text-xs text-slate-500">{c.priceSaleAtTime.toFixed(2)}€ unitaire</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-yellow-500 font-bold">{(c.priceSaleAtTime * c.quantity).toFixed(2)}€</div>
                  <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                    <button 
                      onClick={() => handleRemoveOne(c.id)}
                      className="p-2 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-l-lg transition-colors"
                    >
                      {c.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{c.quantity}</span>
                    {/* Add button is implicitly clicking the menu item again, keeping UI simple here */}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Checkout */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-4 pb-8 md:pb-4">
          <div className="flex justify-between items-end">
            <span className="text-slate-400 font-medium">Total à payer</span>
            <span className="text-3xl font-bold text-white font-mono">{total.toFixed(2)}€</span>
          </div>
          <button 
            disabled={consumptions.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 text-slate-900 font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all"
          >
            <CheckCircle2 />
            Encaisser
          </button>
        </div>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Encaissement">
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-sm text-slate-400">Montant total</div>
            <div className="text-4xl font-bold text-white mt-1">{total.toFixed(2)}€</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handlePayment(PaymentMethod.CASH)}
              className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-colors"
            >
              <Banknote size={32} className="text-green-400" />
              <span className="font-bold text-white">Espèces</span>
            </button>
            <button 
              onClick={() => handlePayment(PaymentMethod.CARD)}
              className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-colors"
            >
              <CreditCard size={32} className="text-blue-400" />
              <span className="font-bold text-white">Carte / Compte</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};