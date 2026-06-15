import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Wallet, Gift, Check, Sparkles } from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/useMemberStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatMoney, formatDateTime } from '@/utils/date';
import type { Member } from '@/types';

export default function Recharge() {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get('memberId');

  const { members, getMember } = useMemberStore();
  const { settings, calculateBonusPoints } = useSettingsStore();
  const { recharges, createRecharge, loadData } = useTransactionStore();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [amount, setAmount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastRecharge, setLastRecharge] = useState<{ amount: number; bonus: number } | null>(null);

  useEffect(() => {
    loadData();
    if (memberId) {
      const member = getMember(memberId);
      if (member) setSelectedMember(member);
    }
  }, [memberId, getMember, loadData]);

  const filteredMembers = useMemo(() => {
    if (!searchKeyword.trim()) return members;
    const lower = searchKeyword.toLowerCase();
    return members.filter(
      m => m.name.toLowerCase().includes(lower) || m.phone.includes(searchKeyword)
    );
  }, [members, searchKeyword]);

  const bonusPoints = useMemo(() => calculateBonusPoints(amount), [amount, calculateBonusPoints]);

  const recentRecharges = useMemo(() => 
    [...recharges]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    [recharges]
  );

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberPicker(false);
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleSubmit = () => {
    if (!selectedMember) {
      alert('请先选择会员');
      return;
    }
    if (amount <= 0) {
      alert('请输入充值金额');
      return;
    }

    createRecharge(selectedMember.id, amount, bonusPoints);
    setLastRecharge({ amount, bonus: bonusPoints });
    setShowSuccess(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setAmount(0);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">充值管理</h1>
        <p className="text-slate-500 mt-1">会员储值充值，充值送积分</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">选择会员</h3>
            {selectedMember ? (
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedMember.name} />
                  <div>
                    <p className="font-semibold text-slate-800">{selectedMember.name}</p>
                    <p className="text-sm text-slate-500">{selectedMember.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">当前余额</p>
                  <p className="font-bold text-emerald-600">{formatMoney(selectedMember.balance)}</p>
                  <p className="text-xs text-amber-500">{selectedMember.points} 积分</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowMemberPicker(true)}
                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                点击选择会员
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              充值金额
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {quickAmounts.map((val) => {
                const bonus = calculateBonusPoints(val);
                const isSelected = amount === val;
                return (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-100 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xl font-bold text-slate-800">{formatMoney(val)}</p>
                    {bonus > 0 && (
                      <p className="text-xs text-amber-500 mt-1 flex items-center justify-center gap-1">
                        <Gift className="w-3 h-3" />
                        送{bonus}积分
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">自定义金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">¥</span>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 text-xl font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="请输入金额"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {bonusPoints > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl flex items-center justify-between">
                <span className="text-amber-700 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  赠送积分
                </span>
                <span className="text-xl font-bold text-amber-600">+{bonusPoints}</span>
              </div>
            )}

            <Button 
              className="w-full mt-6 py-3 text-base"
              size="lg"
              variant="success"
              onClick={handleSubmit}
              disabled={!selectedMember || amount <= 0}
            >
              <Check className="w-5 h-5" />
              确认充值
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">充值规则</h3>
            <div className="grid grid-cols-3 gap-3">
              {settings.rechargeRules.map((rule, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-amber-700">充{rule.amount}</p>
                  <p className="text-sm text-amber-600 mt-1">送{rule.bonusPoints}积分</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-4">最近充值</h3>
          {recentRecharges.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无充值记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecharges.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.memberName} size="sm" />
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{r.memberName}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">+{formatMoney(r.amount)}</p>
                    {r.bonusPoints > 0 && (
                      <p className="text-xs text-amber-500">+{r.bonusPoints}积分</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        title="选择会员"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索会员姓名或手机号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2">
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
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600">{formatMoney(member.balance)}</p>
                    <p className="text-xs text-amber-500">{member.points} 积分</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        title="充值成功"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-slate-800 mb-1">充值成功！</p>
          <p className="text-slate-500">
            {selectedMember?.name} 充值 {formatMoney(lastRecharge?.amount || 0)}
          </p>
          {lastRecharge?.bonus ? (
            <p className="text-amber-600 mt-2 flex items-center justify-center gap-1">
              <Gift className="w-4 h-4" />
              赠送 {lastRecharge.bonus} 积分
            </p>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleCloseSuccess}>
              完成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
