import { create } from 'zustand';
import type { Settings, ServiceItem, RechargeRule } from '@/types';
import { storage } from '@/utils/storage';
import { defaultSettings } from '@/data/mockData';

interface SettingsState {
  settings: Settings;
  loadSettings: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addService: (service: ServiceItem) => void;
  updateService: (id: string, service: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  addRechargeRule: (rule: RechargeRule) => void;
  updateRechargeRule: (index: number, rule: RechargeRule) => void;
  deleteRechargeRule: (index: number) => void;
  calculateBonusPoints: (amount: number) => number;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  loadSettings: () => {
    const saved = storage.getSettings<Settings | null>(null);
    if (saved) {
      set({ settings: saved });
    } else {
      set({ settings: defaultSettings });
      storage.setSettings(defaultSettings);
    }
  },

  updateSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  addService: (service) => {
    const settings = get().settings;
    const updated = {
      ...settings,
      services: [...settings.services, service],
    };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  updateService: (id, service) => {
    const settings = get().settings;
    const updated = {
      ...settings,
      services: settings.services.map(s => 
        s.id === id ? { ...s, ...service } : s
      ),
    };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  deleteService: (id) => {
    const settings = get().settings;
    const updated = {
      ...settings,
      services: settings.services.filter(s => s.id !== id),
    };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  addRechargeRule: (rule) => {
    const settings = get().settings;
    const updatedRules = [...settings.rechargeRules, rule]
      .sort((a, b) => a.amount - b.amount);
    const updated = { ...settings, rechargeRules: updatedRules };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  updateRechargeRule: (index, rule) => {
    const settings = get().settings;
    const newRules = [...settings.rechargeRules];
    newRules[index] = rule;
    const updatedRules = newRules.sort((a, b) => a.amount - b.amount);
    const updated = { ...settings, rechargeRules: updatedRules };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  deleteRechargeRule: (index) => {
    const settings = get().settings;
    const updated = {
      ...settings,
      rechargeRules: settings.rechargeRules.filter((_, i) => i !== index),
    };
    set({ settings: updated });
    storage.setSettings(updated);
  },

  calculateBonusPoints: (amount) => {
    const rules = get().settings.rechargeRules;
    let bonus = 0;
    for (const rule of rules) {
      if (amount >= rule.amount) {
        bonus = rule.bonusPoints;
      }
    }
    return bonus;
  },
}));
