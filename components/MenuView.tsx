
import React, { useState, useEffect } from 'react';
import { Drink, DrinkCategory } from '../types';
import * as db from '../services/db';
import { Plus, Edit2, Trash2, Beer, Coffee, Utensils } from 'lucide-react';
import { Modal } from './ui/Modal';

export const MenuView: React.FC = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Partial<Drink>>({});

  useEffect(() => {
    loadDrinks();
  }, []);

  const loadDrinks = () => {
    setDrinks(db.getDrinks());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrink.name || editingDrink.price_sale === undefined) return;

    db.saveDrink({
      id: editingDrink.id,
      name: editingDrink.name,
      price_sale: Number(editingDrink.price_sale),
      price_purchase: Number(editingDrink.price_purchase ?? 0),
      category: editingDrink.category || DrinkCategory.SOFT,
    });
    
    setIsModalOpen(false);
    loadDrinks();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer cette boisson du menu ?")) {
      db.deleteDrink(id);
      loadDrinks();
    }
  };

  const openNew = () => {
    setEditingDrink({ category: DrinkCategory.SOFT });
    setIsModalOpen(true);
  };

  const openEdit = (drink: Drink) => {
    setEditingDrink(drink);
    setIsModalOpen(true);
  };

  const getIcon = (cat: DrinkCategory) => {
    switch (cat) {
      case DrinkCategory.ALCOHOL: return <Beer className="text-amber-500" />;
      case DrinkCategory.FOOD: return <Utensils className="text-orange-500" />;
      default: return <Coffee className="text-blue-400" />;
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 space-y-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Carte</h1>
        <button 
          onClick={openNew}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/20"
        >
          <Plus size={20} />
          <span>Ajouter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drinks.map(drink => (
          <div key={drink.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-lg">
                {getIcon(drink.category)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">{drink.name}</h3>
                <div className="text-sm text-slate-400">
                  Achat: {drink.price_purchase.toFixed(2)}€
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xl font-bold text-yellow-500">{drink.price_sale.toFixed(2)}€</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEdit(drink)}
                  className="p-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(drink.id)}
                  className="p-2 bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingDrink.id ? "Modifier boisson" : "Nouvelle boisson"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nom</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
              value={editingDrink.name || ''}
              onChange={e => setEditingDrink({...editingDrink, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Prix Vente (€)</label>
              <input 
                required
                type="number" 
                step="0.01"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                value={editingDrink.price_sale ?? ''}
                onChange={e => setEditingDrink({...editingDrink, price_sale: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Prix Achat (€)</label>
              <input 
                required
                type="number" 
                step="0.01"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                value={editingDrink.price_purchase ?? ''}
                onChange={e => setEditingDrink({...editingDrink, price_purchase: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Catégorie</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(DrinkCategory).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEditingDrink({...editingDrink, category: cat})}
                  className={`p-2 rounded-lg text-sm font-medium border ${
                    editingDrink.category === cat 
                      ? 'bg-yellow-500 text-slate-900 border-yellow-500' 
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl mt-4"
          >
            Enregistrer
          </button>
        </form>
      </Modal>
    </div>
  );
};
