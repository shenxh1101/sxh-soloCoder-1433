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
  ChevronRight
} from 'lucide-react';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatMoney, formatDateTime } from '@/utils/date';
import { exportToCSV } from '@/utils/export';

export default function Reports() {
  const { members } = useMemberStore();
  const { transactions, recharges, getMonthTransactions, getMonthRecharges } = useTransactionStore();

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

  const totalRecharge = useMemo(
    () => monthRecharges.reduce((sum, r) => sum + r.amount, 0),
    [monthRecharges]
  );

  const totalConsumption = useMemo(
    () => monthTransactions.reduce((sum, t) => sum + t.balanceUsed, 0),
    [monthTransactions]
  );

  const totalPointsEarned = useMemo(
    () => monthTransactions.reduce((sum, t) => sum + t.pointsEarned, 0),
    [monthTransactions]
  );

  const totalPointsSpent = useMemo(
    () => monthTransactions.reduce((sum, t) => sum + t.pointsUsed, 0),
    [monthTransactions]
  );

  const rechargeBonusPoints = useMemo(
    () => monthRecharges.reduce((sum, r) => sum + r.bonusPoints, 0),
    [monthRecharges]
  );

  const newMembersThisMonth = useMemo(() => {
    const start = new Date(currentYear, currentMonth - 1, 1);
    const end = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    return members.filter(m => {
      const d = new Date(m.createdAt);
      return d >= start && d <= end;
    }).length;
  }, [members, currentYear, currentMonth]);

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

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">报表中心</h1>
          <p className="text-slate-500 mt-1">查看经营数据，导出报表</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportMembers}>
            <Download className="w-4 h-4" />
            导出会员
          </Button>
          <Button variant="secondary" onClick={handleExportRecharges}>
            <Download className="w-4 h-4" />
            导出充值
          </Button>
          <Button onClick={handleExportTransactions}>
            <Download className="w-4 h-4" />
            导出消费
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
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {(totalPointsEarned + rechargeBonusPoints - totalPointsSpent).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Gift className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            获得{totalPointsEarned + rechargeBonusPoints} / 消耗{totalPointsSpent}
          </p>
        </div>
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
