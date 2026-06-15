const STORAGE_KEYS = {
  MEMBERS: 'hair_salon_members',
  TRANSACTIONS: 'hair_salon_transactions',
  RECHARGES: 'hair_salon_recharges',
  POINT_RECORDS: 'hair_salon_point_records',
  SETTINGS: 'hair_salon_settings',
} as const;

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export const storage = {
  getMembers: <T>(defaultValue: T) => getFromStorage(STORAGE_KEYS.MEMBERS, defaultValue),
  setMembers: <T>(value: T) => saveToStorage(STORAGE_KEYS.MEMBERS, value),
  
  getTransactions: <T>(defaultValue: T) => getFromStorage(STORAGE_KEYS.TRANSACTIONS, defaultValue),
  setTransactions: <T>(value: T) => saveToStorage(STORAGE_KEYS.TRANSACTIONS, value),
  
  getRecharges: <T>(defaultValue: T) => getFromStorage(STORAGE_KEYS.RECHARGES, defaultValue),
  setRecharges: <T>(value: T) => saveToStorage(STORAGE_KEYS.RECHARGES, value),
  
  getPointRecords: <T>(defaultValue: T) => getFromStorage(STORAGE_KEYS.POINT_RECORDS, defaultValue),
  setPointRecords: <T>(value: T) => saveToStorage(STORAGE_KEYS.POINT_RECORDS, value),
  
  getSettings: <T>(defaultValue: T) => getFromStorage(STORAGE_KEYS.SETTINGS, defaultValue),
  setSettings: <T>(value: T) => saveToStorage(STORAGE_KEYS.SETTINGS, value),
};
