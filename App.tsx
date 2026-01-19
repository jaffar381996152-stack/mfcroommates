
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, View, Expense, Roommate, Category, MonthlyData } from './types';
import { STORAGE_KEY, INITIAL_STATE } from './constants';
import { getMonthKey } from './utils';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Settlements from './components/Settlements';
import Roommates from './components/Roommates';
import Settings from './components/Settings';
import Developer from './components/Developer';
import Archive from './components/Archive';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : INITIAL_STATE;
    return {
      ...parsed,
      advances: parsed.advances || {},
      settings: { ...parsed.settings, theme: 'light' }
    };
  });
  
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [showUnsettledPopup, setShowUnsettledPopup] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const checkMonthTransition = () => {
      const now = new Date();
      const actualMonthKey = getMonthKey(now);
      
      // Fixed Logic: Only archive if the stored month is strictly earlier than the current real month
      if (state.currentMonth < actualMonthKey) {
        const newArchiveEntry: MonthlyData = {
          monthKey: state.currentMonth,
          expenses: [...state.expenses],
          roommates: state.roommates.map(r => ({ ...r, isSettled: false })),
          isSettled: false
        };

        setState(prev => {
            // Check if this month is already archived to prevent duplicates
            const alreadyArchived = prev.archive.some(m => m.monthKey === prev.currentMonth);
            if (alreadyArchived) return { ...prev, currentMonth: actualMonthKey };

            return {
                ...prev,
                currentMonth: actualMonthKey,
                expenses: [],
                advances: {},
                archive: [...prev.archive, newArchiveEntry]
            };
        });
      }
    };
    checkMonthTransition();
    // Check frequently so if user changes device date/time, the app follows immediately.
    const interval = setInterval(checkMonthTransition, 1000 * 60);
    return () => clearInterval(interval);
  }, [state.currentMonth, state.expenses, state.roommates]);

  const isBlocked = useMemo(() => state.archive.some(m => !m.isSettled), [state.archive]);

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    if (isBlocked) {
      setShowUnsettledPopup(true);
      return;
    }
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
  };

  const handleDeleteExpense = (id: string) => {
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  const handleUpdateRoommates = (roommates: Roommate[]) => {
    setState(prev => ({ ...prev, roommates }));
  };

  // Advance can be positive (roommate already paid admin) or negative (admin already gave roommate)
  const handleChangeAdvance = (roommateId: string, amount: number) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    setState(prev => ({
      ...prev,
      advances: { ...prev.advances, [roommateId]: safeAmount }
    }));
  };

  const handleSettlePrevious = (monthKey: string) => {
    setState(prev => ({
      ...prev,
      archive: prev.archive.map(m => m.monthKey === monthKey ? { ...m, isSettled: true } : m)
    }));
  };

  const handleDeleteArchiveMonth = (monthKey: string) => {
    setState(prev => ({
      ...prev,
      archive: prev.archive.filter(m => m.monthKey !== monthKey)
    }));
  };

  const handleResetAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL app data from this device? This action cannot be undone.'
    );
    if (!confirmed) return;

    // Remove ONLY this app's persisted data
    localStorage.removeItem(STORAGE_KEY);

    // Reset in-memory state as well
    setState({
      ...INITIAL_STATE,
      advances: {},
      settings: { ...INITIAL_STATE.settings, theme: 'light' }
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard': return <Dashboard expenses={state.expenses} roommates={state.roommates} onAdd={handleAddExpense} onDelete={handleDeleteExpense} />;
      case 'Analytics': return <Analytics expenses={state.expenses} roommates={state.roommates} />;
      case 'Settlements': return <Settlements expenses={state.expenses} roommates={state.roommates} advances={state.advances} onChangeAdvance={handleChangeAdvance} />;
      case 'Roommates': return <Roommates roommates={state.roommates} onUpdate={handleUpdateRoommates} />;
      case 'Settings': return <Settings state={state} onResetAllData={handleResetAllData} />;
      case 'Developer': return <Developer state={state} setState={setState} />;
      case 'Archive': return <Archive archive={state.archive} onSettle={handleSettlePrevious} onDelete={handleDeleteArchiveMonth} />;
      default: return <Dashboard expenses={state.expenses} roommates={state.roommates} onAdd={handleAddExpense} onDelete={handleDeleteExpense} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-black selection:bg-slate-200">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8 relative">
        {renderView()}
      </main>

      {showUnsettledPopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-red-600 mb-2 uppercase tracking-tight">Unsettled Payments</h2>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">You have unsettled payments from previous months. Please settle them in the 'Previous' section before adding new expenses.</p>
            <button 
              onClick={() => {
                setShowUnsettledPopup(false);
                setCurrentView('Archive');
              }}
              className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all hover:bg-slate-800"
            >
              Go to Previous Month
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 text-[10px] text-slate-400 pointer-events-none z-10 hidden md:block font-bold tracking-widest uppercase">
        Developed by Muhammad Jaffar Abbas
      </div>
    </div>
  );
};

export default App;
