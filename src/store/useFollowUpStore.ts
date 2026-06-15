import { create } from 'zustand';
import type { FollowUpRecord } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';

interface FollowUpState {
  records: FollowUpRecord[];
  
  loadRecords: () => void;
  
  addRecord: (
    memberId: string,
    memberName: string,
    type: FollowUpRecord['type'],
    content: string,
    result: string,
    nextFollowUpAt?: string | null,
    operator?: string
  ) => FollowUpRecord;
  
  updateRecord: (id: string, data: Partial<FollowUpRecord>) => void;
  
  deleteRecord: (id: string) => void;
  
  getRecordsByMember: (memberId: string) => FollowUpRecord[];
  
  getMonthRecords: (year: number, month: number) => FollowUpRecord[];
  
  getPendingFollowUps: () => FollowUpRecord[];
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  records: [],

  loadRecords: () => {
    const records = storage.getFollowUps<FollowUpRecord[]>([]);
    set({ records });
  },

  addRecord: (memberId, memberName, type, content, result, nextFollowUpAt = null, operator = '店长') => {
    const record: FollowUpRecord = {
      id: generateId(),
      memberId,
      memberName,
      type,
      content,
      result,
      nextFollowUpAt,
      createdAt: new Date().toISOString(),
      operator,
    };

    const records = [...get().records, record];
    set({ records });
    storage.setFollowUps(records);
    return record;
  },

  updateRecord: (id, data) => {
    const records = get().records.map(r =>
      r.id === id ? { ...r, ...data } : r
    );
    set({ records });
    storage.setFollowUps(records);
  },

  deleteRecord: (id) => {
    const records = get().records.filter(r => r.id !== id);
    set({ records });
    storage.setFollowUps(records);
  },

  getRecordsByMember: (memberId) => {
    return get().records
      .filter(r => r.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getMonthRecords: (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return get().records.filter(r => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });
  },

  getPendingFollowUps: () => {
    const now = new Date();
    return get().records
      .filter(r => r.nextFollowUpAt && new Date(r.nextFollowUpAt) <= now)
      .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
  },
}));
