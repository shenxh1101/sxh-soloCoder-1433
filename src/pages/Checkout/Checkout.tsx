import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Scissors, 
  Gift, 
  Wallet, 
  Minus, 
  Plus, 
  X, 
  Check,
  CreditCard,
  Sparkles
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/useMemberStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatMoney } from '@/utils/date';
import type { Member, TransactionItem, ServiceItem } from '@/types';

interface CartItem extends TransactionItem {
  service: ServiceItem;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get('memberId');
  
  const { members, getMember } = useMemberStore();
  const { settings } = useSettingsStore();
  const { createTransaction } = useTransactionStore();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (memberId) {
      const member = getMember(memberId);
      if (member) setSelectedMember(member);
    }
  }, [memberId, getMember]);

  const filteredMembers = useMemo(() => {
    if (!searchKeyword.trim()) return members;
    const lower = searchKeyword.toLowerCase();
    return members.filter(
      m => m.name.toLowerCase().includes(lower) || m.phone.includes(searchKeyword)
    );
  }, [members, searchKeyword]);

  const activeServices = useMemo(() => 
    settings.services.filter(s => s.isActive),
    [settings.services]
  );

  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const pointsValue = useMemo(() => 
    pointsToUse * settings.pointValue,
    [pointsToUse, settings.pointValue]
  );

  const balanceToUse = useMemo(() => 
    Math.max(0, subtotal - pointsValue),
    [subtotal, pointsValue]
  );

  const pointsToEarn = useMemo(() => 
    Math.floor(balanceToUse * settings.pointsPerYuan),
    [balanceToUse, settings.pointsPerYuan]
  );

  const maxPointsUsable = useMemo(() => {
    if (!selectedMember) return 0;
    const maxByPoints = selectedMember.points;
    const maxByAmount = Math.floor(subtotal / settings.pointValue);
    return Math.min(maxByPoints, maxByAmount);
  }, [selectedMember, subtotal, settings.pointValue]);

  const addService = (service: ServiceItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.serviceId === service.id);
      if (existing) {
        return prev.map(item =>
          item.serviceId === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        quantity: 1,
        service,
      }];
    });
  };

  const removeService = (serviceId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.serviceId === serviceId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.serviceId === serviceId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.serviceId !== serviceId);
    });
  };

  const deleteService = (serviceId: string) => {
    setCart(prev => prev.filter(item => item.serviceId !== serviceId));
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberPicker(false);
    setUsePoints(false);
    setPointsToUse(0);
  };

  const handleUsePointsToggle = () => {
    if (!selectedMember) return;
    if (!usePoints) {
      setUsePoints(true);
      setPointsToUse(Math.min(maxPointsUsable, selectedMember.points));
    } else {
      setUsePoints(false);
      setPointsToUse(0);
    }
  };

  const handleSubmit = () => {
    if (!selectedMember) {
      alert('请先选择会员');
      return;
    }
    if (cart.length === 0) {
      alert('请选择服务项目');
      return;
    }
    if (balanceToUse > selectedMember.balance) {
      alert('储值余额不足');
      return;
    }

    const items: TransactionItem[] = cart.map(item => ({
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      price: item.price,
      quantity: item.quantity,
    }));

    createTransaction(
      selectedMember.id,
      items,
      balanceToUse,
      pointsToUse
    );

    setShowSuccess(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setCart([]);
    setSelectedMember(null);
    setUsePoints(false);
    setPointsToUse(0);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      shampoo: '洗发',
      haircut: '剪发',
      perm_dye: '烫染',
      other: '其他',
    };
    return labels[category] || category;
  };

  const servicesByCategory = useMemo(() => {
    const groups: Record<string, ServiceItem[]> = {};
    activeServices.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [activeServices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">消费收银</h1>
        <p className="text-slate-500 mt-1">选择服务项目，快速结算</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">选择会员</h3>
            {selectedMember ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedMember.name} />
                  <div>
                    <p className="font-semibold text-slate-800">{selectedMember.name}</p>
                    <p className="text-sm text-slate-500">{selectedMember.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">余额</p>
                  <p className="font-bold text-emerald-600">{formatMoney(selectedMember.balance)}</p>
                  <p className="text-xs text-amber-500">{selectedMember.points} 积分</p>
                </div>
                <button
                  onClick={() => { setSelectedMember(null); setUsePoints(false); setPointsToUse(0); }}
                  className="ml-4 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMemberPicker(true)}
                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                点击选择会员
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-blue-500" />
              选择服务
            </h3>
            {Object.entries(servicesByCategory).map(([category, services]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-sm font-medium text-slate-500 mb-3">
                  {getCategoryLabel(category)}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {services.map((service) => {
                    const cartItem = cart.find(c => c.serviceId === service.id);
                    const count = cartItem?.quantity || 0;
                    return (
                      <button
                        key={service.id}
                        onClick={() => addService(service)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          count > 0
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        {count > 0 && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                            {count}
                          </span>
                        )}
                        <p className="font-medium text-slate-800">{service.name}</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {formatMoney(service.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 sticky top-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">结算单</h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>请选择服务项目</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cart.map((item) => (
                    <div key={item.serviceId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-slate-700 text-sm">{item.serviceName}</p>
                        <p className="text-xs text-slate-400">{formatMoney(item.price)} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeService(item.serviceId)}
                          className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => addService(item.service)}
                          className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => deleteService(item.serviceId)}
                        className="ml-2 p-1 text-slate-300 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">商品小计</span>
                    <span className="font-medium">{formatMoney(subtotal)}</span>
                  </div>
                  
                  {selectedMember && (
                    <div className="flex items-center justify-between py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usePoints}
                          onChange={handleUsePointsToggle}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Gift className="w-4 h-4 text-amber-500" />
                          使用积分抵扣
                        </span>
                      </label>
                    </div>
                  )}

                  {usePoints && selectedMember && (
                    <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700">可用 {selectedMember.points} 积分</span>
                        <span className="text-amber-700">抵 {formatMoney(selectedMember.points * settings.pointValue)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxPointsUsable}
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>使用 {pointsToUse} 积分</span>
                        <span>抵扣 {formatMoney(pointsValue)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 mt-4 pt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-600">应付金额</span>
                    <span className="text-3xl font-bold text-blue-600">{formatMoney(balanceToUse)}</span>
                  </div>
                  {pointsToUse > 0 && (
                    <p className="text-right text-sm text-amber-600 mt-1">
                      含积分抵扣 {formatMoney(pointsValue)}
                    </p>
                  )}
                  {pointsToEarn > 0 && (
                    <p className="text-right text-sm text-emerald-600 mt-1 flex items-center justify-end gap-1">
                      <Sparkles className="w-4 h-4" />
                      预计获得 {pointsToEarn} 积分
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full mt-5 py-3 text-base"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!selectedMember || cart.length === 0}
                >
                  <Check className="w-5 h-5" />
                  确认结算
                </Button>
              </>
            )}
          </div>
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
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
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
        title="结算成功"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-slate-800 mb-1">消费成功！</p>
          <p className="text-slate-500">
            {selectedMember?.name} 消费 {formatMoney(balanceToUse)}
          </p>
          {pointsToEarn > 0 && (
            <p className="text-amber-600 mt-2">
              <Gift className="w-4 h-4 inline mr-1" />
              获得 {pointsToEarn} 积分
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleCloseSuccess}>
              完成
            </Button>
            <Button className="flex-1" onClick={() => { setShowSuccess(false); setCart([]); setUsePoints(false); setPointsToUse(0); }}>
              继续收银
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
