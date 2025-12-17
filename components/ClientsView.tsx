
import React, { useState, useEffect } from 'react';
import { User, Consumption, TransactionType, PaymentMethod } from '../types';
import * as db from '../services/db';
import { Search, Plus, User as UserIcon, Edit2, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { Modal } from './ui/Modal';

interface ClientsViewProps {
  onSelectUser: (user: User) => void;
  refreshTrigger?: number;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onSelectUser, refreshTrigger = 0 }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [userDebts, setUserDebts] = useState<Record<string, number>>({});
  
  // Modals
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = () => {
    const loadedUsers = db.getUsers();
    setUsers(loadedUsers);
    
    // Calculate debts
    const consumptions = db.getConsumptions();
    const debts: Record<string, number> = {};
    loadedUsers.forEach(u => debts[u.id] = 0);
    consumptions.forEach(c => {
      // Ensure we only sum for existing users, or handle orphaned records implicitly (though db cleans them up)
      if (debts[c.userId] !== undefined) {
        debts[c.userId] += (c.priceSaleAtTime * c.quantity);
      }
    });
    setUserDebts(debts);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      db.addUser(newUserName.trim());
      setNewUserName('');
      setIsNewUserModalOpen(false);
      loadData();
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && editingUser.name.trim()) {
      db.updateUser(editingUser.id, editingUser.name.trim());
      setIsEditModalOpen(false);
      loadData();
    }
  };

  const handleDeleteUser = () => {
    if (!editingUser) return;
    
    // Create a DELETION transaction for traceability if they have a debt
    const debt = userDebts[editingUser.id];
    if (debt > 0) {
      const userConsumptions = db.getConsumptionsForUser(editingUser.id);
      db.createTransaction(editingUser, userConsumptions, TransactionType.DELETION, PaymentMethod.NONE);
    } else {
      db.deleteUser(editingUser.id);
    }

    setIsEditModalOpen(false);
    setIsDeleteMode(false);
    setEditingUser(null);
    loadData();
  };

  const openEdit = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setEditingUser(user);
    setIsDeleteMode(false);
    setIsEditModalOpen(true);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-24 pt-4 px-4 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un client..." 
            className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsNewUserModalOpen(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-3 rounded-xl shadow-lg shadow-yellow-500/20 transition-transform active:scale-95 flex items-center gap-2 font-bold"
        >
          <Plus size={20} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredUsers.map(user => {
          const debt = userDebts[user.id] || 0;
          const createdDate = new Date(user.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          });

          return (
            <div 
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="bg-slate-800 border border-slate-700 active:border-yellow-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:bg-slate-750 transition-colors cursor-pointer shadow-sm"
            >
              <button 
                onClick={(e) => openEdit(e, user)}
                className="absolute top-2 right-2 p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 size={16} />
              </button>

              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 border-2 border-slate-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {debt > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-800 animate-pulse" />
                )}
              </div>
              
              <div className="text-center w-full">
                <h3 className="font-bold text-slate-100 truncate mb-0.5">{user.name}</h3>
                
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1 opacity-70">
                  <Calendar size={10} />
                  <span>Depuis le {createdDate}</span>
                </div>

                <p className={`text-sm font-mono ${debt > 0 ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>
                  {debt > 0 ? `${debt.toFixed(2)}€` : '0.00€'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20 px-4">
          <p className="text-xl md:text-2xl font-bold text-yellow-500 leading-tight">
            {search 
              ? "Aucun client trouvé pour cette recherche." 
              : "Pas encore de client renseigné, ajoutez en un pour commencer !"}
          </p>
        </div>
      )}

      {/* New User Modal */}
      <Modal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} title="Nouveau Client">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <input 
            autoFocus
            type="text" 
            placeholder="Nom du client"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <button type="submit" className="w-full bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl">
            Créer
          </button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier Client">
        {editingUser && (
           !isDeleteMode ? (
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nom</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDeleteMode(true)}
                  className="flex-1 bg-slate-700 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-600"
                >
                  <Trash2 size={18} />
                  Supprimer
                </button>
                <button type="submit" className="flex-[2] bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-yellow-400">
                  Sauvegarder
                </button>
              </div>
            </form>
           ) : (
             <div className="space-y-4 animate-in fade-in zoom-in duration-200">
               <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex items-start gap-3">
                 <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                 <div>
                   <h3 className="text-red-500 font-bold">Confirmer la suppression</h3>
                   <p className="text-sm text-red-200/70 mt-1">
                     Cette action est irréversible. Si le client a une ardoise en cours ({userDebts[editingUser.id]?.toFixed(2)}€), elle sera archivée comme "Suppression".
                   </p>
                 </div>
               </div>
               <div className="flex gap-3 mt-4">
                 <button 
                   onClick={() => setIsDeleteMode(false)}
                   className="flex-1 bg-slate-700 text-slate-300 font-bold py-3 rounded-xl"
                 >
                   Annuler
                 </button>
                 <button 
                   onClick={handleDeleteUser}
                   className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
                 >
                   Confirmer
                 </button>
               </div>
             </div>
           )
        )}
      </Modal>
    </div>
  );
};
