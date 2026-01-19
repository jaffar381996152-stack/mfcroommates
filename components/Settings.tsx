
import React from 'react';
import { AppState } from '../types';
import { Info, ShieldCheck } from 'lucide-react';

interface SettingsProps {
  state: AppState;
}

const Settings: React.FC<SettingsProps> = ({ state }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-black tracking-tight">Settings</h2>

      <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info size={14} /> Application Information
          </h3>
          <div className="p-4 border-2 border-slate-100 rounded-xl space-y-3 bg-slate-50">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase">App Name</span>
              <span className="text-sm font-black text-black">MFC Room Budget</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase">Display Theme</span>
              <span className="text-sm font-black text-black">Light Minimalist</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase">Version</span>
              <span className="text-sm font-black text-black">1.4.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase">Author</span>
              <span className="text-sm font-black text-black">Muhammad Jaffar Abbas</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 border-2 border-slate-200 rounded-xl flex items-start gap-3">
          <ShieldCheck size={18} className="text-black shrink-0 mt-0.5" />
          <p className="text-black text-[11px] leading-relaxed font-bold uppercase tracking-tight">
            Local Storage Only: Your data is saved locally on this device. Clearing your browser cache or app data will erase your records.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Settings;
