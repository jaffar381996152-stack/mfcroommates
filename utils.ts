
import { Expense, Roommate } from './types';

export const formatCurrency = (amount: number) => {
  return amount.toFixed(2) + ' SAR';
};

export const calculateSettlements = (expenses: Expense[], roommates: Roommate[]) => {
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
    const balance = perPersonShare - paid;
    
    return {
      roommateId: roommate.id,
      name: roommate.name,
      paid,
      share: perPersonShare,
      balance, // Positive means they owe money, Negative means they are owed
      isAdmin: roommate.isAdmin
    };
  });
};

export const getMonthKey = (date: Date) => date.toISOString().slice(0, 7);
