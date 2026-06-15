import { create } from 'zustand';
import type { FollowUpRecord } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';
import { useTransactionStore } from './useTransactionStore';

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
    operator?: string,
    assignee?: string,
    hasAppointment?: boolean,
    appointmentDate?: string | null
  ) => FollowUpRecord;
  
  updateRecord: (id: string, data: Partial<FollowUpRecord>) => void;
  
  completeRecord: (id: string, result?: string, hasAppointment?: boolean, appointmentDate?: string | null) => void;
  
  confirmRevisit: (id: string) => void;
  
  deleteRecord: (id: string) => void;
  
  getRecordsByMember: (memberId: string) => FollowUpRecord[];
  
  getMonthRecords: (year: number, month: number) => FollowUpRecord[];
  
  getCompletedMonthRecords: (year: number, month: number) => FollowUpRecord[];
  
  getPendingFollowUps: () => FollowUpRecord[];
  
  getTodayFollowUps: () => FollowUpRecord[];
  
  getOverdueFollowUps: () => FollowUpRecord[];
  
  getOverdueDays: (record: FollowUpRecord) => number;
  
  hasRevisitedAfterFollowUp: (followUpId: string) => { revisited: boolean; visitDate?: string };
  
  getMonthEffectiveness: (year: number, month: number) => {
    total: number;
    completed: number;
    revisitedCount: number;
    rechargeCount: number;
    appointmentCount: number;
    revisitedMemberIds: string[];
  };
  
  getAssigneeMonthStats: (year: number, month: number) => {
    assignee: string;
    total: number;
    completed: number;
    revisitedCount: number;
    rechargeCount: number;
    appointmentCount: number;
  }[];
}

