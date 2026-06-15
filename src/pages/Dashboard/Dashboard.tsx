import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  CreditCard, 
  Users, 
  Gift, 
  Plus, 
  Scissors,
  ChevronRight,
  Calendar
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { getDaysUntilBirthday, formatMoney } from '@/utils/date';

export default function Dashboard() {
  const navigate = useNavigate();
  const { members, loadMembers } = useMemberStore();
  const { transactions, recharges, loadData, getTodayTransactions, getTodayRecharges } = useTransactionStore();

  useEffect(() => {
    loadMembers();
    loadData();
  }, [loadMembers, loadData]);

  const todayTransactions = useMemo(() => getTodayTransactions(), [transactions]);
  const todayRecharges = useMemo(() => getTodayRecharges(), [recharges]);

  const todayConsumption = todayTransactions.reduce((sum, t) => sum + t.balanceUsed, 0);
  const todayRechargeAmount = todayRecharges.reduce((sum, r) => sum + r.amount, 0);
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);

  const upcomingBirthdays = useMemo(() => {
    return members
      .map(m => ({
        ...m,
        daysUntil: getDaysUntilBirthday(m.birthday),
      }))
      .filter(m => m.daysUntil !== null && m.daysUntil <= 7)
      .sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0))
      .slice(0, 5);
  }, [members]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [transactions]);

  const quickActions = [
    { label: '新增会员', icon: Plus, color: 'bg-blue-500', action: () => navigate('/members?action=add') },
    { label: '快速收银', icon: Scissors, color: 'bg-emerald-500', action: () => navigate('/checkout') },
    { label: '会员充值', icon: Wallet, color: 'bg-amber-500', action: () => navigate('/recharge') },
    { label: '积分调整', icon: Gift, color: 'bg-violet-500', action: () => navigate('/points') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">仪表盘</h1>
          <p className="text-slate-500 mt-1">欢迎回来，今天也要加油哦！</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">今日日期</p>
          <p className="text-lg font-semibold text-slate-700">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="今日营业额"
          value={formatMoney(todayConsumption)}
          icon={CreditCard}
          color="blue"
          subtitle={`${todayTransactions.length} 笔交易`}
        />
        <StatCard
          title="今日充值"
          value={formatMoney(todayRechargeAmount)}
          icon={Wallet}
          color="green"
          subtitle={`${todayRecharges.length} 笔充值`}
        />
        <StatCard
          title="会员总数"
          value={members.length}
          icon={Users}
          color="amber"
          subtitle="累计注册会员"
        />
        <StatCard
          title="积分总数"
          value={totalPoints.toLocaleString()}
          icon={Gift}
          color="purple"
          subtitle="全店会员积分"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4"
            >
              <div className={`${action.color} p-3 rounded-xl text-white`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-700">{action.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800">最近交易</h2>
            <button 
              onClick={() => navigate('/reports')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无交易记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t) => {
                const member = members.find(m => m.id === t.memberId);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {member && <Avatar name={member.name} size="sm" />}
                      <div>
                        <p className="font-medium text-slate-700">{t.memberName}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">-{formatMoney(t.balanceUsed)}</p>
                      {t.pointsEarned > 0 && (
                        <p className="text-xs text-amber-500">+{t.pointsEarned} 积分</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800">近期生日</h2>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          {upcomingBirthdays.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>7天内没有生日</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {m.daysUntil === 0 ? (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        今天生日！
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        {m.daysUntil} 天后
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={() => navigate('/birthday')}
              >
                查看全部生日会员
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
