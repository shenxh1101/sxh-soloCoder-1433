import { create } from 'zustand';
import type { Member } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';
import { mockMembers } from '@/data/mockData';

interface MemberState {
  members: Member[];
  loadMembers: () => void;
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'totalConsumption' | 'totalRecharge' | 'visitCount'>) => Member;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMember: (id: string) => Member | undefined;
  searchMembers: (keyword: string) => Member[];
  updateBalance: (id: string, amount: number) => void;
  updatePoints: (id: string, points: number) => void;
  incrementVisit: (id: string) => void;
  addConsumption: (id: string, amount: number) => void;
  addRecharge: (id: string, amount: number) => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],

  loadMembers: () => {
    const saved = storage.getMembers<Member[] | null>(null);
    if (saved && saved.length > 0) {
      set({ members: saved });
    } else {
      set({ members: mockMembers });
      storage.setMembers(mockMembers);
    }
  },

  addMember: (memberData) => {
    const now = new Date().toISOString();
    const newMember: Member = {
      ...memberData,
      id: generateId(),
      totalConsumption: 0,
      totalRecharge: 0,
      visitCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const members = [...get().members, newMember];
    set({ members });
    storage.setMembers(members);
    return newMember;
  },

  updateMember: (id, memberData) => {
    const members = get().members.map(m =>
      m.id === id ? { ...m, ...memberData, updatedAt: new Date().toISOString() } : m
    );
    set({ members });
    storage.setMembers(members);
  },

  deleteMember: (id) => {
    const members = get().members.filter(m => m.id !== id);
    set({ members });
    storage.setMembers(members);
  },

  getMember: (id) => {
    return get().members.find(m => m.id === id);
  },

  searchMembers: (keyword) => {
    if (!keyword.trim()) return get().members;
    const lower = keyword.toLowerCase();
    return get().members.filter(
      m => m.name.toLowerCase().includes(lower) || m.phone.includes(keyword)
    );
  },

  updateBalance: (id, amount) => {
    const members = get().members.map(m =>
      m.id === id
        ? { ...m, balance: Math.max(0, m.balance + amount), updatedAt: new Date().toISOString() }
        : m
    );
    set({ members });
    storage.setMembers(members);
  },

  updatePoints: (id, points) => {
    const members = get().members.map(m =>
      m.id === id
        ? { ...m, points: Math.max(0, m.points + points), updatedAt: new Date().toISOString() }
        : m
    );
    set({ members });
    storage.setMembers(members);
  },

  incrementVisit: (id) => {
    const members = get().members.map(m =>
      m.id === id
        ? { ...m, visitCount: m.visitCount + 1, updatedAt: new Date().toISOString() }
        : m
    );
    set({ members });
    storage.setMembers(members);
  },

  addConsumption: (id, amount) => {
    const members = get().members.map(m =>
      m.id === id
        ? { ...m, totalConsumption: m.totalConsumption + amount, updatedAt: new Date().toISOString() }
        : m
    );
    set({ members });
    storage.setMembers(members);
  },

  addRecharge: (id, amount) => {
    const members = get().members.map(m =>
      m.id === id
        ? { ...m, totalRecharge: m.totalRecharge + amount, updatedAt: new Date().toISOString() }
        : m
    );
    set({ members });
    storage.setMembers(members);
  },
}));
