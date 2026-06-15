import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Gift, 
  Phone, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Cake,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Package,
  FileText
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/useMemberStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useBirthdayCareStore } from '@/store/useBirthdayCareStore';
import { getDaysUntilBirthday, getBirthdayThisYear, formatMoney, formatDateTime } from '@/utils/date';
import type { Member, BirthdayCareRecord } from '@/types';

interface FormData {
  couponType: string;
  couponValue: string;
  notes: string;
}

export default function Birthday() {
  const navigate = useNavigate();
  const { members } = useMemberStore();
  const { settings } = useSettingsStore();
  const { addPointRecord } = useTransactionStore();
  const { 
    records, 
    loadRecords, 
    createRecord, 
    updateRecord, 
    updateStatus, 
    deleteRecord,
    getRecordByMemberYear 
  } = useBirthdayCareStore();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCareModal, setShowCareModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingRecord, setEditingRecord] = useState<BirthdayCareRecord | null>(null);
  const [formData, setFormData] = useState<FormData>({
    couponType: '生日优惠券',
    couponValue: '',
    notes: '',
  });
  const [viewingRecord, setViewingRecord] = useState<BirthdayCareRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const membersWithBirthday = useMemo(() => {
    return members
      .filter(m => m.birthday !== null)
      .map(m => ({
        ...m,
        daysUntil: getDaysUntilBirthday(m.birthday),
        birthdayThisYear: getBirthdayThisYear(m.birthday),
        careRecord: getRecordByMemberYear(m.id, currentYear),
      }))
      .filter(m => {
        if (!searchKeyword.trim()) return true;
        const lower = searchKeyword.toLowerCase();
        return m.name.toLowerCase().includes(lower) || m.phone.includes(searchKeyword);
      })
      .sort((a, b) => (a.daysUntil || 999) - (b.daysUntil || 999));
  }, [members, searchKeyword, currentYear, getRecordByMemberYear, records]);

  const monthMembers = useMemo(() => {
    return membersWithBirthday.filter(m => {
      if (!m.birthday) return false;
      const bday = new Date(m.birthday);
      return bday.getMonth() + 1 === currentMonth;
    });
  }, [membersWithBirthday, currentMonth]);

  const upcomingMembers = useMemo(() => {
    return membersWithBirthday.filter(m => 
      m.daysUntil !== null && m.daysUntil <= 30
    );
  }, [membersWithBirthday]);

  const todayMembers = useMemo(() => {
    return membersWithBirthday.filter(m => m.daysUntil === 0);
  }, [membersWithBirthday]);

  const pendingCareCount = useMemo(() => {
    return monthMembers.filter(m => !m.careRecord).length;
  }, [monthMembers]);

  const registeredCareCount = useMemo(() => {
    return monthMembers.filter(m => !!m.careRecord).length;
  }, [monthMembers]);

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

  const handleSendGift = (member: Member) => {
    setSelectedMember(member);
    setShowGiftModal(true);
  };

  const confirmSendGift = () => {
    if (!selectedMember) return;
    const bonusPoints = settings.birthdayBonusPoints;
    addPointRecord(selectedMember.id, bonusPoints, 'birthday', `生日赠送${bonusPoints}积分`);
    setShowGiftModal(false);
    alert(`已为 ${selectedMember.name} 赠送 ${bonusPoints} 生日积分！`);
  };

  const handleOpenCareForm = (member: Member, existingRecord?: BirthdayCareRecord) => {
    setSelectedMember(member);
    if (existingRecord) {
      setEditingRecord(existingRecord);
      setFormData({
        couponType: existingRecord.couponType,
        couponValue: existingRecord.couponValue,
        notes: existingRecord.notes,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        couponType: '生日优惠券',
        couponValue: '',
        notes: '',
      });
    }
    setShowCareModal(true);
  };

  const handleSubmitCare = () => {
    if (!selectedMember) return;
    if (!formData.couponType.trim()) {
      alert('请填写优惠类型');
      return;
    }
    if (!formData.couponValue.trim()) {
      alert('请填写优惠内容');
      return;
    }

    if (editingRecord) {
      updateRecord(editingRecord.id, {
        couponType: formData.couponType,
        couponValue: formData.couponValue,
        notes: formData.notes,
      });
    } else {
      createRecord(
        selectedMember.id,
        selectedMember.name,
        currentYear,
        formData.couponType,
        formData.couponValue,
        formData.notes
      );
    }
    setShowCareModal(false);
  };

  const handleStatusChange = (record: BirthdayCareRecord, status: BirthdayCareRecord['status']) => {
    updateStatus(record.id, status);
  };

  const handleDeleteRecord = (record: BirthdayCareRecord) => {
    if (confirm('确定删除这条关怀记录吗？')) {
      deleteRecord(record.id);
      setViewingRecord(null);
    }
  };

  const statusConfig = {
    pending: { label: '待发放', color: 'bg-amber-100 text-amber-700', icon: Clock },
    sent: { label: '已发放', color: 'bg-blue-100 text-blue-700', icon: Package },
    used: { label: '已使用', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const currentYearNow = new Date().getFullYear();

  const couponTypeOptions = ['生日优惠券', '免费洗发券', '剪发折扣券', '烫染折扣券', '赠送项目', '其他'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">生日提醒</h1>
          <p className="text-slate-500 mt-1">管理会员生日，登记发放生日福利</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索会员..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">今天生日</p>
              <p className="text-3xl font-bold">{todayMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">30天内生日</p>
              <p className="text-3xl font-bold">{upcomingMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">本月生日</p>
              <p className="text-3xl font-bold">{monthMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">待登记福利</p>
              <p className="text-3xl font-bold">{pendingCareCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">已登记福利</p>
              <p className="text-3xl font-bold">{registeredCareCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-500" />
              生日日历
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <span className="font-semibold text-slate-700 min-w-[100px] text-center">
                {currentYear}年 {monthNames[currentMonth - 1]}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {monthMembers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>本月没有过生日的会员</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthMembers.map((member) => {
                const bday = new Date(member.birthday!);
                const day = bday.getDate();
                const careRecord = member.careRecord;
                const StatusIcon = careRecord ? statusConfig[careRecord.status].icon : null;
                return (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl hover:bg-pink-50/50 transition-colors border border-slate-50 hover:border-pink-100"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-pink-600">{day}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-800">{member.name}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.daysUntil !== null && member.daysUntil <= 7 && (
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            member.daysUntil === 0 
                              ? 'bg-red-500 text-white' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {member.daysUntil === 0 ? '今天生日！' : `${member.daysUntil}天后`}
                          </span>
                        )}
                        {careRecord ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${statusConfig[careRecord.status].color}`}>
                              {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                              {statusConfig[careRecord.status].label}
                            </span>
                            <button
                              onClick={() => setViewingRecord(careRecord)}
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                              title="查看详情"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenCareForm(member, careRecord)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => handleOpenCareForm(member)}>
                            <Plus className="w-4 h-4" />
                            登记福利
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleSendGift(member)}
                        >
                          <Gift className="w-4 h-4" />
                          送积分
                        </Button>
                      </div>
                    </div>
                    {careRecord && (
                      <div className="mt-3 pl-16 pr-4">
                        <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium text-slate-700">{careRecord.couponType}</span>
                            <span className="text-slate-500">：</span>
                            <span className="text-blue-600">{careRecord.couponValue}</span>
                          </div>
                          {careRecord.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleStatusChange(careRecord, 'sent')}
                              >
                                标记已发放
                              </Button>
                            </div>
                          )}
                          {careRecord.status === 'sent' && (
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleStatusChange(careRecord, 'used')}
                            >
                              标记已使用
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
          <div>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              即将到来 ({upcomingMembers.length})
            </h3>
            {upcomingMembers.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">近期没有生日</p>
            ) : (
              <div className="space-y-3">
                {upcomingMembers.slice(0, 10).map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-50 to-amber-50 cursor-pointer hover:shadow-sm transition-all"
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.birthdayThisYear}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      member.daysUntil === 0 
                        ? 'bg-red-500 text-white' 
                        : member.daysUntil! <= 3 
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}>
                      {member.daysUntil === 0 ? '今天' : `${member.daysUntil}天`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 mb-3">生日福利规则</h4>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-700">
                生日当天赠送 
                <span className="font-bold text-lg mx-1">{settings.birthdayBonusPoints}</span>
                积分
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              可在系统设置中调整赠送积分数量
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        title="赠送生日积分"
        size="sm"
      >
        {selectedMember && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
              <Cake className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{selectedMember.name}</p>
              <p className="text-sm text-slate-500">生日快乐！</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-700">将赠送生日积分</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {settings.birthdayBonusPoints} 积分
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowGiftModal(false)}>
                取消
              </Button>
              <Button className="flex-1" variant="success" onClick={confirmSendGift}>
                确认赠送
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCareModal}
        onClose={() => setShowCareModal(false)}
        title={editingRecord ? '编辑生日福利' : '登记生日福利'}
        size="md"
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <Avatar name={selectedMember.name} size="md" />
              <div>
                <p className="font-medium text-slate-800">{selectedMember.name}</p>
                <p className="text-sm text-slate-500">
                  {currentYear}年生日福利 · {selectedMember.birthday}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">福利类型</label>
              <select
                value={formData.couponType}
                onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {couponTypeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">优惠内容</label>
              <input
                type="text"
                value={formData.couponValue}
                onChange={(e) => setFormData({ ...formData, couponValue: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="例如：88折优惠券、免费洗发一次、赠送50元抵扣券等"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="例如：微信已发、老顾客多送一点、还需额外送护理等"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCareModal(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleSubmitCare}>
                {editingRecord ? '保存修改' : '确认登记'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={viewingRecord !== null}
        onClose={() => setViewingRecord(null)}
        title="生日福利详情"
        size="md"
      >
        {viewingRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <Avatar name={viewingRecord.memberName} size="md" />
              <div className="flex-1">
                <p className="font-medium text-slate-800">{viewingRecord.memberName}</p>
                <p className="text-sm text-slate-500">{viewingRecord.year}年生日福利</p>
              </div>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5 ${statusConfig[viewingRecord.status].color}`}>
                {(() => { const Icon = statusConfig[viewingRecord.status].icon; return <Icon className="w-4 h-4" />; })()}
                {statusConfig[viewingRecord.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">福利类型</p>
                <p className="font-medium text-slate-800">{viewingRecord.couponType}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">优惠内容</p>
                <p className="font-medium text-blue-600">{viewingRecord.couponValue}</p>
              </div>
            </div>

            {(viewingRecord.sentAt || viewingRecord.usedAt) && (
              <div className="grid grid-cols-2 gap-4">
                {viewingRecord.sentAt && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 mb-1">发放时间</p>
                    <p className="font-medium text-blue-800">{formatDateTime(viewingRecord.sentAt)}</p>
                  </div>
                )}
                {viewingRecord.usedAt && (
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-xs text-emerald-600 mb-1">使用时间</p>
                    <p className="font-medium text-emerald-800">{formatDateTime(viewingRecord.usedAt)}</p>
                  </div>
                )}
              </div>
            )}

            {viewingRecord.notes && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">备注</p>
                <p className="text-sm text-slate-700">{viewingRecord.notes}</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400">创建于 {formatDateTime(viewingRecord.createdAt)}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="danger" 
                className="mr-auto"
                onClick={() => handleDeleteRecord(viewingRecord)}
              >
                <Trash2 className="w-4 h-4" />
                删除记录
              </Button>
              <Button variant="secondary" onClick={() => setViewingRecord(null)}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
