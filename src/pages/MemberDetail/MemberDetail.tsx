import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, Gift, Wallet, CreditCard, TrendingUp, FileText } from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatMoney, formatDateTime, getDaysUntilBirthday } from '@/utils/date';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMember } = useMemberStore();
  const { getMemberTransactions, getMemberRecharges, getMemberPointRecords } = useTransactionStore();

  const member = getMember(id || '');
  const transactions = getMemberTransactions(id || '');
  const recharges = getMemberRecharges(id || '');
  const pointRecords = getMemberPointRecords(id || '');

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">会员不存在</p>
        <Button className="mt-4" onClick={() => navigate('/members')}>返回会员列表</Button>
      </div>
    );
  }

  const daysUntilBirthday = getDaysUntilBirthday(member.birthday);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回会员列表
      </button>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={member.name} size="xl" />
            <div>
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <p className="text-blue-200 flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4" />
                {member.phone}
              </p>
              {member.notes && (
                <p className="text-blue-200 text-sm mt-2 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {member.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30"
              onClick={() => navigate(`/recharge?memberId=${member.id}`)}
            >
              <Wallet className="w-4 h-4" />
              充值
            </Button>
            <Button 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30"
              onClick={() => navigate(`/checkout?memberId=${member.id}`)}
            >
              <CreditCard className="w-4 h-4" />
              消费
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-blue-200 text-sm">储值余额</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(member.balance)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">可用积分</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-300" />
              {member.points.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">到店次数</p>
            <p className="text-2xl font-bold mt-1">{member.visitCount} 次</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">累计消费</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(member.totalConsumption)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            消费记录
          </h3>
          {transactions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">暂无消费记录</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {t.items.map(i => i.serviceName).join('、')}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">-{formatMoney(t.balanceUsed)}</p>
                    {t.pointsEarned > 0 && (
                      <p className="text-xs text-amber-500">+{t.pointsEarned}积分</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            充值记录
          </h3>
          {recharges.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">暂无充值记录</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recharges.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">储值充值</p>
                    <p className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">+{formatMoney(r.amount)}</p>
                    {r.bonusPoints > 0 && (
                      <p className="text-xs text-amber-500">+{r.bonusPoints}积分</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            积分变动
          </h3>
          {pointRecords.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">暂无积分记录</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pointRecords.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r.reason}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <p className={`text-sm font-semibold ${r.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {r.change > 0 ? '+' : ''}{r.change}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-500" />
          生日信息
        </h3>
        {member.birthday ? (
          <div className="flex items-center gap-4">
            <div className="p-4 bg-pink-50 rounded-xl">
              <p className="text-sm text-pink-600">出生日期</p>
              <p className="text-lg font-semibold text-pink-700">{member.birthday}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-amber-600">距离下次生日</p>
              <p className="text-lg font-semibold text-amber-700">
                {daysUntilBirthday === 0 ? '今天就是生日！' : `${daysUntilBirthday} 天`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">暂未设置生日</p>
        )}
      </div>
    </div>
  );
}
