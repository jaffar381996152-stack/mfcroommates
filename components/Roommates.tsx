
import React, { useState } from 'react';
import { Roommate } from '../types';
import { Plus, Trash2, UserPlus, ShieldCheck } from 'lucide-react';

interface RoommatesProps {
  roommates: Roommate[];
  onUpdate: (roommates: Roommate[]) => void;
}

const Roommates: React.FC<RoommatesProps> = ({ roommates, onUpdate }) => {
  const [newName, setNewName] = useState('');

  const addRoommate = () => {
    if (!newName.trim()) return;
    const newR: Roommate = {
      id: crypto.randomUUID(),
      name: newName,
      isAdmin: roommates.length === 0,
      isSettled: true
    };
    onUpdate([...roommates, newR]);
    setNewName('');
  };

  const deleteRoommate = (id: string) => {
    if (roommates.find(r => r.id === id)?.isAdmin) {
      alert("Cannot delete the system admin.");
      return;
    }
    onUpdate(roommates.filter(r => r.id !== id));
  };

  const makeAdmin = (id: string) => {
    onUpdate(roommates.map(r => ({ ...r, isAdmin: r.id === id })));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-black">Roommates</h2>

      <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
        <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-black uppercase tracking-wider">
          <UserPlus size={18} strokeWidth={3} /> Add New Member
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Name"
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-black"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button 
            onClick={addRoommate}
            className="bg-black text-white px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Plus size={18} strokeWidth={3} /> Add
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roommates.map(r => (
          <div key={r.id} className="bg-white p-4 rounded-xl border-2 border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-black text-white text-xs">
                {r.name[0]}
              </div>
              <div>
                <p className="font-black text-sm flex items-center gap-1.5">
                  {r.name}
                  {r.isAdmin && <ShieldCheck size={14} strokeWidth={3} className="text-black" />}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.isAdmin ? 'Admin' : 'Member'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!r.isAdmin && (
                <button 
                  onClick={() => makeAdmin(r.id)}
                  className="text-[8px] font-black text-slate-400 border border-slate-200 px-2 py-1 rounded uppercase tracking-widest hover:bg-slate-100 hover:text-black hover:border-black transition-all"
                >
                  Admin
                </button>
              )}
              <button 
                onClick={() => deleteRoommate(r.id)}
                className="text-slate-200 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roommates;
