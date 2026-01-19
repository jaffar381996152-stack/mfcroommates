
import { Expense, Roommate } from './types';

export const formatCurrency = (amount: number) => {
  return amount.toFixed(2) + ' SAR';
};

export const calculateSettlements = (
  expenses: Expense[],
  roommates: Roommate[],
  advances: Record<string, number> = {}
) => {
  if (roommates.length === 0) return [];
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPersonShare = totalSpent / roommates.length;
  
  const admin = roommates.find(r => r.isAdmin) || roommates[0];
  
  return roommates.map(roommate => {
    const paid = expenses
      .filter(e => e.payerId === roommate.id)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Logic: Everyone pays admin their share, and admin pays back those who spent more
    // Simplified as per user request: "How much who owes to who"
    // Difference = Share - Paid. 
    // If Positive: Roommate owes Admin. 
    // If Negative: Admin owes Roommate (Roommate is "in profit").
    const advance = advances[roommate.id] || 0;
    // Advance means roommate already paid some amount directly to admin.
    // That should reduce what they still owe in settlements.
    const balance = perPersonShare - (paid + advance);
    
    return {
      roommateId: roommate.id,
      name: roommate.name,
      paid,
      advance,
      share: perPersonShare,
      balance, // Positive means they owe money, Negative means they are owed
      isAdmin: roommate.isAdmin
    };
  });
};

export const getMonthKey = (date: Date) => date.toISOString().slice(0, 7);
