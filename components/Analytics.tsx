
import React from 'react';
import { Expense, Roommate, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils';

interface AnalyticsProps {
  expenses: Expense[];
  roommates: Roommate[];
}

const Analytics: React.FC<AnalyticsProps> = ({ expenses, roommates }) => {
  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(d => d.value > 0);

  const spendingPerRoommate = roommates.map(r => ({
    name: r.name,
    amount: expenses.filter(e => e.payerId === r.id).reduce((sum, e) => sum + e.amount, 0)
  }));

  // High contrast colors for light theme
  const COLORS = ['#000000', '#475569', '#94a3b8', '#1e293b'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-black tracking-tight">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm min-h-[400px]">
          <h3 className="text-xs font-black mb-6 text-slate-400 uppercase tracking-widest">Spending by Category</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #f1f5f9', borderRadius: '12px' }}
                  itemStyle={{ color: '#000000', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => formatCurrency(value)} 
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm min-h-[400px]">
          <h3 className="text-xs font-black mb-6 text-slate-400 uppercase tracking-widest">Contribution by Roommate</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingPerRoommate}>
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#000000', fontWeight: 'bold'}} />
                <YAxis fontSize={10} width={40} axisLine={false} tickLine={false} tick={{fill: '#000000', fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #f1f5f9', borderRadius: '12px' }}
                  itemStyle={{ color: '#000000', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => formatCurrency(value)} 
                />
                <Bar dataKey="amount" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
        <h3 className="text-xs font-black mb-4 text-slate-400 uppercase tracking-widest">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Spent</p>
            <p className="text-lg font-black text-black truncate">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</p>
          </div>
          <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Items</p>
            <p className="text-xl font-black text-black">{expenses.length}</p>
          </div>
          <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Daily Avg</p>
            <p className="text-lg font-black text-black truncate">{formatCurrency(expenses.length > 0 ? expenses.reduce((s, e) => s + e.amount, 0) / 30 : 0)}</p>
          </div>
          <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Share/Head</p>
            <p className="text-lg font-black text-black truncate">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0) / (roommates.length || 1))}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
