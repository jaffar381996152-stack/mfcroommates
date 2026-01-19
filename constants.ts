
import { AppState } from './types';

export const STORAGE_KEY = 'mfc_room_budget_data';

export const INITIAL_STATE: AppState = {
  currentMonth: new Date().toISOString().slice(0, 7),
  roommates: [
    { id: '1', name: 'Admin User', isAdmin: true, isSettled: true }
  ],
  expenses: [],
  advances: {},
  archive: [],
  settings: {
    currency: 'SAR',
    theme: 'light'
  }
};
