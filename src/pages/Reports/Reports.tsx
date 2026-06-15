import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Wallet, 
  CreditCard, 
  Users, 
  Gift,
  Download,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronLeft,
  ChevronRight,
  PieChart,
  PlusCircle,
  MinusCircle,
  Cake,
  Banknote,
  Activity,
  Heart,
  MessageSquare,
  UserPlus,
  UserCheck,
  Moon,
  Zap,
  Target,
  ArrowRight,
  RefreshCw,
  Star,
  Layers,
  UserCog
} from 'lucide-react';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useBirthdayCareStore } from '@/store/useBirthdayCareStore';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { formatMoney, formatDateTime } from '@/utils/date';
import { exportToCSV } from '@/utils/export';
import type { PointRecord } from '@/types';

export default function Reports() {
  const { members } = useMemberStore();
  const { 
    transactions, 
    recharges, 
    pointRecords,
    getMonthTransactions, 
    getMonthRecharges,
    getMonthPointRecords 
  } = useTransactionStore();
  const { 
    getMonthRecords: getMonthBirthdayCare, 
    getMonthSentRecords, 
    getMonthUsedRecords 
  } = useBirthdayCareStore();
  const { 
    getMonthRecords: getMonthFollowUps, 
    getMonthEffectiveness,
    getCompletedMonthRecords,
    getAssigneeMonthStats
  } = useFollowUpStore();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const monthTransactions = useMemo(
    () => getMonthTransactions(currentYear, currentMonth),
    [currentYear, currentMonth, transactions]
  );

  const monthRecharges = useMemo(
    () => getMonthRecharges(currentYear, currentMonth),
    [currentYear, currentMonth, recharges]
  );

  const monthPointRecords = useMemo(
    () => getMonthPointRecords(currentYear, currentMonth),
    [currentYear, currentMonth, pointRecords]
  );

  const monthBirthdayCare = useMemo(
    () => getMonthBirthdayCare(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthSentBirthdayCare = useMemo(
    () => getMonthSentRecords(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthUsedBirthdayCare = useMemo(
    () => getMonthUsedRecords(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthFollowUps = useMemo(
    () => getMonthFollowUps(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthEffectiveness = useMemo(
    () => getMonthEffectiveness(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const completedMonthFollowUps = useMemo(
    () => getCompletedMonthRecords(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const assigneeMonthStats = useMemo(
    () => getAssigneeMonthStats(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const highValueMembers = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth - 1, 1).getTime();
    const memberHasTxThisMonth = new Set(monthTransactions.map(t => t.memberId));
    const memberHadTxBeforeMonth = new Set<string>();
    transactions.forEach(t => {
      if (new Date(t.createdAt).getTime() < monthStart) {
        memberHadTxBeforeMonth.add(t.memberId);
      }
    });
    return members.filter(m =>
      m.totalRecharge >= 500 &&
      memberHasTxThisMonth.has(m.id) &&
      memberHadTxBeforeMonth.has(m.id)
    );
  }, [members, monthTransactions, transactions, currentYear, currentMonth]);

  const silentMembers = useMemo(() => {
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    const memberLastVisit: Record<string, number> = {};
    transactions.forEach(t => {
      const d = new Date(t.createdAt).getTime();
      if (!memberLastVisit[t.memberId] || d > memberLastVisit[t.memberId]) {
        memberLastVisit[t.memberId] = d;
      }
    });
    return members.filter(m => {
      const lastVisit = memberLastVisit[m.id];
      return lastVisit && lastVisit < sixtyDaysAgo;
    });
  }, [members, transactions]);

  const rechargedNoRepurchaseMembers = useMemo(() => {
    const rechargedIds = new Set(monthRecharges.map(r => r.memberId));
    const consumedIds = new Set(monthTransactions.map(t => t.memberId));
    return members.filter(m => rechargedIds.has(m.id) && !consumedIds.has(m.id));
  }, [members, monthRecharges, monthTransactions]);

  const memberLastVisitMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      const d = new Date(t.createdAt).getTime();
      if (!map[t.memberId] || d > map[t.memberId]) {
        map[t.memberId] = d;
      }
    });
    return map;
  }, [transactions]);

  const memberMonthRechargeMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthRecharges.forEach(r => {
      map[r.memberId] = (map[r.memberId] || 0) + r.amount;
    });
    return map;
  }, [monthRecharges]);

  const totalRecharge = useMemo(
    () => monthRecharges.reduce((sum, r) => sum + r.amount, 0),
    [monthRecharges]
  );

  const totalConsumption = useMemo(
    () => monthTransactions.reduce((sum, t) => sum + t.balanceUsed, 0),
    [monthTransactions]
  );

  const newMembersThisMonth = useMemo(() => {
    const start = new Date(currentYear, currentMonth - 1, 1);
    const end = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    return members.filter(m => {
      const d = new Date(m.createdAt);
      return d >= start && d <= end;
    }).length;
  }, [members, currentYear, currentMonth]);

  const activeMembersThisMonth = useMemo(() => {
    const memberIds = new Set(monthTransactions.map(t => t.memberId));
    return memberIds.size;
  }, [monthTransactions]);

  const rechargingMembersThisMonth = useMemo(() => {
    const memberIds = new Set(monthRecharges.map(r => r.memberId));
    return memberIds.size;
  }, [monthRecharges]);

  const sleepMembers30 = useMemo(() => {
    const now = Date.now();
    const memberLastVisit: Record<string, number> = {};
    
    transactions.forEach(t => {
      const d = new Date(t.createdAt).getTime();
      if (!memberLastVisit[t.memberId] || d > memberLastVisit[t.memberId]) {
        memberLastVisit[t.memberId] = d;
      }
    });

    let count = 0;
    members.forEach(m => {
      const last = memberLastVisit[m.id];
      const days = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 999;
      if (days > 30) count++;
    });
    return count;
  }, [members, transactions]);

  const sleepMembers60 = useMemo(() => {
    const now = Date.now();
    const memberLastVisit: Record<string, number> = {};
    
    transactions.forEach(t => {
      const d = new Date(t.createdAt).getTime();
      if (!memberLastVisit[t.memberId] || d > memberLastVisit[t.memberId]) {
        memberLastVisit[t.memberId] = d;
      }
    });

    let count = 0;
    members.forEach(m => {
      const last = memberLastVisit[m.id];
      const days = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 999;
      if (days > 60) count++;
    });
    return count;
  }, [members, transactions]);

  const sleepMembers90 = useMemo(() => {
    const now = Date.now();
    const memberLastVisit: Record<string, number> = {};
    
    transactions.forEach(t => {
      const d = new Date(t.createdAt).getTime();
      if (!memberLastVisit[t.memberId] || d > memberLastVisit[t.memberId]) {
        memberLastVisit[t.memberId] = d;
      }
    });

    let count = 0;
    members.forEach(m => {
      const last = memberLastVisit[m.id];
      const days = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 999;
      if (days > 90) count++;
    });
    return count;
  }, [members, transactions]);

  const pointsByType = useMemo(() => {
    const result = {
      earn: 0,
      recharge: 0,
      birthday: 0,
      adjust_add: 0,
      adjust_sub: 0,
      spend: 0,
    };
    monthPointRecords.forEach(r => {
      if (r.type in result) {
        result[r.type as keyof typeof result] += r.change;
      }
    });
    return result;
  }, [monthPointRecords]);

  const totalPointsIn = Math.abs(pointsByType.earn) 
    + Math.abs(pointsByType.recharge) 
    + Math.abs(pointsByType.birthday) 
    + Math.abs(pointsByType.adjust_add);
  const totalPointsOut = Math.abs(pointsByType.spend) 
    + Math.abs(pointsByType.adjust_sub);
  const netPointsChange = totalPointsIn - totalPointsOut;

  const birthdayCareStats = useMemo(() => {
    return { 
      total: monthBirthdayCare.length, 
      sent: monthSentBirthdayCare.length, 
      used: monthUsedBirthdayCare.length 
    };
  }, [monthBirthdayCare, monthSentBirthdayCare, monthUsedBirthdayCare]);

  const funnelData = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth - 1, 1).getTime();

    const visitedMemberIds = new Set(monthTransactions.map(t => t.memberId));

    const revisitedMemberIdsFromStore = new Set(monthEffectiveness.revisitedMemberIds);

    const rechargedMemberIds = new Set(monthRecharges.map(r => r.memberId));

    const memberLastVisitBeforeMonth: Record<string, number> = {};
    transactions.forEach(t => {
      const tTime = new Date(t.createdAt).getTime();
      if (tTime < monthStart) {
        if (!memberLastVisitBeforeMonth[t.memberId] || tTime > memberLastVisitBeforeMonth[t.memberId]) {
          memberLastVisitBeforeMonth[t.memberId] = tTime;
        }
      }
    });

    const repurchaseMemberIds = new Set<string>();
    visitedMemberIds.forEach(id => {
      if (memberLastVisitBeforeMonth[id]) {
        repurchaseMemberIds.add(id);
      }
    });

    return {
      visited: visitedMemberIds.size,
      revisited: revisitedMemberIdsFromStore.size,
      recharged: rechargedMemberIds.size,
      repurchase: repurchaseMemberIds.size,
    };
  }, [monthTransactions, monthRecharges, monthEffectiveness, transactions, currentYear, currentMonth]);

  const conversionRates = useMemo(() => {
    const visitedToRevisited = funnelData.visited > 0 
      ? ((funnelData.revisited / funnelData.visited) * 100).toFixed(1) 
      : '0';
    const revisitedToRecharged = funnelData.revisited > 0 
      ? ((funnelData.recharged / funnelData.revisited) * 100).toFixed(1) 
      : '0';
    const rechargedToRepurchase = funnelData.recharged > 0 
      ? ((funnelData.repurchase / funnelData.recharged) * 100).toFixed(1) 
      : '0';
    return { visitedToRevisited, revisitedToRecharged, rechargedToRepurchase };
  }, [funnelData]);

  const reflowMembers = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthStartTime = monthStart.getTime();
    const today = new Date();

    const monthVisitedMemberIds = new Set(monthTransactions.map(t => t.memberId));

    const memberLastVisitBeforeMonth: Record<string, number> = {};
    transactions.forEach(t => {
      const tTime = new Date(t.createdAt).getTime();
      if (tTime < monthStartTime) {
        if (!memberLastVisitBeforeMonth[t.memberId] || tTime > memberLastVisitBeforeMonth[t.memberId]) {
          memberLastVisitBeforeMonth[t.memberId] = tTime;
        }
      }
    });

    const result: { memberId: string; name: string; lastVisit: string; daysAway: number }[] = [];
    monthVisitedMemberIds.forEach(id => {
      const lastVisit = memberLastVisitBeforeMonth[id];
      if (lastVisit) {
        const daysAway = Math.floor((monthStartTime - lastVisit) / (1000 * 60 * 60 * 24));
        if (daysAway > 30) {
          const member = members.find(m => m.id === id);
          const name = member?.name || (monthTransactions.find(t => t.memberId === id)?.memberName) || '未知';
          result.push({
            memberId: id,
            name,
            lastVisit: formatDateTime(new Date(lastVisit).toISOString()),
            daysAway: Math.floor((today.getTime() - lastVisit) / (1000 * 60 * 60 * 24)),
          });
        }
      }
    });

    return result.sort((a, b) => b.daysAway - a.daysAway);
  }, [monthTransactions, transactions, members, currentYear, currentMonth]);

  const keyFollowUpMembers = useMemo(() => {
    const revisitedIds = monthEffectiveness.revisitedMemberIds;
    return revisitedIds.map(id => {
      const member = members.find(m => m.id === id);
      const followUpRecord = monthFollowUps.find(f => f.memberId === id);
      const lastVisitTx = [...monthTransactions]
        .filter(t => t.memberId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const name = member?.name || followUpRecord?.memberName || '未知';
      const followUpAt = followUpRecord?.createdAt || '';
      const lastVisit = lastVisitTx?.createdAt || '';
      
      return {
        memberId: id,
        name,
        followUpAt: followUpAt ? formatDateTime(followUpAt) : '',
        lastVisit: lastVisit ? formatDateTime(lastVisit) : '',
      };
    }).sort((a, b) => {
      if (a.followUpAt && b.followUpAt) {
        return new Date(b.followUpAt).getTime() - new Date(a.followUpAt).getTime();
      }
      return 0;
    });
  }, [monthEffectiveness, monthFollowUps, members, monthTransactions]);

  const frequentVisitors = useMemo(() => {
    const memberStats: Record<string, { name: string; count: number; amount: number }> = {};
    
    monthTransactions.forEach(t => {
      if (!memberStats[t.memberId]) {
        memberStats[t.memberId] = { name: t.memberName, count: 0, amount: 0 };
      }
      memberStats[t.memberId].count += 1;
      memberStats[t.memberId].amount += t.balanceUsed;
    });

    return Object.entries(memberStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount)
      .slice(0, 10);
  }, [monthTransactions]);

  const topSpenders = useMemo(() => {
    const memberStats: Record<string, { name: string; count: number; amount: number }> = {};
    
    monthTransactions.forEach(t => {
      if (!memberStats[t.memberId]) {
        memberStats[t.memberId] = { name: t.memberName, count: 0, amount: 0 };
      }
      memberStats[t.memberId].count += 1;
      memberStats[t.memberId].amount += t.balanceUsed;
    });

    return Object.entries(memberStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [monthTransactions]);

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleExportTransactions = () => {
    const data = monthTransactions.map(t => ({
      '交易时间': formatDateTime(t.createdAt),
      '会员姓名': t.memberName,
      '服务项目': t.items.map(i => `${i.serviceName}×${i.quantity}`).join('、'),
      '总金额': t.totalAmount.toFixed(2),
      '储值支付': t.balanceUsed.toFixed(2),
      '积分抵扣': t.pointsUsed,
      '获得积分': t.pointsEarned,
      '备注': t.notes,
    }));
    exportToCSV(data, `消费记录_${currentYear}年${currentMonth}月.csv`);
  };

  const handleExportRecharges = () => {
    const data = monthRecharges.map(r => ({
      '充值时间': formatDateTime(r.createdAt),
      '会员姓名': r.memberName,
      '充值金额': r.amount.toFixed(2),
      '赠送积分': r.bonusPoints,
      '备注': r.notes,
    }));
    exportToCSV(data, `充值记录_${currentYear}年${currentMonth}月.csv`);
  };

  const handleExportMembers = () => {
    const data = members.map(m => ({
      '姓名': m.name,
      '手机号': m.phone,
      '生日': m.birthday || '',
      '储值余额': m.balance.toFixed(2),
      '积分': m.points,
      '到店次数': m.visitCount,
      '累计消费': m.totalConsumption.toFixed(2),
      '累计充值': m.totalRecharge.toFixed(2),
      '注册时间': formatDateTime(m.createdAt),
      '备注': m.notes,
    }));
    exportToCSV(data, '会员列表.csv');
  };

  const handleExportPointsReport = () => {
    const summary = [
      { '分类': '【积分收入】', '笔数': '', '数量': '' },
      { '分类': '消费获得', '笔数': monthPointRecords.filter(r => r.type === 'earn').length, '数量': Math.abs(pointsByType.earn) },
      { '分类': '充值赠送', '笔数': monthPointRecords.filter(r => r.type === 'recharge').length, '数量': Math.abs(pointsByType.recharge) },
      { '分类': '生日赠送', '笔数': monthPointRecords.filter(r => r.type === 'birthday').length, '数量': Math.abs(pointsByType.birthday) },
      { '分类': '手动增加', '笔数': monthPointRecords.filter(r => r.type === 'adjust_add').length, '数量': Math.abs(pointsByType.adjust_add) },
      { '分类': '收入小计', '笔数': monthPointRecords.filter(r => ['earn','recharge','birthday','adjust_add'].includes(r.type)).length, '数量': totalPointsIn },
      { '分类': '【积分支出】', '笔数': '', '数量': '' },
      { '分类': '消费抵扣', '笔数': monthPointRecords.filter(r => r.type === 'spend').length, '数量': Math.abs(pointsByType.spend) },
      { '分类': '手动扣减', '笔数': monthPointRecords.filter(r => r.type === 'adjust_sub').length, '数量': Math.abs(pointsByType.adjust_sub) },
      { '分类': '支出小计', '笔数': monthPointRecords.filter(r => ['spend','adjust_sub'].includes(r.type)).length, '数量': totalPointsOut },
      { '分类': '本月净增', '笔数': monthPointRecords.length, '数量': netPointsChange },
    ];

    const details = monthPointRecords
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(r => ({
        '变动时间': formatDateTime(r.createdAt),
        '会员姓名': r.memberName,
        '变动类型': getTypeLabel(r.type),
        '变动数量': r.change,
        '变动原因': r.reason,
      }));

    const summaryData = summary.map(row => ({
      '项目': row['分类'],
      '笔数': String(row['笔数']),
      '积分数量': String(row['数量']),
    }));
    exportToCSV(summaryData, `积分月报汇总_${currentYear}年${currentMonth}月.csv`);
    
    setTimeout(() => {
      exportToCSV(details, `积分月报明细_${currentYear}年${currentMonth}月.csv`);
    }, 200);
  };

  const handleExportOperationsReport = () => {
    const completionRate = monthFollowUps.length > 0 
      ? ((completedMonthFollowUps.length / monthFollowUps.length) * 100).toFixed(1) + '%' 
      : '0%';
    const revisitRate = completedMonthFollowUps.length > 0 
      ? ((monthEffectiveness.revisitedCount / completedMonthFollowUps.length) * 100).toFixed(1) + '%' 
      : '0%';
    const rechargeRate = monthEffectiveness.revisitedCount > 0 
      ? ((monthEffectiveness.rechargeCount / monthEffectiveness.revisitedCount) * 100).toFixed(1) + '%' 
      : '0%';

    const data = [
      { '指标': '【会员运营】', '数值': '', '备注': '' },
      { '指标': '会员总数', '数值': members.length, '备注': '累计注册会员' },
      { '指标': '本月新增会员', '数值': newMembersThisMonth, '备注': '' },
      { '指标': '本月活跃会员', '数值': activeMembersThisMonth, '备注': '本月有消费的会员数' },
      { '指标': '本月充值会员', '数值': rechargingMembersThisMonth, '备注': '本月有充值的会员数' },
      { '指标': '会员活跃率', '数值': members.length > 0 ? ((activeMembersThisMonth / members.length) * 100).toFixed(1) + '%' : '0%', '备注': '活跃会员/总会员' },
      { '指标': '沉睡会员(>30天)', '数值': sleepMembers30, '备注': '超过30天没到店' },
      { '指标': '沉睡会员(>60天)', '数值': sleepMembers60, '备注': '超过60天没到店' },
      { '指标': '沉睡会员(>90天)', '数值': sleepMembers90, '备注': '超过90天没到店' },
      { '指标': '【充值转化漏斗】', '数值': '', '备注': '' },
      { '指标': '本月到店会员', '数值': funnelData.visited, '备注': '有交易的去重人数' },
      { '指标': '已回访会员', '数值': funnelData.revisited, '备注': '本月回访记录关联的会员去重' },
      { '指标': '到店→回访转化率', '数值': conversionRates.visitedToRevisited + '%', '备注': '' },
      { '指标': '已充值会员', '数值': funnelData.recharged, '备注': '本月充值去重' },
      { '指标': '回访→充值转化率', '数值': conversionRates.revisitedToRecharged + '%', '备注': '' },
      { '指标': '已复购会员', '数值': funnelData.repurchase, '备注': '之前消费过，本月又有消费' },
      { '指标': '充值→复购转化率', '数值': conversionRates.rechargedToRepurchase + '%', '备注': '' },
      { '指标': '【老客回流】', '数值': '', '备注': '' },
      { '指标': '沉睡回流水数', '数值': reflowMembers.length, '备注': '超30天未到店本月有消费' },
      { '指标': '重点跟进回店数', '数值': keyFollowUpMembers.length, '备注': '回访后回店的会员数' },
      { '指标': '【会员分层复盘】', '数值': '', '备注': '' },
      { '指标': '高价值老客', '数值': highValueMembers.length, '备注': `贡献金额 ${highValueMembers.reduce((s, m) => s + m.totalConsumption, 0).toFixed(2)}` },
      { '指标': '最近沉默', '数值': silentMembers.length, '备注': `贡献金额 ${silentMembers.reduce((s, m) => s + m.totalConsumption, 0).toFixed(2)}` },
      { '指标': '刚充值未复购', '数值': rechargedNoRepurchaseMembers.length, '备注': `贡献金额 ${rechargedNoRepurchaseMembers.reduce((s, m) => s + m.totalConsumption, 0).toFixed(2)}` },
      { '指标': '【消费充值】', '数值': '', '备注': '' },
      { '指标': '本月充值总额', '数值': formatMoney(totalRecharge), '备注': `${monthRecharges.length} 笔充值` },
      { '指标': '本月消费总额', '数值': formatMoney(totalConsumption), '备注': `${monthTransactions.length} 笔消费` },
      { '指标': '【积分运营】', '数值': '', '备注': '' },
      { '指标': '积分总收入', '数值': totalPointsIn.toLocaleString(), '备注': '' },
      { '指标': '积分总支出', '数值': totalPointsOut.toLocaleString(), '备注': '' },
      { '指标': '积分净变化', '数值': (netPointsChange >= 0 ? '+' : '') + netPointsChange.toLocaleString(), '备注': '' },
      { '指标': '【生日关怀】', '数值': '', '备注': '' },
      { '指标': '本月生日关怀登记', '数值': birthdayCareStats.total, '备注': '按登记时间统计' },
      { '指标': '本月已发放', '数值': birthdayCareStats.sent, '备注': '按发放时间统计' },
      { '指标': '本月已使用', '数值': birthdayCareStats.used, '备注': '按使用时间统计' },
      { '指标': '【回访运营成效】', '数值': '', '备注': '' },
      { '指标': '本月登记回访数', '数值': monthFollowUps.length, '备注': '本月创建的回访记录' },
      { '指标': '本月已完成回访数', '数值': completedMonthFollowUps.length, '备注': '本月完成的回访记录' },
      { '指标': '回访完成率', '数值': completionRate, '备注': '已完成/登记' },
      { '指标': '回访后回店人数', '数值': monthEffectiveness.revisitedCount, '备注': '基于已完成回访' },
      { '指标': '回店率', '数值': revisitRate, '备注': '回店人数/已完成回访数' },
      { '指标': '回访后充值人数', '数值': monthEffectiveness.rechargeCount, '备注': '基于已完成回访' },
      { '指标': '充值转化率', '数值': rechargeRate, '备注': '充值人数/回店人数' },
      { '指标': '【员工跟进成效】', '数值': '', '备注': '' },
      ...assigneeMonthStats.map(s => ({
        '指标': s.assignee,
        '数值': `完成${s.completed}/${s.total}`,
        '备注': `完成率${s.total > 0 ? ((s.completed / s.total) * 100).toFixed(1) : 0}% | 回店${s.revisitedCount} | 充值${s.rechargeCount} | 预约${s.appointmentCount}`,
      })),
    ];
    exportToCSV(data, `会员运营月报_${currentYear}年${currentMonth}月.csv`);
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getTypeLabel = (type: PointRecord['type']) => {
    const map: Record<PointRecord['type'], string> = {
      earn: '消费获得',
      recharge: '充值赠送',
      birthday: '生日赠送',
      adjust_add: '手动增加',
      adjust_sub: '手动扣减',
      spend: '消费抵扣',
    };
    return map[type];
  };

  const getTypeBadge = (type: PointRecord['type']) => {
    const map: Record<PointRecord['type'], string> = {
      earn: 'bg-blue-50 text-blue-600',
      recharge: 'bg-emerald-50 text-emerald-600',
      birthday: 'bg-pink-50 text-pink-600',
      adjust_add: 'bg-violet-50 text-violet-600',
      adjust_sub: 'bg-orange-50 text-orange-600',
      spend: 'bg-red-50 text-red-600',
    };
    return map[type];
  };

  const getRateColor = (rate: string) => {
    const num = parseFloat(rate);
    if (num >= 50) return 'text-emerald-600 bg-emerald-50';
    if (num >= 30) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const activationRate = members.length > 0 ? ((activeMembersThisMonth / members.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">报表中心</h1>
          <p className="text-slate-500 mt-1">查看经营数据，导出报表</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" onClick={handleExportMembers}>
            <Download className="w-4 h-4" />
            导出会员
          </Button>
          <Button variant="secondary" onClick={handleExportRecharges}>
            <Download className="w-4 h-4" />
            导出充值
          </Button>
          <Button variant="secondary" onClick={handleExportTransactions}>
            <Download className="w-4 h-4" />
            导出消费
          </Button>
          <Button variant="secondary" onClick={handleExportPointsReport}>
            <Download className="w-4 h-4" />
            积分月报
          </Button>
          <Button onClick={handleExportOperationsReport}>
            <Download className="w-4 h-4" />
            运营月报
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <span className="text-xl font-bold text-slate-800 min-w-[150px] text-center">
          {currentYear}年 {monthNames[currentMonth - 1]}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          会员运营月报
        </h3>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="p-4 bg-violet-50 rounded-xl">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">本月新增</span>
            </div>
            <p className="text-2xl font-bold text-violet-700">{newMembersThisMonth} 人</p>
            <p className="text-xs text-violet-500 mt-1">占比 {members.length > 0 ? ((newMembersThisMonth / members.length) * 100).toFixed(1) : 0}%</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm font-medium">活跃会员</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{activeMembersThisMonth} 人</p>
            <p className="text-xs text-emerald-500 mt-1">活跃率 {activationRate}%</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">沉睡会员</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{sleepMembers30} 人</p>
            <p className="text-xs text-amber-500 mt-1">超过30天未到店</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-xl">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">生日关怀</span>
            </div>
            <p className="text-2xl font-bold text-pink-700">{birthdayCareStats.sent} 份</p>
            <p className="text-xs text-pink-500 mt-1">已登记 {birthdayCareStats.total} 份</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Banknote className="w-4 h-4" />
              <span className="text-sm font-medium">充值总额</span>
            </div>
            <p className="text-xl font-bold text-blue-700">{formatMoney(totalRecharge)}</p>
            <p className="text-xs text-blue-500 mt-1">{rechargingMembersThisMonth} 位会员充值</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">消费总额</span>
            </div>
            <p className="text-xl font-bold text-green-700">{formatMoney(totalConsumption)}</p>
            <p className="text-xs text-green-500 mt-1">{monthTransactions.length} 笔消费</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">积分净变化</span>
            </div>
            <p className={`text-xl font-bold ${netPointsChange >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
              {netPointsChange >= 0 ? '+' : ''}{netPointsChange.toLocaleString()}
            </p>
            <p className="text-xs text-amber-500 mt-1">+{totalPointsIn.toLocaleString()} / -{totalPointsOut.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">沉睡（超60天）</span>
            </div>
            <p className="text-xl font-bold text-orange-700">{sleepMembers60} 人</p>
            <p className="text-xs text-orange-500 mt-1">需重点关注</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">沉睡（超90天）</span>
            </div>
            <p className="text-xl font-bold text-red-700">{sleepMembers90} 人</p>
            <p className="text-xs text-red-500 mt-1">高流失风险</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-5">
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              回访运营成效
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">登记回访</p>
                  <p className="text-lg font-bold text-slate-800">{monthFollowUps.length}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">已完成</p>
                  <p className="text-lg font-bold text-emerald-600">{completedMonthFollowUps.length}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">完成率</p>
                  <p className="text-lg font-bold text-violet-600">
                    {monthFollowUps.length > 0 
                      ? ((completedMonthFollowUps.length / monthFollowUps.length) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">回店人数</span>
                    <span className="text-xs text-slate-400">回店率</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-blue-600">{monthEffectiveness.revisitedCount}</p>
                    <p className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getRateColor(
                      completedMonthFollowUps.length > 0 
                        ? ((monthEffectiveness.revisitedCount / completedMonthFollowUps.length) * 100).toFixed(1) 
                        : '0'
                    )}`}>
                      {completedMonthFollowUps.length > 0 
                        ? ((monthEffectiveness.revisitedCount / completedMonthFollowUps.length) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">充值人数</span>
                    <span className="text-xs text-slate-400">充值转化率</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-emerald-600">{monthEffectiveness.rechargeCount}</p>
                    <p className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getRateColor(
                      monthEffectiveness.revisitedCount > 0 
                        ? ((monthEffectiveness.rechargeCount / monthEffectiveness.revisitedCount) * 100).toFixed(1) 
                        : '0'
                    )}`}>
                      {monthEffectiveness.revisitedCount > 0 
                        ? ((monthEffectiveness.rechargeCount / monthEffectiveness.revisitedCount) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-500" />
              客户价值分布
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-violet-700">{members.length}</p>
                <p className="text-xs text-slate-500">会员总数</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-amber-600">{rechargingMembersThisMonth}</p>
                <p className="text-xs text-slate-500">本月充值人数</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-blue-600">{activeMembersThisMonth}</p>
                <p className="text-xs text-slate-500">本月到店人数</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 p-4 bg-slate-50 rounded-xl">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-teal-500" />
            员工跟进成效
          </h4>
          {assigneeMonthStats.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <UserCog className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">本月暂无回访任务分配</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">员工</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">分配任务</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">已完成</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">完成率</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">带回到店</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">带回充值</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">预约数</th>
                  </tr>
                </thead>
                <tbody>
                  {assigneeMonthStats.map((s) => (
                    <tr key={s.assignee} className="border-b border-slate-100 hover:bg-white/50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={s.assignee} size="sm" />
                          <span className="font-medium text-slate-700 text-sm">{s.assignee}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-slate-600">{s.total}</td>
                      <td className="px-3 py-2 text-center text-sm font-semibold text-emerald-600">{s.completed}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRateColor(
                          s.total > 0 ? ((s.completed / s.total) * 100).toFixed(1) : '0'
                        )}`}>
                          {s.total > 0 ? ((s.completed / s.total) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-blue-600 font-medium">{s.revisitedCount}</td>
                      <td className="px-3 py-2 text-center text-sm text-emerald-600 font-medium">{s.rechargeCount}</td>
                      <td className="px-3 py-2 text-center text-sm text-violet-600 font-medium">{s.appointmentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-500" />
          充值转化漏斗
        </h3>
        <div className="flex items-stretch justify-between gap-2">
          <div className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">本月到店会员</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{funnelData.visited}</p>
            <p className="text-xs text-blue-500 mt-1">有交易的去重人数</p>
          </div>
          
          <div className="flex items-center justify-center px-1">
            <div className="flex flex-col items-center">
              <ArrowRight className="w-6 h-6 text-slate-300" />
              <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${getRateColor(conversionRates.visitedToRevisited)}`}>
                {conversionRates.visitedToRevisited}%
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 bg-violet-50 rounded-xl border border-violet-100">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">已回访会员</span>
            </div>
            <p className="text-2xl font-bold text-violet-700">{funnelData.revisited}</p>
            <p className="text-xs text-violet-500 mt-1">回访记录关联会员</p>
          </div>

          <div className="flex items-center justify-center px-1">
            <div className="flex flex-col items-center">
              <ArrowRight className="w-6 h-6 text-slate-300" />
              <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${getRateColor(conversionRates.revisitedToRecharged)}`}>
                {conversionRates.revisitedToRecharged}%
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">已充值会员</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{funnelData.recharged}</p>
            <p className="text-xs text-amber-500 mt-1">本月充值去重</p>
          </div>

          <div className="flex items-center justify-center px-1">
            <div className="flex flex-col items-center">
              <ArrowRight className="w-6 h-6 text-slate-300" />
              <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${getRateColor(conversionRates.rechargedToRepurchase)}`}>
                {conversionRates.rechargedToRepurchase}%
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">已复购会员</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{funnelData.repurchase}</p>
            <p className="text-xs text-emerald-500 mt-1">之前消费本月又消费</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-orange-500" />
            沉睡回流
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
              {reflowMembers.length} 人
            </span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">上月之前超过30天未到店、本月有消费的会员</p>
          {reflowMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Moon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>本月暂无沉睡回流会员</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">会员</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">上次到店</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">距今天数</th>
                  </tr>
                </thead>
                <tbody>
                  {reflowMembers.map((m) => (
                    <tr key={m.memberId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} size="sm" />
                          <span className="font-medium text-slate-700 text-sm">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{m.lastVisit}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`text-sm font-semibold ${m.daysAway > 90 ? 'text-red-600' : m.daysAway > 60 ? 'text-orange-600' : 'text-amber-600'}`}>
                          {m.daysAway} 天
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-violet-500" />
            重点跟进回店
            <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
              {keyFollowUpMembers.length} 人
            </span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">本月回访后成功回店消费的会员</p>
          {keyFollowUpMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>本月暂无回访回店会员</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">会员</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">回访时间</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">回店时间</th>
                  </tr>
                </thead>
                <tbody>
                  {keyFollowUpMembers.map((m) => (
                    <tr key={m.memberId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} size="sm" />
                          <span className="font-medium text-slate-700 text-sm">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{m.followUpAt}</td>
                      <td className="px-3 py-2 text-xs text-emerald-600 font-medium">{m.lastVisit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          会员分层复盘
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">高价值老客</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{highValueMembers.length} 人</p>
            <p className="text-xs text-emerald-500 mt-1">
              贡献 {formatMoney(highValueMembers.reduce((s, m) => s + m.totalConsumption, 0))}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">最近沉默</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{silentMembers.length} 人</p>
            <p className="text-xs text-amber-500 mt-1">
              贡献 {formatMoney(silentMembers.reduce((s, m) => s + m.totalConsumption, 0))}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">刚充值未复购</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{rechargedNoRepurchaseMembers.length} 人</p>
            <p className="text-xs text-red-500 mt-1">
              贡献 {formatMoney(rechargedNoRepurchaseMembers.reduce((s, m) => s + m.totalConsumption, 0))}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-2">高价值老客明细</h4>
            <p className="text-xs text-slate-400 mb-2">累计充值≥500 且 本月有消费且之前也有消费</p>
            {highValueMembers.length === 0 ? (
              <p className="text-center py-4 text-slate-400 text-sm">暂无</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">姓名</th>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">手机号</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-600">累计消费</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-600">累计充值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highValueMembers.map(m => (
                      <tr key={m.id} className="border-b border-slate-50">
                        <td className="px-2 py-1.5 text-sm text-slate-700">{m.name}</td>
                        <td className="px-2 py-1.5 text-xs text-slate-500">{m.phone}</td>
                        <td className="px-2 py-1.5 text-right text-xs text-emerald-600 font-medium">{formatMoney(m.totalConsumption)}</td>
                        <td className="px-2 py-1.5 text-right text-xs text-blue-600 font-medium">{formatMoney(m.totalRecharge)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-2">最近沉默明细</h4>
            <p className="text-xs text-slate-400 mb-2">60天内无到店消费（之前有消费）</p>
            {silentMembers.length === 0 ? (
              <p className="text-center py-4 text-slate-400 text-sm">暂无</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">姓名</th>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">手机号</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-600">累计消费</th>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">上次到店</th>
                    </tr>
                  </thead>
                  <tbody>
                    {silentMembers.map(m => (
                      <tr key={m.id} className="border-b border-slate-50">
                        <td className="px-2 py-1.5 text-sm text-slate-700">{m.name}</td>
                        <td className="px-2 py-1.5 text-xs text-slate-500">{m.phone}</td>
                        <td className="px-2 py-1.5 text-right text-xs text-emerald-600 font-medium">{formatMoney(m.totalConsumption)}</td>
                        <td className="px-2 py-1.5 text-xs text-amber-600">
                          {memberLastVisitMap[m.id] ? formatDateTime(new Date(memberLastVisitMap[m.id]).toISOString()) : '无记录'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-2">刚充值未复购明细</h4>
            <p className="text-xs text-slate-400 mb-2">本月有充值但本月无消费</p>
            {rechargedNoRepurchaseMembers.length === 0 ? (
              <p className="text-center py-4 text-slate-400 text-sm">暂无</p>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">姓名</th>
                      <th className="text-left px-2 py-1.5 text-xs font-semibold text-slate-600">手机号</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-600">充值金额</th>
                      <th className="text-right px-2 py-1.5 text-xs font-semibold text-slate-600">储值余额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechargedNoRepurchaseMembers.map(m => (
                      <tr key={m.id} className="border-b border-slate-50">
                        <td className="px-2 py-1.5 text-sm text-slate-700">{m.name}</td>
                        <td className="px-2 py-1.5 text-xs text-slate-500">{m.phone}</td>
                        <td className="px-2 py-1.5 text-right text-xs text-blue-600 font-medium">{formatMoney(memberMonthRechargeMap[m.id] || 0)}</td>
                        <td className="px-2 py-1.5 text-right text-xs text-slate-600">{formatMoney(m.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">充值总额</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatMoney(totalRecharge)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{monthRecharges.length} 笔充值</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">消费总额</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatMoney(totalConsumption)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{monthTransactions.length} 笔消费</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">新增会员</p>
              <p className="text-2xl font-bold text-violet-600 mt-1">{newMembersThisMonth}</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <Users className="w-6 h-6 text-violet-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">本月新增注册</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">积分净增</p>
              <p className={`text-2xl font-bold mt-1 ${netPointsChange >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {netPointsChange >= 0 ? '+' : ''}{netPointsChange.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Gift className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            收入{totalPointsIn.toLocaleString()} / 支出{totalPointsOut.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-amber-500" />
          积分月报
        </h3>
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">消费获得</span>
            </div>
            <p className="text-xl font-bold text-blue-700">+{Math.abs(pointsByType.earn).toLocaleString()}</p>
            <p className="text-xs text-blue-500 mt-1">
              {monthPointRecords.filter(r => r.type === 'earn').length} 笔
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Banknote className="w-4 h-4" />
              <span className="text-sm font-medium">充值赠送</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">+{Math.abs(pointsByType.recharge).toLocaleString()}</p>
            <p className="text-xs text-emerald-500 mt-1">
              {monthPointRecords.filter(r => r.type === 'recharge').length} 笔
            </p>
          </div>
          <div className="p-4 bg-pink-50 rounded-xl">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
              <Cake className="w-4 h-4" />
              <span className="text-sm font-medium">生日赠送</span>
            </div>
            <p className="text-xl font-bold text-pink-700">+{Math.abs(pointsByType.birthday).toLocaleString()}</p>
            <p className="text-xs text-pink-500 mt-1">
              {monthPointRecords.filter(r => r.type === 'birthday').length} 笔
            </p>
          </div>
          <div className="p-4 bg-violet-50 rounded-xl">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <PlusCircle className="w-4 h-4" />
              <span className="text-sm font-medium">手动增加</span>
            </div>
            <p className="text-xl font-bold text-violet-700">+{Math.abs(pointsByType.adjust_add).toLocaleString()}</p>
            <p className="text-xs text-violet-500 mt-1">
              {monthPointRecords.filter(r => r.type === 'adjust_add').length} 笔
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <MinusCircle className="w-4 h-4" />
              <span className="text-sm font-medium">消费抵扣</span>
            </div>
            <p className="text-xl font-bold text-red-700">-{Math.abs(pointsByType.spend).toLocaleString()}</p>
            <p className="text-xs text-red-500 mt-1">
              {monthPointRecords.filter(r => r.type === 'spend').length} 笔
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <MinusCircle className="w-4 h-4" />
              <span className="text-sm font-medium">手动扣减</span>
            </div>
            <p className="text-xl font-bold text-orange-700">-{Math.abs(pointsByType.adjust_sub).toLocaleString()}</p>
            <p className="text-xs text-orange-500 mt-1">
              {monthPointRecords.filter(r => r.type === 'adjust_sub').length} 笔
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">总流入 / 总流出</span>
            </div>
            <p className="text-xl font-bold text-slate-700">
              <span className="text-emerald-600">+{totalPointsIn.toLocaleString()}</span>
              <span className="mx-2 text-slate-400">/</span>
              <span className="text-red-600">-{totalPointsOut.toLocaleString()}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              共 {monthPointRecords.length} 笔积分变动
            </p>
          </div>
          <div className={`p-4 rounded-xl ${netPointsChange >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className={`flex items-center gap-2 mb-2 ${netPointsChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">本月净变化</span>
            </div>
            <p className={`text-xl font-bold ${netPointsChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {netPointsChange >= 0 ? '+' : ''}{netPointsChange.toLocaleString()}
            </p>
            <p className={`text-xs mt-1 ${netPointsChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {netPointsChange >= 0 ? '积分池增长中' : '积分被消耗较多'}
            </p>
          </div>
        </div>

        <h4 className="font-semibold text-slate-700 mb-3 text-sm">积分变动明细</h4>
        {monthPointRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>本月暂无积分变动记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">时间</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">会员</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">类型</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">数量</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">原因</th>
                </tr>
              </thead>
              <tbody>
                {[...monthPointRecords]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.memberName} size="sm" />
                          <span className="font-medium text-slate-700">{r.memberName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(r.type)}`}>
                          {getTypeLabel(r.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${r.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {r.change > 0 ? '+' : ''}{r.change.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {r.reason}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            到店次数排行
          </h3>
          {frequentVisitors.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>本月暂无消费记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {frequentVisitors.map((member, index) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg">
                      {getRankBadge(index)}
                    </span>
                    <Avatar name={member.name} size="sm" />
                    <span className="font-medium text-slate-700">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{member.count} 次</p>
                    <p className="text-xs text-slate-400">{formatMoney(member.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            消费金额排行
          </h3>
          {topSpenders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>本月暂无消费记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topSpenders.map((member, index) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg">
                      {getRankBadge(index)}
                    </span>
                    <Avatar name={member.name} size="sm" />
                    <span className="font-medium text-slate-700">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{formatMoney(member.amount)}</p>
                    <p className="text-xs text-slate-400">{member.count} 次</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">本月消费明细</h3>
        {monthTransactions.length === 0 ? (
          <p className="text-center py-8 text-slate-400">本月暂无消费记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">时间</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">会员</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">项目</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">金额</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">积分变动</th>
                </tr>
              </thead>
              <tbody>
                {[...monthTransactions]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={t.memberName} size="sm" />
                          <span className="font-medium text-slate-700">{t.memberName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {t.items.map(i => `${i.serviceName}×${i.quantity}`).join('、')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-600">
                          -{formatMoney(t.balanceUsed)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {t.pointsEarned > 0 && (
                          <span className="text-emerald-600">+{t.pointsEarned}</span>
                        )}
                        {t.pointsUsed > 0 && (
                          <span className="text-red-500 ml-2">-{t.pointsUsed}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
