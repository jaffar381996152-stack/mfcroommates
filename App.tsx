
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Expense, Category, Budget, Debt, MonthlyHistory, SettlementPayment } from './types';
import { ExpenseCard } from './components/ExpenseCard';
import { SettlementView } from './components/SettlementView';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const CURRENCY_SYMBOL = '﷼';
const CURRENCY_CODE = 'SAR';

const LS_KEYS = {
  expenses: 'rw_expenses',
  users: 'rw_users',
  history: 'rw_history',
  settlementPayments: 'rw_settlement_payments',
  lastArchiveMonth: 'rw_last_archive_month',
  adminId: 'rw_admin_id',
  pendingArchive: 'rw_pending_archive'
} as const;

// Developer-only time override helpers (for testing the archive logic locally)
// localStorage keys:
//  - rw_dev_date: ISO string (e.g. 2026-02-01T00:00:00.000Z)
//  - rw_dev_force_first: '1' to force "1st of month" behavior
const getNow = () => {
  try {
    const devDate = localStorage.getItem('rw_dev_date');
    if (devDate) {
      const d = new Date(devDate);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {
    // ignore
  }
  return new Date();
};

const isDevForceFirst = () => {
  try {
    return localStorage.getItem('rw_dev_force_first') === '1';
  } catch {
    return false;
  }
};

const monthKeyFor = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const isWithinLastNMonths = (monthKey: string, n: number) => {
  // monthKey: YYYY-MM
  const [y, m] = monthKey.split('-').map(Number);
  const keyDate = new Date(y, m - 1, 1);
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  return keyDate >= cutoff;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'stats' | 'settle' | 'roommates' | 'settings' | 'history'>('expenses');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<MonthlyHistory[]>([]);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlementPayments, setSettlementPayments] = useState<SettlementPayment[]>([]);
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: '2', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  ]);
  // One roommate is the admin who collects money and settles up at month end.
  const [adminId, setAdminId] = useState<string>(users[0]?.id || '');
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: Category.GROCERIES, limit: 400 },
    { category: Category.UTILITIES, limit: 200 },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  // When set, the Add Item modal becomes an Edit Item modal.
  const [editingExpenseId, setEditingExpenseId] = useState<string>('');

  // Dashboard Activity filter
  const [selectedActivityDate, setSelectedActivityDate] = useState<string>('');
  // AI (Gemini) logic removed to keep the app fully free/offline.

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.OTHER);
  const [paidBy, setPaidBy] = useState<string>(users[0]?.id || '1');
  const [roommateName, setRoommateName] = useState('');
  // Activity defaults to the most recent date, and auto-updates as new expenses come in.
  const [activityDate, setActivityDate] = useState<string>('recent');

  // If we hit the 1st of the month but settlements are still pending, we keep a "pending archive" flag.
  // Once all debts are settled, we auto-archive instantly.
  const [pendingArchiveMonth, setPendingArchiveMonth] = useState<string>('');

  // IMPORTANT:
  // Avoid wiping localStorage on refresh.
  // On first render, React runs persist effects with default state BEFORE
  // our "Load persisted data" effect runs. That overwrites saved data with
  // empty arrays/default users, which is exactly what you observed.
  const [isHydrated, setIsHydrated] = useState(false);

  // Auto-sync paidBy if users list changes and current selection is gone
  useEffect(() => {
    if (users.length > 0 && !users.some(u => u.id === paidBy)) {
      setPaidBy(users[0].id);
    }
  }, [users, paidBy]);

  // Load persisted data
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(LS_KEYS.users);
      const savedExpenses = localStorage.getItem(LS_KEYS.expenses);
      const savedHistory = localStorage.getItem(LS_KEYS.history);
      const savedPayments = localStorage.getItem(LS_KEYS.settlementPayments);
      const savedAdminId = localStorage.getItem(LS_KEYS.adminId);
      const savedPendingArchive = localStorage.getItem(LS_KEYS.pendingArchive);
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedPayments) setSettlementPayments(JSON.parse(savedPayments));
      if (savedAdminId) setAdminId(savedAdminId);
      if (savedPendingArchive) setPendingArchiveMonth(savedPendingArchive);
    } catch {
      // ignore broken storage
    }

    // Mark hydration complete (whether or not anything existed in storage)
    setIsHydrated(true);
  }, []);

  // Persist data
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS_KEYS.users, JSON.stringify(users));
  }, [users, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS_KEYS.expenses, JSON.stringify(expenses));
  }, [expenses, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS_KEYS.history, JSON.stringify(history));
  }, [history, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS_KEYS.settlementPayments, JSON.stringify(settlementPayments));
  }, [settlementPayments, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (adminId) localStorage.setItem(LS_KEYS.adminId, adminId);
  }, [adminId, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (pendingArchiveMonth) localStorage.setItem(LS_KEYS.pendingArchive, pendingArchiveMonth);
    else localStorage.removeItem(LS_KEYS.pendingArchive);
  }, [pendingArchiveMonth, isHydrated]);

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const perPerson = users.length > 0 ? total / users.length : 0;
    
    let userStats = users.map(u => {
      const paid = expenses
        .filter(e => e.paidBy === u.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return {
        ...u,
        paid,
        balance: paid - perPerson
      };
    });

    // Apply recorded settlement payments to balances so Settlements section behaves correctly.
    // A payment from A -> B reduces B's credit and reduces A's debt.
    if (settlementPayments.length > 0) {
      const map = new Map(userStats.map(u => [u.id, { ...u }]));
      settlementPayments.forEach(p => {
        const from = map.get(p.from);
        const to = map.get(p.to);
        if (from) from.balance += p.amount;
        if (to) to.balance -= p.amount;
      });
      userStats = Array.from(map.values());
    }

    return { total, perPerson, userStats };
  }, [expenses, users, settlementPayments]);

  const activityDates = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => set.add(new Date(e.date).toISOString().slice(0, 10)));
    return Array.from(set).sort((a, b) => (a > b ? -1 : 1));
  }, [expenses]);

  // Always keep the activity feed focused on the most recent date.
  useEffect(() => {
    if (activityDates.length === 0) return;
    const mostRecent = activityDates[0];
    setActivityDate(prev => (prev === 'recent' || prev === '' ? 'recent' : mostRecent));
  }, [activityDates]);

  const filteredExpenses = useMemo(() => {
    if (activityDate === 'all') return expenses;
    const target = activityDate === 'recent' ? activityDates[0] : activityDate;
    if (!target) return expenses;
    return expenses.filter(e => new Date(e.date).toISOString().slice(0, 10) === target);
  }, [expenses, activityDate]);

  // Settlement logic (admin-based):
  // - Total month amount is split equally among all roommates.
  // - Each roommate has "spent" amount (sum of expenses they paid).
  // - Each roommate has a "due" = share - spent.
  //   * if due > 0 -> they must pay the admin
  //   * if due < 0 -> admin must pay them back
  const debts = useMemo(() => {
    const result: Debt[] = [];
    if (users.length < 2) return result;
    if (!adminId) return result;

    const total = expenses.reduce((acc, e) => acc + e.amount, 0);
    const share = users.length > 0 ? total / users.length : 0;

    users.forEach(u => {
      if (u.id === adminId) return;
      const spent = expenses.filter(e => e.paidBy === u.id).reduce((acc, e) => acc + e.amount, 0);
      // Payments already made to/from admin should affect remaining dues
      const paidToAdmin = settlementPayments
        .filter(p => p.from === u.id && p.to === adminId)
        .reduce((acc, p) => acc + p.amount, 0);
      const receivedFromAdmin = settlementPayments
        .filter(p => p.from === adminId && p.to === u.id)
        .reduce((acc, p) => acc + p.amount, 0);
      const effectiveSpent = spent + paidToAdmin - receivedFromAdmin;
      const due = share - effectiveSpent;
      if (Math.abs(due) < 0.01) return;

      if (due > 0) {
        // user must pay admin
        result.push({ from: u.id, to: adminId, amount: due });
      } else {
        // admin must pay user back
        result.push({ from: adminId, to: u.id, amount: Math.abs(due) });
      }
    });

    // IMPORTANT BUSINESS RULE (Admin settlements):
    // Admin must also settle his own remaining (self settlement) to allow archiving.
    // Represent this as Admin -> Admin debt.
    // NOTE: This must also respect already recorded Admin -> Admin payments,
    // otherwise the UI keeps showing "Admin owes Admin" even after marking as paid.
    const adminSpent = expenses.filter(e => e.paidBy === adminId).reduce((acc, e) => acc + e.amount, 0);
    const adminSelfPaid = settlementPayments
      .filter(p => p.from === adminId && p.to === adminId)
      .reduce((acc, p) => acc + p.amount, 0);
    const adminEffectiveSpent = adminSpent + adminSelfPaid;
    const adminDue = share - adminEffectiveSpent;
    // FIX: Only create an "Admin owes Admin" self-debt when the admin is actually UNDERPAID.
    // Previously we used Math.abs(adminDue) which incorrectly created a self-debt even when
    // adminDue was negative (admin has already overpaid). Marking this as paid then increased
    // adminSelfPaid, making adminDue *more negative*, which caused the UI to keep showing the
    // debt and month-end calculations to grow recursively.
    if (adminDue > 0.01) {
      result.push({ from: adminId, to: adminId, amount: adminDue });
    }

    return result;
  }, [expenses, users, adminId, settlementPayments]);

  const archiveMonth = useCallback((archiveKey?: string) => {
    const now = getNow();
    // By default, archiving on the 1st means we archive the month that just ended.
    const defaultKey = monthKeyFor(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const monthKey = archiveKey || defaultKey;

    // IMPORTANT: only archive data belonging to the requested month.
    const monthExpenses = expenses.filter(e => monthKeyFor(new Date(e.date)) === monthKey);
    if (monthExpenses.length === 0) return;

    const monthPayments = settlementPayments.filter(p => monthKeyFor(new Date(p.date)) === monthKey);
    const monthTotal = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Recompute debts for the archived month only (prevents mixing months).
    const share = users.length > 0 ? monthTotal / users.length : 0;
    const monthDebts: Debt[] = [];
    if (users.length >= 2 && adminId) {
      users.forEach(u => {
        if (u.id === adminId) return;
        const spent = monthExpenses.filter(e => e.paidBy === u.id).reduce((acc, e) => acc + e.amount, 0);
        const paidToAdmin = monthPayments
          .filter(p => p.from === u.id && p.to === adminId)
          .reduce((acc, p) => acc + p.amount, 0);
        const receivedFromAdmin = monthPayments
          .filter(p => p.from === adminId && p.to === u.id)
          .reduce((acc, p) => acc + p.amount, 0);
        const effectiveSpent = spent + paidToAdmin - receivedFromAdmin;
        const due = share - effectiveSpent;
        if (Math.abs(due) < 0.01) return;
        if (due > 0) monthDebts.push({ from: u.id, to: adminId, amount: due });
        else monthDebts.push({ from: adminId, to: u.id, amount: Math.abs(due) });
      });

      // Admin self settlement entry (required to allow archiving).
      const adminSpent = monthExpenses.filter(e => e.paidBy === adminId).reduce((acc, e) => acc + e.amount, 0);
      const adminSelfPaid = monthPayments
        .filter(p => p.from === adminId && p.to === adminId)
        .reduce((acc, p) => acc + p.amount, 0);
      const adminDue = share - (adminSpent + adminSelfPaid);
      // FIX: only record a self-debt when admin is underpaid
      if (adminDue > 0.01) {
        monthDebts.push({ from: adminId, to: adminId, amount: adminDue });
      }
    }

    const newRecord: MonthlyHistory = {
      month: monthKey,
      expenses: [...monthExpenses],
      settlementPayments: [...monthPayments],
      totalSpend: monthTotal,
      finalDebts: [...monthDebts]
    };

    setHistory(prev => {
      const next = [newRecord, ...prev];
      return next.filter(h => isWithinLastNMonths(h.month, 2));
    });

    // Remove ONLY archived month data; keep any current-month data intact.
    setExpenses(prev => prev.filter(e => monthKeyFor(new Date(e.date)) !== monthKey));
    setSettlementPayments(prev => prev.filter(p => monthKeyFor(new Date(p.date)) !== monthKey));

    // Store which month was archived, so the 1st-of-month trigger doesn't re-run.
    localStorage.setItem(LS_KEYS.lastArchiveMonth, monthKey);
    setPendingArchiveMonth('');
    alert(`Month ${monthKey} archived!`);
  }, [expenses, settlementPayments, users, adminId]);

  // Manual archive button handler (still respects business rules).
  const handleArchiveClick = () => {
    const now = getNow();
    const todayIsFirst = isDevForceFirst() || now.getDate() === 1;
    if (!todayIsFirst) {
      alert('Archiving is only allowed on the 1st of the month.');
      return;
    }

    const previousMonthKey = monthKeyFor(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthExpenses = expenses.filter(e => monthKeyFor(new Date(e.date)) === previousMonthKey);
    if (prevMonthExpenses.length === 0) {
      alert('No previous-month data found to archive.');
      localStorage.setItem(LS_KEYS.lastArchiveMonth, previousMonthKey);
      return;
    }

    // Check settlements for previous month before allowing archive.
    const prevMonthPayments = settlementPayments.filter(p => monthKeyFor(new Date(p.date)) === previousMonthKey);
    const prevMonthTotal = prevMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const share = users.length > 0 ? prevMonthTotal / users.length : 0;
    const prevMonthDebts: Debt[] = [];
    if (users.length >= 2 && adminId) {
      users.forEach(u => {
        if (u.id === adminId) return;
        const spent = prevMonthExpenses.filter(e => e.paidBy === u.id).reduce((acc, e) => acc + e.amount, 0);
        const paidToAdmin = prevMonthPayments.filter(p => p.from === u.id && p.to === adminId).reduce((acc, p) => acc + p.amount, 0);
        const receivedFromAdmin = prevMonthPayments.filter(p => p.from === adminId && p.to === u.id).reduce((acc, p) => acc + p.amount, 0);
        const effectiveSpent = spent + paidToAdmin - receivedFromAdmin;
        const due = share - effectiveSpent;
        if (Math.abs(due) < 0.01) return;
        if (due > 0) prevMonthDebts.push({ from: u.id, to: adminId, amount: due });
        else prevMonthDebts.push({ from: adminId, to: u.id, amount: Math.abs(due) });
      });

      // Admin self settlement entry (required to allow archiving).
      const adminSpent = prevMonthExpenses.filter(e => e.paidBy === adminId).reduce((acc, e) => acc + e.amount, 0);
      const adminSelfPaid = prevMonthPayments
        .filter(p => p.from === adminId && p.to === adminId)
        .reduce((acc, p) => acc + p.amount, 0);
      const adminDue = share - (adminSpent + adminSelfPaid);
      if (adminDue > 0.01) {
        prevMonthDebts.push({ from: adminId, to: adminId, amount: adminDue });
      }
    }

    if (prevMonthDebts.length > 0) {
      setPendingArchiveMonth(previousMonthKey);
      alert('Settle previous month settlements first');
      return;
    }

    archiveMonth(previousMonthKey);
  };

  // Auto-archive on the 1st day of the month + retention (keep last 2 months)
  useEffect(() => {
    const now = getNow();
    const todayIsFirst = isDevForceFirst() || now.getDate() === 1;
    const currentMonthKey = monthKeyFor(now);
    const previousMonthKey = monthKeyFor(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastArchived = localStorage.getItem(LS_KEYS.lastArchiveMonth);

    // Retention prune always
    setHistory(prev => prev.filter(h => isWithinLastNMonths(h.month, 2)));

    // On the 1st, we only care about archiving the month that ended.
    if (todayIsFirst && lastArchived !== previousMonthKey) {
      const prevMonthExpenses = expenses.filter(e => monthKeyFor(new Date(e.date)) === previousMonthKey);
      if (prevMonthExpenses.length === 0) {
        localStorage.setItem(LS_KEYS.lastArchiveMonth, previousMonthKey);
        return;
      }

      // Evaluate settlement status for previous month ONLY.
      const prevMonthPayments = settlementPayments.filter(p => monthKeyFor(new Date(p.date)) === previousMonthKey);
      const prevMonthTotal = prevMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      const share = users.length > 0 ? prevMonthTotal / users.length : 0;
      const prevMonthDebts: Debt[] = [];
      if (users.length >= 2 && adminId) {
        users.forEach(u => {
          if (u.id === adminId) return;
          const spent = prevMonthExpenses.filter(e => e.paidBy === u.id).reduce((acc, e) => acc + e.amount, 0);
          const paidToAdmin = prevMonthPayments
            .filter(p => p.from === u.id && p.to === adminId)
            .reduce((acc, p) => acc + p.amount, 0);
          const receivedFromAdmin = prevMonthPayments
            .filter(p => p.from === adminId && p.to === u.id)
            .reduce((acc, p) => acc + p.amount, 0);
          const effectiveSpent = spent + paidToAdmin - receivedFromAdmin;
          const due = share - effectiveSpent;
          if (Math.abs(due) < 0.01) return;
          if (due > 0) prevMonthDebts.push({ from: u.id, to: adminId, amount: due });
          else prevMonthDebts.push({ from: adminId, to: u.id, amount: Math.abs(due) });
        });

        // Admin self settlement entry (required to allow archiving).
        const adminSpent = prevMonthExpenses.filter(e => e.paidBy === adminId).reduce((acc, e) => acc + e.amount, 0);
        const adminSelfPaid = prevMonthPayments
          .filter(p => p.from === adminId && p.to === adminId)
          .reduce((acc, p) => acc + p.amount, 0);
        const adminDue = share - (adminSpent + adminSelfPaid);
        if (adminDue > 0.01) {
          prevMonthDebts.push({ from: adminId, to: adminId, amount: adminDue });
        }
      }

      // If there are unsettled settlements for previous month, do NOT archive.
      if (prevMonthDebts.length > 0) {
        setPendingArchiveMonth(previousMonthKey);
        alert('New month started. Please settle all pending settlements first. Archiving will happen automatically once everything is settled.');
        return;
      }

      archiveMonth(previousMonthKey);
    }
  }, [archiveMonth, expenses, settlementPayments, users, adminId]);

  // If archiving was blocked due to unsettled debts, auto-archive immediately once settled.
  useEffect(() => {
    if (!pendingArchiveMonth) return;
    const pendingExpenses = expenses.filter(e => monthKeyFor(new Date(e.date)) === pendingArchiveMonth);
    if (pendingExpenses.length === 0) {
      setPendingArchiveMonth('');
      return;
    }

    // Recompute debts for pending month only.
    const pendingPayments = settlementPayments.filter(p => monthKeyFor(new Date(p.date)) === pendingArchiveMonth);
    const pendingTotal = pendingExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const share = users.length > 0 ? pendingTotal / users.length : 0;
    const pendingDebts: Debt[] = [];
    if (users.length >= 2 && adminId) {
      users.forEach(u => {
        if (u.id === adminId) return;
        const spent = pendingExpenses.filter(e => e.paidBy === u.id).reduce((acc, e) => acc + e.amount, 0);
        const paidToAdmin = pendingPayments
          .filter(p => p.from === u.id && p.to === adminId)
          .reduce((acc, p) => acc + p.amount, 0);
        const receivedFromAdmin = pendingPayments
          .filter(p => p.from === adminId && p.to === u.id)
          .reduce((acc, p) => acc + p.amount, 0);
        const effectiveSpent = spent + paidToAdmin - receivedFromAdmin;
        const due = share - effectiveSpent;
        if (Math.abs(due) < 0.01) return;
        if (due > 0) pendingDebts.push({ from: u.id, to: adminId, amount: due });
        else pendingDebts.push({ from: adminId, to: u.id, amount: Math.abs(due) });
      });

      // Admin self settlement entry (required to allow archiving).
      const adminSpent = pendingExpenses.filter(e => e.paidBy === adminId).reduce((acc, e) => acc + e.amount, 0);
      const adminDue = share - adminSpent;
      if (adminDue > 0.01) {
        pendingDebts.push({ from: adminId, to: adminId, amount: adminDue });
      }
    }

    if (pendingDebts.length === 0) {
      archiveMonth(pendingArchiveMonth);
    }
  }, [pendingArchiveMonth, expenses, settlementPayments, users, adminId, archiveMonth]);

  const handleAddExpense = () => {
    // Business rule: if previous month is pending archive due to unsettled settlements,
    // we must block *any* new entries until user settles up.
    if (pendingArchiveMonth) {
      alert('Settle previous month settlements first');
      return;
    }
    if (!newTitle || !newAmount) return;
    const now = getNow();
    const parsedAmount = parseFloat(newAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    // If we're editing an existing expense, update it in-place.
    if (editingExpenseId) {
      setExpenses(prev => prev.map(e => (e.id === editingExpenseId ? {
        ...e,
        title: newTitle,
        amount: parsedAmount,
        paidBy,
        category: newCategory
      } : e)));
      setEditingExpenseId('');
    } else {
      const expense: Expense = {
        id: Date.now().toString(),
        title: newTitle,
        amount: parsedAmount,
        // IMPORTANT: use getNow() so Developer date override works reliably.
        date: now.toISOString(),
        paidBy: paidBy,
        splitWith: users.map(u => u.id),
        category: newCategory
      };
      setExpenses(prev => [expense, ...prev]);
    }
    setShowAddModal(false);
    setNewTitle('');
    setNewAmount('');
  };

  const startEditExpense = (expense: Expense) => {
    // If archive is pending, editing should also be blocked to keep logic consistent.
    if (pendingArchiveMonth) {
      alert('Settle previous month settlements first');
      return;
    }
    setEditingExpenseId(expense.id);
    setNewTitle(expense.title);
    setNewAmount(String(expense.amount));
    setNewCategory(expense.category);
    setPaidBy(expense.paidBy);
    setShowAddModal(true);
  };

  const addRoommate = () => {
    const name = roommateName.trim();
    if (!name) return;
    const newUser: User = {
      id: Date.now().toString(),
      name: name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    setRoommateName('');
  };

  const deleteHistoryMonth = (month: string) => {
    if (!window.confirm(`Delete archived month ${month}?`)) return;
    setHistory(prev => prev.filter(h => h.month !== month));
  };

  const deleteExpense = (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const settleDebt = (from: string, to: string, amount: number) => {
    if (amount <= 0) return;
    if (!window.confirm('Confirm settlement payment recorded as paid?')) return;
    const payment: SettlementPayment = {
      id: Date.now().toString(),
      from,
      to,
      amount,
      // IMPORTANT: use getNow() so Developer date override works reliably.
      date: getNow().toISOString()
    };
    setSettlementPayments(prev => [payment, ...prev]);
  };

  const undoSettlementPayment = (paymentId: string) => {
    const target = settlementPayments.find(p => p.id === paymentId);
    if (!target) return;
    if (!window.confirm('Undo this recorded payment? This will restore the settlement as unpaid.')) return;
    setSettlementPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  // REFACTORED: Atomic removal of user and associated data


  const removeRoommate = (id: string) => {
    // Use functional state updates to avoid stale closures (fixes delete button issues).
    setUsers(prevUsers => {
      if (prevUsers.length <= 1) {
        alert("At least one roommate is required.");
        return prevUsers;
      }

      if (!window.confirm("Delete this roommate? This will remove all their expenses and recalculate totals.")) {
        return prevUsers;
      }

      const nextUsers = prevUsers.filter(u => u.id !== id);

      // If admin removed, assign first remaining user as admin
      setAdminId(prev => (prev === id ? (nextUsers[0]?.id || '') : prev));

      // remove expenses paid by the deleted roommate
      setExpenses(prevExpenses => prevExpenses.filter(e => e.paidBy !== id));

      // update paidBy if needed
      setPaidBy(prevPaidBy => {
        if (prevPaidBy === id) {
          return nextUsers[0]?.id || prevPaidBy;
        }
        return prevPaidBy;
      });

      return nextUsers;
    });
  };


  const NavigationItem = ({ id, icon, label }: { id: typeof activeTab, icon: string, label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );

  const dashboardDateLabel = useMemo(() => {
    const now = getNow();
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    }).format(now);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">RW</div>
            <h1 className="text-xl font-bold tracking-tight">RoomieWallet</h1>
          </div>
          <nav className="space-y-1">
            <NavigationItem id="expenses" icon="💳" label="Dashboard" />
            <NavigationItem id="stats" icon="📊" label="Analytics" />
            <NavigationItem id="settle" icon="🤝" label="Settlements" />
            <NavigationItem id="history" icon="📜" label="History" />
            <NavigationItem id="roommates" icon="👥" label="Roommates" />
          </nav>

          <div className="mt-auto pt-6">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Developed by Muhammad Jaffar Abbas
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white border-b border-slate-100 lg:px-10">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-2xl">☰</button>
          {/* Mobile header fix: show MFC header + date on small screens too */}
          <div className="block">
            <h2 className="text-lg lg:text-xl font-bold capitalize text-slate-800">
              {activeTab === 'expenses' ? 'MFC Room mates' : activeTab}
            </h2>
            <div className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
              {dashboardDateLabel}
            </div>
            <div className="hidden lg:block text-[10px] font-bold text-slate-300 mt-0.5">
              Developed by Muhammad Jaffar Abbas
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600">
              {CURRENCY_CODE}
            </div>
            <button onClick={handleArchiveClick} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">Archive</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 no-scrollbar">
          {activeTab === 'expenses' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl md:col-span-2">
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Total Group Spend</p>
                  <h2 className="text-4xl font-black mb-6">{CURRENCY_SYMBOL} {stats.total.toFixed(2)}</h2>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-indigo-200 text-[10px] font-bold uppercase mb-1">Share / Person</p>
                      <p className="text-xl font-bold">{CURRENCY_SYMBOL} {stats.perPerson.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (pendingArchiveMonth) {
                          alert('Settle previous month settlements first');
                          return;
                        }
                        setEditingExpenseId('');
                        setNewTitle('');
                        setNewAmount('');
                        setNewCategory(Category.OTHER);
                        setShowAddModal(true);
                      }}
                      disabled={!!pendingArchiveMonth}
                      className={`bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg ${pendingArchiveMonth ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 text-center">Your Balance</p>
                  <div className="text-center">
                    <h3 className={`text-2xl font-black ${stats.userStats[0]?.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stats.userStats[0]?.balance >= 0 ? '+' : ''}{CURRENCY_SYMBOL} {stats.userStats[0]?.balance.toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      {stats.userStats[0]?.balance >= 0 ? 'Surplus' : 'Owed'}
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50" />
                </div>
              </div>

              <section className="bg-white rounded-[2rem] border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Live Ledger</h3>
                <div className="space-y-4">
                  {stats.userStats.map(u => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-100" alt="" />
                        <span className="text-sm font-bold text-slate-700">{u.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">{CURRENCY_SYMBOL} {u.paid.toFixed(2)} paid</p>
                        <p className={`text-[10px] font-bold ${u.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {u.balance >= 0 ? 'Credit' : 'Debt'}: {CURRENCY_SYMBOL} {Math.abs(u.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Activity</h3>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-500">Filter by date</div>
                  <select
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="recent">Most recent</option>
                    <option value="all">All</option>
                    {activityDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {expenses.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <p className="text-slate-400 text-sm">No recent transactions.</p>
                  </div>
                ) : (
                  filteredExpenses.map(exp => (
                    <ExpenseCard
                      key={exp.id}
                      expense={exp}
                      users={users}
                      onEdit={startEditExpense}
                      onDelete={deleteExpense}
                    />
                  ))
                )}
              </section>
            </div>
          )}

          {activeTab === 'roommates' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Manage Roommates</h3>

                <div className="mb-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin (collector)</label>
                  <div className="mt-2 flex items-center gap-3">
                    <select
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Collects & pays</div>
                  </div>
                </div>
                {/* Mobile layout fix: prevent Add button from overflowing the card */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    className="flex-1 bg-slate-50 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="Enter name..." 
                    value={roommateName} 
                    onChange={(e) => setRoommateName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRoommate()}
                  />
                  <button
                    onClick={addRoommate}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-4 sm:py-0 rounded-2xl font-bold active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-slate-50" alt="" />
                      <p className="font-bold text-slate-800">{u.name}</p>
                    </div>
                    {users.length > 1 && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeRoommate(u.id);
                        }} 
                        className="w-12 h-12 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all cursor-pointer pointer-events-auto"
                        aria-label="Delete Roommate"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-xl font-bold text-slate-800">History</h3>
              {history.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400">
                  History is empty.
                </div>
              ) : (
                history.map(item => (
                  <div key={item.month} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold">{item.month}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Archived</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-indigo-600">{CURRENCY_SYMBOL} {item.totalSpend.toFixed(2)}</p>
                      <button
                        onClick={() => deleteHistoryMonth(item.month)}
                        className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all"
                        aria-label="Delete history month"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-slate-800">Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Spend</p>
                  <p className="text-2xl font-black mt-2 text-slate-800">{CURRENCY_SYMBOL} {stats.total.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg / Person</p>
                  <p className="text-2xl font-black mt-2 text-slate-800">{CURRENCY_SYMBOL} {stats.perPerson.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Transactions</p>
                  <p className="text-2xl font-black mt-2 text-slate-800">{expenses.length}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">By Category</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.values(Category).map(cat => ({
                          name: cat,
                          value: expenses.filter(e => e.category === cat).reduce((a, c) => a + c.amount, 0)
                        })).filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {Object.values(Category).map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${CURRENCY_SYMBOL} ${Number(v).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Top Spenders</p>
                <div className="space-y-3">
                  {stats.userStats
                    .slice()
                    .sort((a, b) => b.paid - a.paid)
                    .map(u => (
                      <div key={u.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-50" alt="" />
                          <span className="font-bold text-sm text-slate-700">{u.name}</span>
                        </div>
                        <span className="font-black text-sm text-slate-800">{CURRENCY_SYMBOL} {u.paid.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settle' && (
            <div className="max-w-2xl mx-auto">
              {/* Calculations */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-6">
                <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Month-End Calculations</p>
                {users.length === 0 ? (
                  <p className="text-slate-500 text-sm">Add roommates first.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase">Total amount</div>
                        <div className="text-xl font-black text-slate-800">{CURRENCY_SYMBOL} {stats.total.toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase">Share / person</div>
                        <div className="text-xl font-black text-slate-800">{CURRENCY_SYMBOL} {stats.perPerson.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-500">Admin (collector): <span className="text-slate-800">{users.find(u => u.id === adminId)?.name || 'Not set'}</span></div>

                    <div className="mt-2 space-y-3">
                      {users.map(u => {
                        const spent = expenses.filter(e => e.paidBy === u.id).reduce((acc, e) => acc + e.amount, 0);
                        const paidToAdmin = settlementPayments
                          .filter(p => p.from === u.id && p.to === adminId)
                          .reduce((acc, p) => acc + p.amount, 0);
                        const receivedFromAdmin = settlementPayments
                          .filter(p => p.from === adminId && p.to === u.id)
                          .reduce((acc, p) => acc + p.amount, 0);
                        const isAdmin = u.id === adminId;
                        const adminSelfPaid = isAdmin
                          ? settlementPayments
                              .filter(p => p.from === adminId && p.to === adminId)
                              .reduce((acc, p) => acc + p.amount, 0)
                          : 0;
                        const effectiveSpent = spent + paidToAdmin - receivedFromAdmin + adminSelfPaid;
                        const due = stats.perPerson - effectiveSpent;
                        return (
                          <div key={u.id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar} className="w-9 h-9 rounded-xl" alt="" />
                              <div>
                                <div className="text-sm font-black text-slate-800">{u.name} {isAdmin ? <span className="text-[10px] font-black text-indigo-600">(ADMIN)</span> : null}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Spent this month: {CURRENCY_SYMBOL} {spent.toFixed(2)}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black text-slate-400 uppercase">Remaining</div>
                              <div className={`text-sm font-black ${Math.abs(due) < 0.01 ? 'text-slate-600' : due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {Math.abs(due) < 0.01 ? '0.00' : `${due > 0 ? '' : '+'}${CURRENCY_SYMBOL} ${Math.abs(due).toFixed(2)}`}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">
                                {Math.abs(due) < 0.01 ? 'Settled' : due > 0 ? 'To pay admin' : 'To receive'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <SettlementView debts={debts} users={users} onSettle={settleDebt} />

              {settlementPayments.length > 0 && (
                <div className="mt-6 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                  <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Recorded Payments</p>
                  <div className="space-y-3">
                    {settlementPayments.slice(0, 15).map(p => {
                      const from = users.find(u => u.id === p.from)?.name || 'User';
                      const to = users.find(u => u.id === p.to)?.name || 'User';
                      return (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <div className="text-slate-600 font-semibold">{from} → {to}</div>
                          <div className="flex items-center gap-3">
                            <div className="font-black text-slate-800">{CURRENCY_SYMBOL} {p.amount.toFixed(2)}</div>
                            <button
                              onClick={() => undoSettlementPayment(p.id)}
                              className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl"
                            >
                              Undo
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">{editingExpenseId ? 'Edit Item' : 'Add Item'}</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingExpenseId('');
                }}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount & Title</label>
                <div className="flex gap-3">
                  <input className="flex-1 bg-slate-50 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Label" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">{CURRENCY_SYMBOL}</span>
                    <input className="w-24 bg-slate-50 border-none rounded-2xl p-4 pl-7 outline-none font-bold" placeholder="0" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid By</label>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {users.map(u => (
                    <button key={u.id} onClick={() => setPaidBy(u.id)} className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${paidBy === u.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50'}`}>
                      <img src={u.avatar} className="w-10 h-10 rounded-xl" alt="" />
                      <span className="text-[10px] font-bold text-slate-600">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <div className="grid grid-cols-3 gap-3">
                  {[Category.GROCERIES, Category.UTILITIES, Category.ENTERTAINMENT, Category.RENT, Category.OTHER].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-3 py-3 rounded-2xl text-xs font-bold border-2 transition-all ${newCategory === cat ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddExpense} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-xl">
                {editingExpenseId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
