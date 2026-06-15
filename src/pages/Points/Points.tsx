import { useState, useMemo } from 'react';
import { Search, Gift, Plus, Minus, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatDateTime } from '@/utils/date';
import type { Member } from '@/types';

export default function Points() {
  const { members } = useMemberStore();
  const { pointRecords, addPointRecord, loadData } = useTransactionStore();

  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [memberSearchKeyword, setMemberSearchKeyword] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'sub'>('add');
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');

  const filteredMembers = useMemo(() => {
    if (!memberSearchKeyword.trim()) return members;
    const lower = memberSearchKeyword.toLowerCase();
    return members.filter(
      m => m.name.toLowerCase().includes(lower) || m.phone.includes(memberSearchKeyword)
    );
  }, [members, memberSearchKeyword]);

  const allRecords = useMemo(() => 
    [...pointRecords]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(r => {
        if (!searchKeyword.trim()) return true;
        const lower = searchKeyword.toLowerCase();
        return r.memberName.toLowerCase().includes(lower) || r.reason.toLowerCase().includes(lower);
      })
      .slice(0, 50),
    [pointRecords, searchKeyword]
  );

  const totalPointsEarned = useMemo(() => 
    pointRecords.filter(r => r.change > 0).reduce((sum, r) => sum + r.change, 0),
    [pointRecords]
  );

  const totalPointsSpent = useMemo(() => 
    pointRecords.filter(r => r.change < 0).reduce((sum, r) => sum + Math.abs(r.change), 0),
    [pointRecords]
  );

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberPicker(false);
  };

  const openAdjustModal = (type: 'add' | 'sub') => {
    setAdjustType(type);
    setPoints(0);
    setReason('');
    setSelectedMember(null);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!selectedMember) {
      alert('请选择会员');
      return;
    }
    if (points <= 0) {
      alert('请输入积分数量');
      return;
    }

    const change = adjustType === 'add' ? points : -points;
    const type = adjustType === 'add' ? 'adjust_add' : 'adjust_sub';
    const reasonText = reason || (adjustType === 'add' ? '手动增加积分' : '手动扣减积分');

    addPointRecord(selectedMember.id, change, type, reasonText);

    setShowModal(false);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      earn: '消费获得',
      spend: '消费抵扣',
      adjust_add: '手动增加',
      adjust_sub: '手动扣减',
      birthday: '生日赠送',
      recharge: '充值赠送',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      earn: 'text-emerald-600 bg-emerald-50',
      spend: 'text-red-500 bg-red-50',
      adjust_add: 'text-blue-600 bg-blue-50',
      adjust_sub: 'text-orange-500 bg-orange-50',
      birthday: 'text-pink-600 bg-pink-50',
      recharge: 'text-amber-600 bg-amber-50',
    };
    return colors[type] || 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">积分管理</h1>
          <p className="text-slate-500 mt-1">手动调整积分，查看积分变动记录</p>
        </div>
        <div className="flex gap-3">
          <Button variant="success" onClick={() => openAdjustModal('add')}>
            <Plus className="w-4 h-4" />
            增加积分
          </Button>
          <Button variant="danger" onClick={() => openAdjustModal('sub')}>
            <Minus className="w-4 h-4" />
            扣减积分
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Gift className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">会员总积分</p>
              <p className="text-2xl font-bold text-slate-800">
                {members.reduce((sum, m) => sum + m.points, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">累计获得</p>
              <p className="text-2xl font-bold text-emerald-600">+{totalPointsEarned.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">累计消耗</p>
              <p className="text-2xl font-bold text-red-500">-{totalPointsSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <SlidersHorizontal className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">变动记录</p>
              <p className="text-2xl font-bold text-blue-600">{pointRecords.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800">积分变动记录</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索会员或原因..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 rounded-lg border-0 text-sm focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        {allRecords.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无积分变动记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 rounded-l-xl">会员</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">类型</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">变动</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">原因</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 rounded-r-xl">时间</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={record.memberName} size="sm" />
                        <span className="font-medium text-slate-700">{record.memberName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(record.type)}`}>
                        {getTypeLabel(record.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${record.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {record.change > 0 ? '+' : ''}{record.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{record.reason}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{formatDateTime(record.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={adjustType === 'add' ? '增加积分' : '扣减积分'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择会员</label>
            {selectedMember ? (
              <div 
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setShowMemberPicker(true)}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={selectedMember.name} size="sm" />
                  <div>
                    <p className="font-medium text-slate-700">{selectedMember.name}</p>
                    <p className="text-xs text-slate-500">{selectedMember.phone}</p>
                  </div>
                </div>
                <span className="text-sm text-amber-600 font-medium">
                  当前 {selectedMember.points} 积分
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowMemberPicker(true)}
                className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
              >
                点击选择会员
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">积分数量</label>
            <input
              type="number"
              value={points || ''}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入积分数量"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">原因</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder={adjustType === 'add' ? '例如：活动赠送、补偿积分等' : '例如：兑换礼品、积分过期等'}
            />
          </div>

          {selectedMember && points > 0 && (
            <div className={`p-4 rounded-xl ${adjustType === 'add' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className="text-sm">
                调整后积分：
                <span className={`font-bold text-lg ml-2 ${adjustType === 'add' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {adjustType === 'add' ? selectedMember.points + points : selectedMember.points - points}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button 
              className="flex-1" 
              variant={adjustType === 'add' ? 'success' : 'danger'}
              onClick={handleSubmit}
            >
              确认{adjustType === 'add' ? '增加' : '扣减'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        title="选择会员"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索会员姓名或手机号..."
              value={memberSearchKeyword}
              onChange={(e) => setMemberSearchKeyword(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-center py-8 text-slate-400">没有找到匹配的会员</p>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-800">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm text-amber-500 font-medium">{member.points} 积分</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
