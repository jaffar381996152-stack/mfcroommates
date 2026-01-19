
import React, { useState } from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  Wallet, 
  Users, 
  Settings, 
  Code, 
  History,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
}

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'Settlements', icon: Wallet, label: 'Settlements' },
    { id: 'Roommates', icon: Users, label: 'Roommates' },
    { id: 'Archive', icon: History, label: 'Previous' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
    { id: 'Developer', icon: Code, label: 'Developer' },
  ];

  const handleNav = (id: View) => {
    setView(id);
    setIsOpen(false);
  };

  return (
    <>
      <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex items-center justify-between">
        <h1 className="font-bold text-black tracking-tight">MFC Room Budget</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-black hover:bg-slate-100 rounded-lg transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-xl font-black text-black tracking-tighter">MFC Room Budget</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Expense Controller</p>
        </div>
        
        <div className="md:hidden p-6 border-b border-slate-100 flex justify-between items-center text-black">
          <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">Navigation</span>
          <button onClick={() => setIsOpen(false)} className="text-black"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id as View)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                currentView === item.id 
                ? 'bg-black text-white shadow-lg' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-black'
              }`}
            >
              <item.icon size={20} className={currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-black'} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
           <p className="text-[9px] text-center text-slate-400 font-bold tracking-widest uppercase">
             By Muhammad Jaffar Abbas
           </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
