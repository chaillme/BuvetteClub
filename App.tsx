import React, { useState } from 'react';
import { ViewState, User } from './types';
import { ClientsView } from './components/ClientsView';
import { MenuView } from './components/MenuView';
import { HistoryView } from './components/HistoryView';
import { ActiveTab } from './components/ActiveTab';
import { Users, FileText, History, Lock } from 'lucide-react';
import { Modal } from './components/ui/Modal';
import { CONFIG } from './config';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('CLIENTS');
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Authentication State
  const [isMenuAuthenticated, setIsMenuAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleSelectUser = (user: User) => {
    setActiveUser(user);
  };

  const handleCloseTab = () => {
    setActiveUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMenuClick = () => {
    if (isMenuAuthenticated) {
      setView('MENU');
    } else {
      setPasswordAttempt('');
      setPasswordError(false);
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAttempt === CONFIG.MENU_PASSWORD) {
      setIsMenuAuthenticated(true);
      setIsPasswordModalOpen(false);
      setView('MENU');
    } else {
      setPasswordError(true);
      // Shake effect or visual feedback could be added here, simplified to state for now
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-yellow-500 selection:text-slate-900">
      
      {/* Main Content Area */}
      <main className="h-full">
        {view === 'CLIENTS' && <ClientsView onSelectUser={handleSelectUser} refreshTrigger={refreshTrigger} />}
        {view === 'MENU' && <MenuView />}
        {view === 'HISTORY' && <HistoryView />}
      </main>

      {/* POS Overlay (Active Tab) */}
      {activeUser && (
        <ActiveTab user={activeUser} onClose={handleCloseTab} />
      )}

      {/* Password Modal */}
      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        title="Accès Protégé"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4 text-slate-400">
            <div className="p-4 bg-slate-700 rounded-full mb-2">
              <Lock size={32} className="text-yellow-500" />
            </div>
            <p className="text-sm text-center">L'accès à la modification de la carte nécessite un mot de passe administrateur.</p>
          </div>

          <div>
            <input 
              autoFocus
              type="password"
              inputMode="numeric"
              placeholder="Mot de passe"
              className={`w-full bg-slate-900 border ${passwordError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500 text-center tracking-widest text-lg`}
              value={passwordAttempt}
              onChange={(e) => {
                setPasswordAttempt(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
            />
            {passwordError && (
              <p className="text-red-500 text-xs text-center mt-2 font-bold animate-pulse">Mot de passe incorrect</p>
            )}
          </div>
          
          <button type="submit" className="w-full bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-yellow-400 active:scale-95 transition-transform">
            Déverrouiller
          </button>
        </form>
      </Modal>

      {/* Bottom Navigation */}
      {!activeUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 pb-safe">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            <button 
              onClick={() => setView('CLIENTS')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'CLIENTS' ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users size={24} />
              <span className="text-xs font-medium">Clients</span>
            </button>
            <button 
              onClick={handleMenuClick}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'MENU' ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {isMenuAuthenticated ? <FileText size={24} /> : <Lock size={24} />}
              <span className="text-xs font-medium">Carte</span>
            </button>
            <button 
              onClick={() => setView('HISTORY')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'HISTORY' ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <History size={24} />
              <span className="text-xs font-medium">Historique</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;