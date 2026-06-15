import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  Gift, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  FileText,
  Clock,
  Sparkles,
  History,
  Scissors,
  Banknote,
  PlusCircle,
  MinusCircle,
  Cake,
  Activity
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useBirthdayCareStore } from '@/store/useBirthdayCareStore';
import { formatMoney, formatDateTime, getDaysUntilBirthday, formatDate } from '@/utils/date';
import type { Transaction, Recharge, PointRecord } from '@/types';

type TimelineItem = {
  id: string;
  type: 'transaction' | 'recharge' | 'point';
  date: string;
  data: Transaction | Recharge | PointRecord;
};

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMember } = useMemberStore();
  const { getMemberTransactions, getMemberRecharges, getMemberPointRecords } = useTransactionStore();
  const { getRecordsByMember } = useBirthdayCareStore();

  const member = getMember(id || '');
  const transactions = getMemberTransactions(id || '');
  const recharges = getMemberRecharges(id || '');
  const pointRecords = getMemberPointRecords(id || '');
  const birthdayCareRecords = getRecordsByMember(id || '');

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">会员不存在</p>
        <Button className="mt-4" onClick={() => navigate('/members')}>返回会员列表</Button>
      </div>
    );
  }

  const daysUntilBirthday = getDaysUntilBirthday(member.birthday);

  const lastVisit = transactions.length > 0 ? transactions[0].createdAt : null;
  const daysSinceLastVisit = lastVisit 
    ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)) 
    : null;

  const favoriteServices = () => {
    const serviceCount: Record<string, number> = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        serviceCount[item.serviceName] = (serviceCount[item.serviceName] || 0) + item.quantity;
      });
    });
    return Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };
  const topServices = favoriteServices();

  const timeline: TimelineItem[] = [
    ...transactions.map(t => ({
      id: `t-${t.id}`,
      type: 'transaction' as const,
      date: t.createdAt,
      data: t,
    })),
    ...recharges.map(r => ({
      id: `r-${r.id}`,
      type: 'recharge' as const,
      date: r.createdAt,
      data: r,
    })),
    ...pointRecords.map(p => ({
      id: `p-${p.id}`,
      type: 'point' as const,
      date: p.createdAt,
      data: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTimelineIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'transaction':
        return <Scissors className="w-4 h-4" />;
      case 'recharge':
        return <Banknote className="w-4 h-4" />;
      case 'point': {
        const p = timeline.find(t => t.id)?.data as PointRecord;
        if ((timeline.find(t => t.id)?.data as PointRecord)?.change > 0) {
          return <PlusCircle className="w-4 h-4" />;
        }
        return <MinusCircle className="w-4 h-4" />;
      }
    }
  };

  const getTimelineColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'transaction':
        return {
          dot: 'bg-blue-500',
          line: 'bg-blue-100',
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
        };
      case 'recharge':
        return {
          dot: 'bg-emerald-500',
          line: 'bg-emerald-100',
          bg: 'bg-emerald-50',
          icon: 'text-emerald-600',
        };
      case 'point':
        return {
          dot: 'bg-amber-500',
          line: 'bg-amber-100',
          bg: 'bg-amber-50',
          icon: 'text-amber-600',
        };
    }
  };

  const getTypeLabel = (type: TimelineItem['type']) => {
    switch (type) {
      case 'transaction':
        return '到店消费';
      case 'recharge':
        return '储值充值';
      case 'point':
        return '积分变动';
    }
  };

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
            <Activity className="w-5 h-5 text-violet-500" />
            客户画像
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${lastVisit ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <Clock className={`w-4 h-4 ${lastVisit ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">上次到店</p>
                {lastVisit ? (
                  <>
                    <p className="font-semibold text-slate-800 mt-0.5">{formatDate(lastVisit)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {daysSinceLastVisit === 0 
                        ? '今天刚来过' 
                        : `${daysSinceLastVisit} 天前`}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-slate-400 mt-0.5">还没来过</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${daysSinceLastVisit !== null && daysSinceLastVisit > 30 ? 'bg-red-50' : 'bg-blue-50'}`}>
                <TrendingUp className={`w-4 h-4 ${daysSinceLastVisit !== null && daysSinceLastVisit > 30 ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">活跃状态</p>
                {daysSinceLastVisit === null ? (
                  <p className="font-semibold text-slate-400 mt-0.5">新客户 - 待激活</p>
                ) : daysSinceLastVisit <= 7 ? (
                  <p className="font-semibold text-emerald-600 mt-0.5">非常活跃</p>
                ) : daysSinceLastVisit <= 30 ? (
                  <p className="font-semibold text-blue-600 mt-0.5">正常活跃</p>
                ) : daysSinceLastVisit <= 90 ? (
                  <p className="font-semibold text-amber-600 mt-0.5">需要唤醒</p>
                ) : (
                  <p className="font-semibold text-red-600 mt-0.5">沉睡客户</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  累计充值 {formatMoney(member.totalRecharge)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${birthdayCareRecords.length > 0 ? 'bg-pink-50' : 'bg-slate-50'}`}>
                <Cake className={`w-4 h-4 ${birthdayCareRecords.length > 0 ? 'text-pink-600' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">生日关怀</p>
                {birthdayCareRecords.length > 0 ? (
                  <>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      累计 {birthdayCareRecords.length} 次关怀
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      最近：{birthdayCareRecords[0].year}年 {birthdayCareRecords[0].couponType}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-slate-400 mt-0.5">暂无关怀记录</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            常做项目 TOP 5
          </h3>
          {topServices.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无消费记录，还不清楚偏好项目</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map(([name, count], index) => {
                const maxCount = topServices[0][1];
                const percent = (count / maxCount) * 100;
                const colors = [
                  'from-amber-400 to-amber-500',
                  'from-slate-400 to-slate-500',
                  'from-orange-400 to-orange-500',
                  'from-blue-400 to-blue-500',
                  'from-violet-400 to-violet-500',
                ];
                const bgColors = [
                  'bg-amber-50',
                  'bg-slate-50',
                  'bg-orange-50',
                  'bg-blue-50',
                  'bg-violet-50',
                ];
                const badges = ['🥇', '🥈', '🥉', '4', '5'];
                return (
                  <div key={name} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base w-6">{badges[index]}</span>
                        <span className="font-medium text-slate-700">{name}</span>
                      </div>
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${bgColors[index]} text-slate-700`}>
                        {count} 次
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colors[index]} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            到店时间线
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              消费
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              充值
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              积分
            </span>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">还没有任何互动记录</p>
            <p className="text-sm mt-2">快去给这位客户创建第一次消费或充值吧</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="secondary" onClick={() => navigate(`/recharge?memberId=${member.id}`)}>
                <Wallet className="w-4 h-4" />
                去充值
              </Button>
              <Button onClick={() => navigate(`/checkout?memberId=${member.id}`)}>
                <CreditCard className="w-4 h-4" />
                去消费
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-[15px] top-1 bottom-1 w-0.5 bg-slate-100"></div>
            
            <div className="space-y-5">
              {timeline.slice(0, 30).map((item, index) => {
                const colors = getTimelineColor(item.type);
                const isLast = index === Math.min(timeline.length - 1, 29);
                return (
                  <div key={item.id} className="relative">
                    <div className={`absolute -left-[30px] top-1 w-8 h-8 rounded-full ${colors.dot} ring-4 ring-white flex items-center justify-center text-white z-10`}>
                      {getTimelineIcon(item.type)}
                    </div>
                    
                    <div className={`${colors.bg} rounded-xl p-4 ml-4 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${colors.icon} px-2 py-0.5 rounded-full bg-white`}>
                              {getTypeLabel(item.type)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDateTime(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {item.type === 'transaction' && (
                        <div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {(item.data as Transaction).items.map((i, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded-lg text-slate-600 border border-slate-100">
                                {i.serviceName} × {i.quantity}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100/70">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>实付：<span className="font-semibold text-slate-700">{formatMoney((item.data as Transaction).balanceUsed)}</span></span>
                              {(item.data as Transaction).pointsEarned > 0 && (
                                <span className="text-emerald-600">+{(item.data as Transaction).pointsEarned} 积分</span>
                              )}
                              {(item.data as Transaction).pointsUsed > 0 && (
                                <span className="text-red-500">-{(item.data as Transaction).pointsUsed} 积分抵扣</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {item.type === 'recharge' && (
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-emerald-600">
                                +{formatMoney((item.data as Recharge).amount)}
                              </span>
                              {(item.data as Recharge).bonusPoints > 0 && (
                                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  赠送 {(item.data as Recharge).bonusPoints} 积分
                                </span>
                              )}
                            </div>
                          </div>
                          {(item.data as Recharge).notes && (
                            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100/70">
                              备注：{(item.data as Recharge).notes}
                            </p>
                          )}
                        </div>
                      )}

                      {item.type === 'point' && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-700">
                            {(item.data as PointRecord).reason}
                          </p>
                          <span className={`text-lg font-bold ${(item.data as PointRecord).change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {(item.data as PointRecord).change > 0 ? '+' : ''}{(item.data as PointRecord).change.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {timeline.length > 30 && (
              <div className="text-center pt-4 ml-4">
                <p className="text-sm text-slate-400">
                  仅显示最近 30 条，共 {timeline.length} 条记录
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-500" />
          生日信息 & 关怀历史
        </h3>
        {member.birthday ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-pink-50 rounded-xl">
                <p className="text-sm text-pink-600">出生日期</p>
                <p className="text-lg font-semibold text-pink-700">{member.birthday}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-600">距离下次生日</p>
                <p className="text-lg font-semibold text-amber-700">
                  {daysUntilBirthday === 0 ? '🎂 今天就是生日！' : `${daysUntilBirthday} 天`}
                </p>
              </div>
            </div>

            {birthdayCareRecords.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 text-sm mb-3 mt-5">历史关怀记录</h4>
                <div className="space-y-2">
                  {birthdayCareRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Cake className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">
                            {record.year}年 · {record.couponType} {record.couponValue}
                          </p>
                          <p className="text-xs text-slate-400">
                            {record.notes || '无备注'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.status === 'used' ? 'bg-emerald-50 text-emerald-600'
                          : record.status === 'sent' ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-600'
                        }`}>
                          {record.status === 'used' ? '已使用' 
                          : record.status === 'sent' ? '已发放'
                          : '待发放'}
                        </span>
                        {record.sentAt && (
                          <p className="text-xs text-slate-400 mt-1">
                            {record.status === 'used' ? '使用' : '发放'}：{formatDate(record.usedAt || record.sentAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">暂未设置生日</p>
        )}
      </div>
    </div>
  );
}