const upgradeRecord = (r: any): FollowUpRecord => ({
  ...r,
  status: r.status || 'pending',
  completedAt: r.completedAt || null,
  assignee: r.assignee || r.operator || '店长',
  hasAppointment: r.hasAppointment || false,
  appointmentDate: r.appointmentDate || null,
  revisitConfirmedAt: r.revisitConfirmedAt || null,
});

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  records: [],

  loadRecords: () => {
    const raw = storage.getFollowUps<any[]>([]);
    const records = raw.map(upgradeRecord);
    set({ records });
  },

  addRecord: (memberId, memberName, type, content, result, nextFollowUpAt = null, operator = '店长', assignee = '店长', hasAppointment = false, appointmentDate = null) => {
    const now = new Date().toISOString();
    const record: FollowUpRecord = {
      id: generateId(),
      memberId,
      memberName,
      type,
      content,
      result,
      nextFollowUpAt,
      createdAt: now,
      operator,
      status: nextFollowUpAt ? 'pending' : 'done',
      completedAt: nextFollowUpAt ? null : now,
      assignee: assignee || operator,
      hasAppointment,
      appointmentDate,
      revisitConfirmedAt: null,
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

  completeRecord: (id, result, hasAppointment, appointmentDate) => {
    const now = new Date().toISOString();
    const records = get().records.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'done' as const,
        completedAt: now,
        result: result ?? r.result,
        hasAppointment: hasAppointment ?? r.hasAppointment,
        appointmentDate: appointmentDate ?? r.appointmentDate,
      };
    });
    set({ records });
    storage.setFollowUps(records);
  },

  confirmRevisit: (id) => {
    const records = get().records.map(r => {
      if (r.id !== id) return r;
      return { ...r, revisitConfirmedAt: new Date().toISOString() };
    });
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

  getCompletedMonthRecords: (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return get().records.filter(r => {
      if (r.status !== 'done' || !r.completedAt) return false;
      const d = new Date(r.completedAt);
      return d >= start && d <= end;
    });
  },

  getPendingFollowUps: () => {
    return get().records
      .filter(r => r.status === 'pending' && r.nextFollowUpAt)
      .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
  },

  getTodayFollowUps: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return get().records
      .filter(r => {
        if (r.status !== 'pending' || !r.nextFollowUpAt) return false;
        const d = new Date(r.nextFollowUpAt);
        return d >= today && d < tomorrow;
      })
      .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
  },

  getOverdueFollowUps: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return get().records
      .filter(r => {
        if (r.status !== 'pending' || !r.nextFollowUpAt) return false;
        return new Date(r.nextFollowUpAt) < today;
      })
      .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
  },

  getOverdueDays: (record) => {
    if (!record.nextFollowUpAt || record.status === 'done') return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(record.nextFollowUpAt);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },

  hasRevisitedAfterFollowUp: (followUpId) => {
    const record = get().records.find(r => r.id === followUpId);
    if (!record) return { revisited: false };
    
    if (record.revisitConfirmedAt) {
      return { revisited: true, visitDate: record.revisitConfirmedAt };
    }
    
    const txState = useTransactionStore.getState();
    const txns = txState.getMemberTransactions(record.memberId);
    const followUpTime = record.completedAt 
      ? new Date(record.completedAt).getTime() 
      : new Date(record.createdAt).getTime();
    const revisit = txns.find(t => new Date(t.createdAt).getTime() >= followUpTime);
    
    if (revisit) {
      return { revisited: true, visitDate: revisit.createdAt };
    }
    return { revisited: false };
  },

  getMonthEffectiveness: (year, month) => {
    const completed = get().getCompletedMonthRecords(year, month);
    const txState = useTransactionStore.getState();

    const end = new Date(year, month, 0, 23, 59, 59);
    const endTime = end.getTime();
    
    const revisitedMemberIds: string[] = [];
    const rechargeMemberIds: string[] = [];

    completed.forEach(r => {
      const followUpTime = r.completedAt 
        ? new Date(r.completedAt).getTime() 
        : new Date(r.createdAt).getTime();

      const txns = txState.getMemberTransactions(r.memberId);
      const revisit = txns.find(t => {
        const tTime = new Date(t.createdAt).getTime();
        return tTime >= followUpTime && tTime <= endTime;
      });
      if (revisit && !revisitedMemberIds.includes(r.memberId)) {
        revisitedMemberIds.push(r.memberId);
      }

      const recharges = txState.getMemberRecharges(r.memberId);
      const recharge = recharges.find(rc => {
        const rTime = new Date(rc.createdAt).getTime();
        return rTime >= followUpTime && rTime <= endTime;
      });
      if (recharge && !rechargeMemberIds.includes(r.memberId)) {
        rechargeMemberIds.push(r.memberId);
      }
    });

    return {
      total: get().getCompletedMonthRecords(year, month).length,
      completed: completed.length,
      revisitedCount: revisitedMemberIds.length,
      rechargeCount: rechargeMemberIds.length,
      appointmentCount: completed.filter(r => r.hasAppointment).length,
      revisitedMemberIds,
    };
  },

  getAssigneeMonthStats: (year, month) => {
    const completed = get().getCompletedMonthRecords(year, month);
    const all = get().getMonthRecords(year, month);
    const txState = useTransactionStore.getState();
    const end = new Date(year, month, 0, 23, 59, 59);
    const endTime = end.getTime();

    const assigneeMap = new Map<string, {
      total: number;
      completed: number;
      revisitedCount: number;
      rechargeCount: number;
      appointmentCount: number;
    }>();

    all.forEach(r => {
      const name = r.assignee || r.operator || '未分配';
      if (!assigneeMap.has(name)) {
        assigneeMap.set(name, { total: 0, completed: 0, revisitedCount: 0, rechargeCount: 0, appointmentCount: 0 });
      }
      const stats = assigneeMap.get(name)!;
      stats.total++;
    });

    completed.forEach(r => {
      const name = r.assignee || r.operator || '未分配';
      const stats = assigneeMap.get(name);
      if (!stats) return;
      stats.completed++;
      if (r.hasAppointment) stats.appointmentCount++;

      const followUpTime = r.completedAt 
        ? new Date(r.completedAt).getTime() 
        : new Date(r.createdAt).getTime();

      const txns = txState.getMemberTransactions(r.memberId);
      const revisit = txns.find(t => {
        const tTime = new Date(t.createdAt).getTime();
        return tTime >= followUpTime && tTime <= endTime;
      });
      if (revisit) stats.revisitedCount++;

      const recharges = txState.getMemberRecharges(r.memberId);
      const recharge = recharges.find(rc => {
        const rTime = new Date(rc.createdAt).getTime();
        return rTime >= followUpTime && rTime <= endTime;
      });
      if (recharge) stats.rechargeCount++;
    });

    return Array.from(assigneeMap.entries()).map(([assignee, stats]) => ({
      assignee,
      ...stats,
    })).sort((a, b) => b.completed - a.completed);
  },
}));
