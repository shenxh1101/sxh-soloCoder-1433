import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  Activity,
  MessageSquare,
  AlertTriangle,
  PhoneCall,
  Heart,
  CheckCircle,
  Plus,
  Edit3,
  MessageCircle,
  Send,
  Users,
  MoreHorizontal,
  Check,
  XCircle
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useBirthdayCareStore } from '@/store/useBirthdayCareStore';
import { useFollowUpStore } from '@/store/useFollowUpStore';
import { formatMoney, formatDateTime, getDaysUntilBirthday, formatDate } from '@/utils/date';
import type { Transaction, Recharge, PointRecord, FollowUpRecord } from '@/types';

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
  const { getRecordsByMember: getBirthdayCareRecords } = useBirthdayCareStore();
  const { 
    getRecordsByMember: getFollowUpRecords, 
    addRecord,
    completeRecord,
    confirmRevisit,
    getOverdueDays,
    hasRevisitedAfterFollowUp,
    getPendingFollowUps,
    getTodayFollowUps,
    getOverdueFollowUps
  } = useFollowUpStore();

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpType, setFollowUpType] = useState<FollowUpRecord['type']>('phone');
  const [followUpContent, setFollowUpContent] = useState('');
  const [followUpResult, setFollowUpResult] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [followUpOperator, setFollowUpOperator] = useState('店长');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingRecordId, setCompletingRecordId] = useState<string | null>(null);
  const [completeResult, setCompleteResult] = useState('');
  const [completeHasAppointment, setCompleteHasAppointment] = useState(false);
  const [completeAppointmentDate, setCompleteAppointmentDate] = useState('');

  const [followUpTab, setFollowUpTab] = useState<'today' | 'overdue' | 'done'>('today');
  const [followUpAssignee, setFollowUpAssignee] = useState('店长');
  const [followUpHasAppointment, setFollowUpHasAppointment] = useState(false);
  const [followUpAppointmentDate, setFollowUpAppointmentDate] = useState('');

  const member = getMember(id || '');
  const transactions = getMemberTransactions(id || '');
  const recharges = getMemberRecharges(id || '');
  const pointRecords = getMemberPointRecords(id || '');
  const birthdayCareRecords = getBirthdayCareRecords(id || '');
  const followUpRecords = getFollowUpRecords(id || '');

  const pendingFollowUps = followUpRecords.filter(
    r => r.status === 'pending' && r.nextFollowUpAt
  ).sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());

  const todayFollowUps = getTodayFollowUps().filter(r => r.memberId === id);
  const overdueFollowUps = getOverdueFollowUps().filter(r => r.memberId === id);

  const doneRecords = followUpRecords.filter(r => r.status === 'done');
  const sortedRecords = [...pendingFollowUps, ...doneRecords];

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

  const getActivityLevel = () => {
    if (daysSinceLastVisit === null) return { label: '新客户', level: 'new', color: 'violet' };
    if (daysSinceLastVisit <= 7) return { label: '非常活跃', level: 'active', color: 'emerald' };
    if (daysSinceLastVisit <= 30) return { label: '正常活跃', level: 'normal', color: 'blue' };
    if (daysSinceLastVisit <= 60) return { label: '需要关注', level: 'watch', color: 'amber' };
    if (daysSinceLastVisit <= 90) return { label: '需要唤醒', level: 'wake', color: 'orange' };
    return { label: '沉睡客户', level: 'sleep', color: 'red' };
  };

  const activity = getActivityLevel();

  const getFollowUpSuggestion = () => {
    if (daysSinceLastVisit === null) {
      return '新客户，3天后做首次回访，询问体验感受，邀请复购';
    }
    if (daysSinceLastVisit <= 7) {
      return '近期刚到店，可发送护理小贴士，维护客情';
    }
    if (daysSinceLastVisit <= 30) {
      return '正常周期，可提醒下次护理时间，推荐新品项目';
    }
    if (daysSinceLastVisit <= 60) {
      return '到店间隔略长，可微信问候近况，推送老客优惠';
    }
    if (daysSinceLastVisit <= 90) {
      return '有流失风险，建议电话回访，了解原因，针对性挽留';
    }
    return '沉睡客户，建议强力召回：生日券、专属优惠、新品体验';
  };

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

  const getTimelineColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'transaction':
        return { dot: 'bg-blue-500', line: 'bg-blue-100', bg: 'bg-blue-50', icon: 'text-blue-600' };
      case 'recharge':
        return { dot: 'bg-emerald-500', line: 'bg-emerald-100', bg: 'bg-emerald-50', icon: 'text-emerald-600' };
      case 'point':
        return { dot: 'bg-amber-500', line: 'bg-amber-100', bg: 'bg-amber-50', icon: 'text-amber-600' };
    }
  };

  const getTypeLabel = (type: TimelineItem['type']) => {
    switch (type) {
      case 'transaction': return '到店消费';
      case 'recharge': return '储值充值';
      case 'point': return '积分变动';
    }
  };

  const getTypeIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'transaction': return <Scissors className="w-4 h-4" />;
      case 'recharge': return <Banknote className="w-4 h-4" />;
      case 'point': {
        const p = pointRecords[0];
        return p?.change > 0 ? <PlusCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />;
      }
    }
  };

  const getFollowUpTypeLabel = (type: FollowUpRecord['type']) => {
    const labels = {
      phone: '电话回访',
      wechat: '微信沟通',
      sms: '短信通知',
      visit: '到店随访',
      other: '其他',
    };
    return labels[type];
  };

  const getFollowUpTypeColor = (type: FollowUpRecord['type']) => {
    const colors = {
      phone: 'bg-blue-50 text-blue-600',
      wechat: 'bg-emerald-50 text-emerald-600',
      sms: 'bg-amber-50 text-amber-600',
      visit: 'bg-violet-50 text-violet-600',
      other: 'bg-slate-50 text-slate-600',
    };
    return colors[type];
  };

  const getFollowUpTypeIcon = (type: FollowUpRecord['type']) => {
    const icons = {
      phone: <PhoneCall className="w-5 h-5" />,
      wechat: <MessageCircle className="w-5 h-5" />,
      sms: <Send className="w-5 h-5" />,
      visit: <Users className="w-5 h-5" />,
      other: <MoreHorizontal className="w-5 h-5" />,
    };
    return icons[type];
  };

  const getFollowUpTypeIconBg = (type: FollowUpRecord['type']) => {
    const colors = {
      phone: 'bg-blue-100 text-blue-600',
      wechat: 'bg-emerald-100 text-emerald-600',
      sms: 'bg-amber-100 text-amber-600',
      visit: 'bg-violet-100 text-violet-600',
      other: 'bg-slate-100 text-slate-600',
    };
    return colors[type];
  };

  const getLastTransactionSummary = () => {
    if (transactions.length === 0) return '暂无消费记录';
    const last = transactions[0];
    const services = last.items.map(i => i.serviceName).join('、');
    return `${formatDate(last.createdAt)} · ${services} · ${formatMoney(last.balanceUsed)}`;
  };

  const handleSubmitFollowUp = () => {
    if (!followUpContent.trim()) {
      alert('请填写回访内容');
      return;
    }
    addRecord(
      member.id,
      member.name,
      followUpType,
      followUpContent,
      followUpResult,
      nextFollowUpAt || null,
      followUpOperator,
      followUpAssignee || followUpOperator,
      followUpHasAppointment,
      followUpHasAppointment ? (followUpAppointmentDate || null) : null
    );
    setShowFollowUpModal(false);
    setFollowUpContent('');
    setFollowUpResult('');
    setNextFollowUpAt('');
    setFollowUpAssignee('店长');
    setFollowUpHasAppointment(false);
    setFollowUpAppointmentDate('');
  };

  const handleOpenCompleteModal = (recordId: string) => {
    setCompletingRecordId(recordId);
    setCompleteResult('');
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = () => {
    if (completingRecordId) {
      completeRecord(
        completingRecordId,
        completeResult || undefined,
        completeHasAppointment,
        completeHasAppointment ? (completeAppointmentDate || null) : null
      );
    }
    setShowCompleteModal(false);
    setCompletingRecordId(null);
    setCompleteResult('');
    setCompleteHasAppointment(false);
    setCompleteAppointmentDate('');
  };

  const activityColors: Record<string, string> = {
    new: 'text-violet-700 bg-violet-50 border-violet-100',
    active: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    normal: 'text-blue-700 bg-blue-50 border-blue-100',
    watch: 'text-amber-700 bg-amber-50 border-amber-100',
    wake: 'text-orange-700 bg-orange-50 border-orange-100',
    sleep: 'text-red-700 bg-red-50 border-red-100',
  };

  const isHighRisk = daysSinceLastVisit !== null && daysSinceLastVisit > 30;

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

      <div className={`rounded-2xl p-5 border ${
        isHighRisk 
          ? 'bg-orange-50 border-orange-200' 
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              isHighRisk ? 'bg-orange-100' : 'bg-emerald-100'
            }`}>
              {isHighRisk 
                ? <AlertTriangle className={`w-6 h-6 ${isHighRisk ? 'text-orange-600' : 'text-emerald-600'}`} />
                : <Heart className={`w-6 h-6 text-emerald-600`} />
              }
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">
                {isHighRisk ? '⚠️ 有流失风险，建议尽快跟进' : '✅ 客户状态良好'}
              </h3>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${activityColors[activity.level]}`}>
                  {activity.label}
                </span>
                <span className="text-sm text-slate-600">
                  {lastVisit 
                    ? `上次到店：${formatDate(lastVisit)}（${daysSinceLastVisit} 天前）` 
                    : '还未到店消费'}
                </span>
              </div>
              {lastVisit && (
                <p className="text-sm text-slate-500 mt-2">
                  上次消费：{getLastTransactionSummary()}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant={isHighRisk ? 'danger' : 'success'}
            onClick={() => { setShowFollowUpModal(true); setFollowUpAssignee(followUpOperator); }}
          >
            <Plus className="w-4 h-4" />
            登记回访
          </Button>
        </div>
        
        {isHighRisk && (
          <div className={`mt-4 pt-4 border-t ${isHighRisk ? 'border-orange-200' : 'border-emerald-200'}`}>
            <p className="text-sm font-medium text-slate-700 mb-1">💡 跟进建议</p>
            <p className="text-sm text-slate-600">{getFollowUpSuggestion()}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-500" />
            客户画像
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">上次到店</p>
                {lastVisit ? (
                  <>
                    <p className="font-semibold text-slate-800 mt-0.5">{formatDate(lastVisit)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {daysSinceLastVisit === 0 ? '今天刚来过' : `${daysSinceLastVisit} 天前`}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-slate-400 mt-0.5">还没来过</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl bg-${activity.color}-50`}>
                <TrendingUp className={`w-4 h-4 text-${activity.color}-600`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">活跃等级</p>
                <p className={`font-semibold text-${activity.color}-600 mt-0.5`}>{activity.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  累计充值 {formatMoney(member.totalRecharge)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-pink-50">
                <Cake className="w-4 h-4 text-pink-600" />
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

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <MessageSquare className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">回访记录</p>
                {followUpRecords.length > 0 ? (
                  <>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      累计 {followUpRecords.length} 次
                      {pendingFollowUps.length > 0 && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          {pendingFollowUps.length} 待办
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      最近：{formatDate(followUpRecords[0].createdAt)}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-slate-400 mt-0.5">暂无回访记录</p>
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
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            回访待办
          </h3>
          <Button variant="secondary" size="sm" onClick={() => { setShowFollowUpModal(true); setFollowUpAssignee(followUpOperator); }}>
            <Plus className="w-4 h-4" />
            新增回访
          </Button>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
          <button
            onClick={() => setFollowUpTab('today')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
              followUpTab === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            今天要联系
            {todayFollowUps.length > 0 && (
              <span className="ml-1.5 bg-blue-500 text-white text-xs w-5 h-5 inline-flex items-center justify-center rounded-full">
                {todayFollowUps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFollowUpTab('overdue')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
              followUpTab === 'overdue' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            已超期
            {overdueFollowUps.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs w-5 h-5 inline-flex items-center justify-center rounded-full">
                {overdueFollowUps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFollowUpTab('done')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
              followUpTab === 'done' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
            已完成
            {doneRecords.length > 0 && (
              <span className="ml-1.5 bg-slate-400 text-white text-xs w-5 h-5 inline-flex items-center justify-center rounded-full">
                {doneRecords.length}
              </span>
            )}
          </button>
        </div>

        {followUpTab === 'today' && (
          todayFollowUps.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">今天没有待联系的客户</p>
              <p className="text-sm mt-1">今日回访任务已清空</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayFollowUps.map(record => (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border bg-blue-50 border-blue-200 hover:bg-blue-100/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${getFollowUpTypeIconBg(record.type)}`}>
                        {getFollowUpTypeIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getFollowUpTypeColor(record.type)}`}>
                            {getFollowUpTypeLabel(record.type)}
                          </span>
                          <span className="text-xs text-slate-500">
                            创建：{formatDate(record.createdAt)} · {record.operator}
                            {record.assignee && record.assignee !== record.operator && (
                              <span className="text-blue-600"> · 负责人：{record.assignee}</span>
                            )}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-1">回访内容</p>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{record.content}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-xs flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            今天需联系
                          </span>
                          {record.hasAppointment && record.appointmentDate && (
                            <span className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              📅 已预约 {formatDate(record.appointmentDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenCompleteModal(record.id)}
                      className="flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      标记完成
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {followUpTab === 'overdue' && (
          overdueFollowUps.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">没有超期的回访</p>
              <p className="text-sm mt-1">所有回访都在按时推进</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueFollowUps.map(record => {
                const overdueDays = getOverdueDays(record);
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border bg-red-50 border-red-200 hover:bg-red-100/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${getFollowUpTypeIconBg(record.type)}`}>
                          {getFollowUpTypeIcon(record.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getFollowUpTypeColor(record.type)}`}>
                              {getFollowUpTypeLabel(record.type)}
                            </span>
                            <span className="text-xs text-slate-500">
                              创建：{formatDate(record.createdAt)} · {record.operator}
                              {record.assignee && record.assignee !== record.operator && (
                                <span className="text-red-600"> · 负责人：{record.assignee}</span>
                              )}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mb-1">回访内容</p>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{record.content}</p>
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs flex items-center gap-1 text-slate-600">
                              <Calendar className="w-3.5 h-3.5" />
                              截止日期：{formatDate(record.nextFollowUpAt!)}
                            </span>
                            <span className="text-xs flex items-center gap-1 text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5" />
                              已拖延 {overdueDays} 天
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleOpenCompleteModal(record.id)}
                        className="flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                        标记完成
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {followUpTab === 'done' && (
          doneRecords.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">暂无已完成的回访</p>
              <p className="text-sm mt-1">完成回访后会在这里显示</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doneRecords.map(record => {
                const revisitInfo = hasRevisitedAfterFollowUp(record.id);
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${getFollowUpTypeIconBg(record.type)}`}>
                          {getFollowUpTypeIcon(record.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getFollowUpTypeColor(record.type)}`}>
                              {getFollowUpTypeLabel(record.type)}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              已完成
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(record.completedAt || record.createdAt)} · {record.operator}
                              {record.assignee && record.assignee !== record.operator && (
                                <span> · 负责人：{record.assignee}</span>
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{record.content}</p>
                          {record.result && (
                            <p className="text-sm text-slate-500 mb-2">结果：{record.result}</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {record.hasAppointment && record.appointmentDate && (
                              <span className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                📅 已预约 {formatDate(record.appointmentDate)}
                              </span>
                            )}
                            {record.revisitConfirmedAt ? (
                              <span className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                ✅ 已到店
                              </span>
                            ) : revisitInfo?.revisited ? (
                              <span className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                ✅ 已回店
                              </span>
                            ) : (
                              <span className="text-xs flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" />
                                未回店
                              </span>
                            )}
                            {record.hasAppointment && !record.revisitConfirmedAt && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => confirmRevisit(record.id)}
                                className="text-xs"
                              >
                                <Check className="w-3 h-3" />
                                确认到店
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            回访记录
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              待办 {pendingFollowUps.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              已完成 {doneRecords.length}
            </span>
          </div>
        </div>

        {followUpRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <PhoneCall className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">暂无回访记录</p>
            <p className="text-sm mt-1">点击右上角登记第一次回访</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRecords.slice(0, 10).map(record => {
              const isPending = record.status === 'pending';
              const overdueDays = isPending ? getOverdueDays(record) : 0;
              const isOverdue = isPending && overdueDays > 0;
              const revisitInfo = !isPending ? hasRevisitedAfterFollowUp(record.id) : null;
              return (
                <div 
                  key={record.id} 
                  className={`p-4 rounded-xl hover:bg-slate-100 transition-colors ${
                    isPending ? 'bg-amber-50/50 border border-amber-100' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getFollowUpTypeColor(record.type)}`}>
                        {getFollowUpTypeLabel(record.type)}
                      </span>
                      {isPending ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          isOverdue 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {isOverdue ? `已拖延 ${overdueDays} 天` : '待办中'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已完成
                        </span>
                      )}
                      <span className="text-xs text-slate-400 mt-1">
                        {formatDateTime(isPending ? record.createdAt : (record.completedAt || record.createdAt))} · {record.operator}
                      </span>
                    </div>
                    {isPending && record.nextFollowUpAt && (
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.nextFollowUpAt)}
                      </span>
                    )}
                    {!isPending && (
                      <div className="flex items-center gap-2">
                        {record.hasAppointment && record.appointmentDate && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-600">
                            📅 已预约 {formatDate(record.appointmentDate)}
                          </span>
                        )}
                        {record.revisitConfirmedAt ? (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-600">
                            ✅ 已到店
                          </span>
                        ) : revisitInfo?.revisited ? (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-600">
                            ✅ 已回店
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-slate-100 text-slate-400">
                            <XCircle className="w-3 h-3" />
                            未回店
                          </span>
                        )}
                        {record.hasAppointment && !record.revisitConfirmedAt && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => confirmRevisit(record.id)}
                            className="text-xs h-6 px-2"
                          >
                            <Check className="w-3 h-3" />
                            确认到店
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-1">回访内容</p>
                    <p className="text-sm text-slate-600">{record.content}</p>
                  </div>
                  {record.result && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-1">回访结果</p>
                      <p className="text-sm text-slate-600">{record.result}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {followUpRecords.length > 10 && (
              <p className="text-center text-sm text-slate-400 pt-2">
                仅显示最近 10 条，共 {followUpRecords.length} 条记录
              </p>
            )}
          </div>
        )}
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
                return (
                  <div key={item.id} className="relative">
                    <div className={`absolute -left-[30px] top-1 w-8 h-8 rounded-full ${colors.dot} ring-4 ring-white flex items-center justify-center text-white z-10`}>
                      {getTypeIcon(item.type)}
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

      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title="登记回访记录"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">回访方式</label>
            <div className="grid grid-cols-5 gap-2">
              {(['phone', 'wechat', 'sms', 'visit', 'other'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFollowUpType(type)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    followUpType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getFollowUpTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">回访内容</label>
            <textarea
              value={followUpContent}
              onChange={(e) => setFollowUpContent(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="请描述回访的主要内容，例如：询问对上次发型是否满意、提醒护理时间等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">回访结果</label>
            <textarea
              value={followUpResult}
              onChange={(e) => setFollowUpResult(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="客户反馈、是否预约、成交情况等"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                下次回访
                <span className="ml-1 text-xs text-slate-400 font-normal">
                  （不填则标记为已完成）
                </span>
              </label>
              <input
                type="date"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">回访人</label>
              <input
                type="text"
                value={followUpOperator}
                onChange={(e) => setFollowUpOperator(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="操作人姓名"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">负责人</label>
              <input
                type="text"
                value={followUpAssignee}
                onChange={(e) => setFollowUpAssignee(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="默认与回访人相同"
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer py-2.5">
                <input
                  type="checkbox"
                  checked={followUpHasAppointment}
                  onChange={(e) => {
                    setFollowUpHasAppointment(e.target.checked);
                    if (!e.target.checked) setFollowUpAppointmentDate('');
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">是否有预约</span>
              </label>
            </div>
          </div>

          {followUpHasAppointment && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">预约到店日期</label>
              <input
                type="date"
                value={followUpAppointmentDate}
                onChange={(e) => setFollowUpAppointmentDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowFollowUpModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSubmitFollowUp}>
              <CheckCircle className="w-4 h-4" />
              保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="标记回访完成"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">回访结果（可选）</label>
            <textarea
              value={completeResult}
              onChange={(e) => setCompleteResult(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="补充本次回访的结果，如客户反馈、预约情况、成交情况等"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={completeHasAppointment}
                onChange={(e) => {
                  setCompleteHasAppointment(e.target.checked);
                  if (!e.target.checked) setCompleteAppointmentDate('');
                }}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">是否有预约</span>
            </label>
          </div>

          {completeHasAppointment && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">预约到店日期</label>
              <input
                type="date"
                value={completeAppointmentDate}
                onChange={(e) => setCompleteAppointmentDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCompleteModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleConfirmComplete}>
              <Check className="w-4 h-4" />
              确认完成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
