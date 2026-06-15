import { create } from 'zustand';
import type { BirthdayCareRecord } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';

interface BirthdayCareState {
  records: BirthdayCareRecord[];
  
  loadRecords: () => void;
  
  createRecord: (
    memberId: string,
    memberName: string,
    year: number,
    couponType: string,
    couponValue: string,
    notes?: string
  ) => BirthdayCareRecord;
  
  updateRecord: (
    id: string,
    data: Partial<BirthdayCareRecord>
  ) => void;
  
  updateStatus: (
    id: string,
    status: BirthdayCareRecord['status']
  ) => void;
  
  deleteRecord: (id: string) => void;
  
  getRecordByMemberYear: (
    memberId: string,
    year: number
  ) => BirthdayCareRecord | undefined;
  
  getRecordsByMember: (memberId: string) => BirthdayCareRecord[];
  
  getRecordsByYear: (year: number) => BirthdayCareRecord[];
  
  getPendingRecords: () => BirthdayCareRecord[];
}

export const useBirthdayCareStore = create<BirthdayCareState>((set, get) => ({
  records: [],

  loadRecords: () => {
    const records = storage.getBirthdayCare<BirthdayCareRecord[]>([]);
    set({ records });
  },

  createRecord: (memberId, memberName, year, couponType, couponValue, notes = '') => {
    const existing = get().records.find(
      r => r.memberId === memberId && r.year === year
    );
    if (existing) {
      throw new Error('该会员今年已创建生日关怀记录');
    }

    const record: BirthdayCareRecord = {
      id: generateId(),
      memberId,
      memberName,
      year,
      couponType,
      couponValue,
      status: 'pending',
      sentAt: null,
      usedAt: null,
      notes,
      createdAt: new Date().toISOString(),
    };

    const records = [...get().records, record];
    set({ records });
    storage.setBirthdayCare(records);
    return record;
  },

  updateRecord: (id, data) => {
    const records = get().records.map(r =>
      r.id === id ? { ...r, ...data } : r
    );
    set({ records });
    storage.setBirthdayCare(records);
  },

  updateStatus: (id, status) => {
    const now = new Date().toISOString();
    const records = get().records.map(r => {
      if (r.id !== id) return r;
      const updated: BirthdayCareRecord = { ...r, status };
      if (status === 'sent' && !r.sentAt) {
        updated.sentAt = now;
      }
      if (status === 'used' && !r.usedAt) {
        updated.usedAt = now;
      }
      return updated;
    });
    set({ records });
    storage.setBirthdayCare(records);
  },

  deleteRecord: (id) => {
    const records = get().records.filter(r => r.id !== id);
    set({ records });
    storage.setBirthdayCare(records);
  },

  getRecordByMemberYear: (memberId, year) => {
    return get().records.find(r => r.memberId === memberId && r.year === year);
  },

  getRecordsByMember: (memberId) => {
    return get().records
      .filter(r => r.memberId === memberId)
      .sort((a, b) => b.year - a.year);
  },

  getRecordsByYear: (year) => {
    return get().records.filter(r => r.year === year);
  },

  getPendingRecords: () => {
    return get().records
      .filter(r => r.status === 'pending')
      .sort((a, b) => a.year - b.year);
  },
}));
