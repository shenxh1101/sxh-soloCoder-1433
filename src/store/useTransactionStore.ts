import { create } from 'zustand';
import type { Transaction, Recharge, PointRecord, TransactionItem } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';
import { useMemberStore } from './useMemberStore';
import { useSettingsStore } from './useSettingsStore';

interface TransactionState {
  transactions: Transaction[];
  recharges: Recharge[];
  pointRecords: PointRecord[];
  
  loadData: () => void;
  
  createTransaction: (
    memberId: string,
    items: TransactionItem[],
    balanceUsed: number,
    pointsUsed: number,
    notes?: string
  ) => Transaction;
  
  createRecharge: (
    memberId: string,
    amount: number,
    bonusPoints: number,
    notes?: string
  ) => Recharge;
  
  addPointRecord: (
    memberId: string,
    change: number,
    type: PointRecord['type'],
    reason: string
  ) => PointRecord;
  
  getMemberTransactions: (memberId: string) => Transaction[];
  getMemberRecharges: (memberId: string) => Recharge[];
  getMemberPointRecords: (memberId: string) => PointRecord[];
  
  getTodayTransactions: () => Transaction[];
  getTodayRecharges: () => Recharge[];
  
  getMonthTransactions: (year: number, month: number) => Transaction[];
  getMonthRecharges: (year: number, month: number) => Recharge[];
  getMonthPointRecords: (year: number, month: number) => PointRecord[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  recharges: [],
  pointRecords: [],

  loadData: () => {
    const transactions = storage.getTransactions<Transaction[]>([]);
    const recharges = storage.getRecharges<Recharge[]>([]);
    const pointRecords = storage.getPointRecords<PointRecord[]>([]);
    set({ transactions, recharges, pointRecords });
  },

  createTransaction: (memberId, items, balanceUsed, pointsUsed, notes = '') => {
    const memberStore = useMemberStore.getState();
    const settingsStore = useSettingsStore.getState();
    const member = memberStore.getMember(memberId);
    if (!member) throw new Error('会员不存在');

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const pointsEarned = Math.floor(balanceUsed * settingsStore.settings.pointsPerYuan);

    const transaction: Transaction = {
      id: generateId(),
      memberId,
      memberName: member.name,
      totalAmount,
      balanceUsed,
      pointsUsed,
      pointsEarned,
      items,
      createdAt: new Date().toISOString(),
      notes,
    };

    memberStore.updateBalance(memberId, -balanceUsed);
    memberStore.updatePoints(memberId, pointsEarned - pointsUsed);
    memberStore.incrementVisit(memberId);
    memberStore.addConsumption(memberId, balanceUsed);

    const transactions = [...get().transactions, transaction];
    set({ transactions });
    storage.setTransactions(transactions);

    if (pointsEarned > 0) {
      get().addPointRecord(memberId, pointsEarned, 'earn', `消费${balanceUsed}元获得积分`);
    }
    if (pointsUsed > 0) {
      get().addPointRecord(memberId, -pointsUsed, 'spend', `消费抵扣${pointsUsed}积分`);
    }

    return transaction;
  },

  createRecharge: (memberId, amount, bonusPoints, notes = '') => {
    const memberStore = useMemberStore.getState();
    const member = memberStore.getMember(memberId);
    if (!member) throw new Error('会员不存在');

    const recharge: Recharge = {
      id: generateId(),
      memberId,
      memberName: member.name,
      amount,
      bonusPoints,
      createdAt: new Date().toISOString(),
      notes,
    };

    memberStore.updateBalance(memberId, amount);
    memberStore.updatePoints(memberId, bonusPoints);
    memberStore.addRecharge(memberId, amount);

    const recharges = [...get().recharges, recharge];
    set({ recharges });
    storage.setRecharges(recharges);

    if (bonusPoints > 0) {
      get().addPointRecord(memberId, bonusPoints, 'recharge', `充值${amount}元赠送积分`);
    }

    return recharge;
  },

  addPointRecord: (memberId, change, type, reason) => {
    const memberStore = useMemberStore.getState();
    const member = memberStore.getMember(memberId);
    if (!member) throw new Error('会员不存在');

    const record: PointRecord = {
      id: generateId(),
      memberId,
      memberName: member.name,
      change,
      type,
      reason,
      createdAt: new Date().toISOString(),
    };

    const pointRecords = [...get().pointRecords, record];
    set({ pointRecords });
    storage.setPointRecords(pointRecords);

    memberStore.updatePoints(memberId, change);

    return record;
  },

  getMemberTransactions: (memberId) => {
    return get().transactions
      .filter(t => t.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getMemberRecharges: (memberId) => {
    return get().recharges
      .filter(r => r.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getMemberPointRecords: (memberId) => {
    return get().pointRecords
      .filter(r => r.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getTodayTransactions: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return get().transactions.filter(t => new Date(t.createdAt) >= today);
  },

  getTodayRecharges: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return get().recharges.filter(r => new Date(r.createdAt) >= today);
  },

  getMonthTransactions: (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return get().transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d >= start && d <= end;
    });
  },

  getMonthRecharges: (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return get().recharges.filter(r => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });
  },

  getMonthPointRecords: (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return get().pointRecords.filter(r => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });
  },
}));
