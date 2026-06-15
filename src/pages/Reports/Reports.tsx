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
  Banknote
} from 'lucide-react';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
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

    const typeLabelMap: Record<PointRecord['type'], string> = {
      earn: '消费获得',
      recharge: '充值赠送',
      birthday: '生日赠送',
      adjust_add: '手动增加',
      adjust_sub: '手动扣减',
      spend: '消费抵扣',
    };

    const details = monthPointRecords
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(r => ({
        '变动时间': formatDateTime(r.createdAt),
        '会员姓名': r.memberName,
        '变动类型': typeLabelMap[r.type],
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
          <Button onClick={handleExportPointsReport}>
            <Download className="w-4 h-4" />
            导出积分月报
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
