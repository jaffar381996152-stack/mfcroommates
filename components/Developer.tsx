
import React, { useState } from 'react';
import { AppState } from '../types';
import { Database, RefreshCcw, ShieldAlert, Lock, Calendar, Settings as SettingsIcon } from 'lucide-react';

interface DeveloperProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Developer: React.FC<DeveloperProps> = ({ state, setState }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [debugDate, setDebugDate] = useState(state.currentMonth);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'MFC' && password === '1234') {
      setIsAuth(true);
    } else {
      alert('Invalid Credentials');
    }
  };

  const forceReset = () => {
    if (confirm('DANGER: This will permanently wipe all local data. Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const updateCurrentMonth = () => {
    setState(prev => ({ ...prev, currentMonth: debugDate }));
    alert(`System date overridden to: ${debugDate}`);
  };

  const simulateMonthEnd = () => {
    const currentMonthKey = state.currentMonth;
    const [year, month] = currentMonthKey.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthKey = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;

    setState(prev => ({
      ...prev,
      currentMonth: nextMonthKey,
      expenses: [],
      archive: [...prev.archive, {
        monthKey: prev.currentMonth,
        expenses: [...prev.expenses],
        roommates: prev.roommates.map(r => ({ ...r, isSettled: false })),
        isSettled: false
      }]
    }));
    alert("Manual roll-over executed.");
  };

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-2xl max-w-sm w-full space-y-6">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Lock size={32} strokeWidth={2.5} className="text-black" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-black uppercase tracking-tighter">Developer Auth</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">System level access</p>
          </div>
          <div className="space-y-3">
            <input 
              type="text" placeholder="Username" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl focus:outline-none font-bold text-black focus:border-black transition-all text-sm"
              value={username} onChange={e => setUsername(e.target.value)}
            />
            <input 
              type="password" placeholder="Password" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl focus:outline-none font-bold text-black focus:border-black transition-all text-sm"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-black text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Authenticate</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-black">Control Panel</h2>
        <button onClick={() => setIsAuth(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black transition-colors">Logout</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-5 shadow-sm">
          <h3 className="text-[10px] font-black flex items-center gap-2 text-black uppercase tracking-[0.2em]"><Database size={14} strokeWidth={3} /> Logic Overrides</h3>
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set System Month</label>
             <div className="flex gap-2">
               <input 
                type="month" 
                className="flex-1 bg-slate-50 p-2 rounded-lg border-2 border-slate-100 text-black font-bold text-sm focus:outline-none focus:border-black"
                value={debugDate}
                onChange={e => setDebugDate(e.target.value)}
               />
               <button onClick={updateCurrentMonth} className="px-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Apply</button>
             </div>
          </div>

          <button onClick={simulateMonthEnd} className="w-full flex items-center justify-between p-3 bg-slate-50 text-black rounded-xl border-2 border-transparent hover:border-black transition-all group">
            <span className="text-[10px] font-black uppercase tracking-widest">Simulate Roll-over</span>
            <RefreshCcw size={16} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
          
          <button onClick={forceReset} className="w-full flex items-center justify-between p-3 bg-red-50 text-red-600 rounded-xl border-2 border-transparent hover:border-red-600 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest">Purge Database</span>
            <ShieldAlert size={16} strokeWidth={3} />
          </button>
        </section>

        <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
           <h3 className="text-[10px] font-black mb-5 flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]"><SettingsIcon size={14} strokeWidth={3} /> Environment State</h3>
           <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-transparent flex justify-between items-center">
                 <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest">Stored Month</p>
                 <p className="font-black text-black text-sm uppercase">{state.currentMonth}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-transparent flex justify-between items-center">
                 <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest">Active Buffer</p>
                 <p className="font-black text-black text-sm uppercase">{state.expenses.length} Entries</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-transparent flex justify-between items-center">
                 <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest">History Depth</p>
                 <p className="font-black text-black text-sm uppercase">{state.archive.length} Mo</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Developer;
