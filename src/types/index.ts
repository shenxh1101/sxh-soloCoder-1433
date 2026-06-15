export interface Member {
  id: string;
  name: string;
  phone: string;
  birthday: string | null;
  balance: number;
  points: number;
  totalConsumption: number;
  totalRecharge: number;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: 'shampoo' | 'haircut' | 'perm_dye' | 'other';
  pointsRate: number;
  isActive: boolean;
}

export interface TransactionItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  totalAmount: number;
  balanceUsed: number;
  pointsUsed: number;
  pointsEarned: number;
  items: TransactionItem[];
  createdAt: string;
  notes: string;
}

export interface Recharge {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  bonusPoints: number;
  createdAt: string;
  notes: string;
}

export interface PointRecord {
  id: string;
  memberId: string;
  memberName: string;
  change: number;
  type: 'earn' | 'spend' | 'adjust_add' | 'adjust_sub' | 'birthday' | 'recharge';
  reason: string;
  createdAt: string;
}

export interface BirthdayCareRecord {
  id: string;
  memberId: string;
  memberName: string;
  year: number;
  couponType: string;
  couponValue: string;
  status: 'pending' | 'sent' | 'used';
  sentAt: string | null;
  usedAt: string | null;
  notes: string;
  createdAt: string;
}

export interface FollowUpRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: 'phone' | 'wechat' | 'sms' | 'visit' | 'other';
  content: string;
  result: string;
  nextFollowUpAt: string | null;
  createdAt: string;
  operator: string;
  status: 'pending' | 'done';
  completedAt: string | null;
}

export interface RechargeRule {
  amount: number;
  bonusPoints: number;
}

export interface Settings {
  pointsPerYuan: number;
  pointValue: number;
  birthdayBonusPoints: number;
  rechargeRules: RechargeRule[];
  services: ServiceItem[];
}

export type PageType = 
  | 'dashboard' 
  | 'members' 
  | 'member-detail'
  | 'checkout' 
  | 'recharge' 
  | 'points' 
  | 'birthday' 
  | 'reports' 
  | 'settings';
