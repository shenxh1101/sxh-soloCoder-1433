import { useState } from 'react';
import { 
  Settings, 
  Gift, 
  Scissors, 
  Wallet, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Save,
  Database,
  Download,
  Upload
} from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { storage } from '@/utils/storage';
import type { ServiceItem, RechargeRule } from '@/types';
import { generateId } from '@/utils/id';

export default function SettingsPage() {
  const { settings, updateSettings, addService, updateService, deleteService, addRechargeRule, updateRechargeRule, deleteRechargeRule } = useSettingsStore();
  const { members } = useMemberStore();
  const { transactions, recharges, pointRecords } = useTransactionStore();

  const [activeTab, setActiveTab] = useState<'points' | 'services' | 'recharge' | 'data'>('points');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: 0, category: 'other' as ServiceItem['category'] });

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleForm, setRuleForm] = useState({ amount: 0, bonusPoints: 0 });

  const handlePointsPerYuanChange = (value: number) => {
    updateSettings({ pointsPerYuan: value });
  };

  const handlePointValueChange = (value: number) => {
    updateSettings({ pointValue: value });
  };

  const handleBirthdayBonusChange = (value: number) => {
    updateSettings({ birthdayBonusPoints: value });
  };

  const openServiceModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setServiceForm({ name: service.name, price: service.price, category: service.category });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', price: 0, category: 'other' });
    }
    setShowServiceModal(true);
  };

  const handleServiceSubmit = () => {
    if (!serviceForm.name.trim()) {
      alert('请输入服务名称');
      return;
    }
    if (serviceForm.price <= 0) {
      alert('请输入正确的价格');
      return;
    }

    if (editingService) {
      updateService(editingService.id, {
        name: serviceForm.name,
        price: serviceForm.price,
        category: serviceForm.category,
      });
    } else {
      const newService: ServiceItem = {
        id: generateId(),
        name: serviceForm.name,
        price: serviceForm.price,
        category: serviceForm.category,
        pointsRate: 1,
        isActive: true,
      };
      addService(newService);
    }
    setShowServiceModal(false);
  };

  const openRuleModal = (rule?: RechargeRule, index?: number) => {
    if (rule && index !== undefined) {
      setEditingRuleIndex(index);
      setRuleForm({ amount: rule.amount, bonusPoints: rule.bonusPoints });
    } else {
      setEditingRuleIndex(null);
      setRuleForm({ amount: 0, bonusPoints: 0 });
    }
    setShowRuleModal(true);
  };

  const handleRuleSubmit = () => {
    if (ruleForm.amount <= 0) {
      alert('请输入正确的充值金额');
      return;
    }
    if (ruleForm.bonusPoints < 0) {
      alert('赠送积分不能为负数');
      return;
    }

    if (editingRuleIndex !== null) {
      updateRechargeRule(editingRuleIndex, ruleForm);
    } else {
      addRechargeRule(ruleForm);
    }
    setShowRuleModal(false);
  };

  const handleExportAll = () => {
    const data = {
      members,
      transactions,
      recharges,
      pointRecords,
      settings,
      exportTime: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `会员系统数据备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (confirm('确定要导入数据吗？这将覆盖当前所有数据！')) {
          if (data.members) {
            storage.setMembers(data.members);
            useMemberStore.setState({ members: data.members });
          }
          if (data.transactions) {
            storage.setTransactions(data.transactions);
            useTransactionStore.setState({ transactions: data.transactions });
          }
          if (data.recharges) {
            storage.setRecharges(data.recharges);
            useTransactionStore.setState({ recharges: data.recharges });
          }
          if (data.pointRecords) {
            storage.setPointRecords(data.pointRecords);
            useTransactionStore.setState({ pointRecords: data.pointRecords });
          }
          if (data.settings) {
            storage.setSettings(data.settings);
            useSettingsStore.setState({ settings: data.settings });
          }
          alert('数据导入成功！');
        }
      } catch (err) {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const categoryLabels: Record<string, string> = {
    shampoo: '洗发',
    haircut: '剪发',
    perm_dye: '烫染',
    other: '其他',
  };

  const tabs = [
    { id: 'points', label: '积分规则', icon: Gift },
    { id: 'services', label: '服务项目', icon: Scissors },
    { id: 'recharge', label: '充值规则', icon: Wallet },
    { id: 'data', label: '数据管理', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">系统设置</h1>
        <p className="text-slate-500 mt-1">配置系统参数和规则</p>
      </div>

      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {activeTab === 'points' && (
          <div className="space-y-6 max-w-lg">
            <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              积分规则设置
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                消费积分比例
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.pointsPerYuan}
                  onChange={(e) => handlePointsPerYuanChange(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.1"
                />
                <span className="text-slate-600">积分 / 元</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">每消费1元可获得的积分数量</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                积分抵扣价值
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.pointValue * 100}
                  onChange={(e) => handlePointValueChange(Number(e.target.value) / 100)}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1"
                />
                <span className="text-slate-600">积分 = 1元</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">多少积分可以抵扣1元钱</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                生日赠送积分
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.birthdayBonusPoints}
                  onChange={(e) => handleBirthdayBonusChange(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <span className="text-slate-600">积分</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">会员生日当天赠送的积分数量</p>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-blue-500" />
                服务项目管理
              </h3>
              <Button onClick={() => openServiceModal()}>
                <Plus className="w-4 h-4" />
                新增服务
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {settings.services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {categoryLabels[service.category]}
                      </span>
                      <h4 className="font-medium text-slate-800 mt-2">{service.name}</h4>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        ¥{service.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openServiceModal(service)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除服务"${service.name}"吗？`)) {
                            deleteService(service.id);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recharge' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                充值规则
              </h3>
              <Button variant="success" onClick={() => openRuleModal()}>
                <Plus className="w-4 h-4" />
                新增规则
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {settings.rechargeRules.map((rule, index) => (
                <div
                  key={index}
                  className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 relative"
                >
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => openRuleModal(rule, index)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-amber-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定删除此充值规则吗？')) {
                          deleteRechargeRule(index);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-100/60 text-amber-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">¥{rule.amount}</p>
                  <p className="text-sm text-amber-600 mt-2">送 {rule.bonusPoints} 积分</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-500">
              * 充值金额达到对应档位即可获得该档位的赠送积分，按最高档位计算
            </p>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-500" />
              数据管理
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Download className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">导出数据备份</h4>
                    <p className="text-sm text-slate-500">将所有数据导出为JSON文件备份</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full" onClick={handleExportAll}>
                  <Download className="w-4 h-4" />
                  导出所有数据
                </Button>
              </div>

              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <Upload className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">导入数据</h4>
                    <p className="text-sm text-red-500">警告：将覆盖当前所有数据</p>
                  </div>
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <div className="w-full text-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium cursor-pointer hover:bg-slate-200 transition-colors">
                    <Upload className="w-4 h-4 inline mr-2" />
                    选择文件导入
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4">
              <h4 className="font-medium text-amber-800 mb-2">数据统计</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-amber-600">会员数量</p>
                  <p className="text-xl font-bold text-amber-800">{members.length}</p>
                </div>
                <div>
                  <p className="text-amber-600">消费记录</p>
                  <p className="text-xl font-bold text-amber-800">{transactions.length}</p>
                </div>
                <div>
                  <p className="text-amber-600">充值记录</p>
                  <p className="text-xl font-bold text-amber-800">{recharges.length}</p>
                </div>
                <div>
                  <p className="text-amber-600">积分记录</p>
                  <p className="text-xl font-bold text-amber-800">{pointRecords.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title={editingService ? '编辑服务' : '新增服务'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">服务名称</label>
            <input
              type="text"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入服务名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">价格 (元)</label>
            <input
              type="number"
              value={serviceForm.price || ''}
              onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
            <select
              value={serviceForm.category}
              onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as ServiceItem['category'] })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowServiceModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleServiceSubmit}>
              {editingService ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRuleIndex !== null ? '编辑充值规则' : '新增充值规则'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">充值金额 (元)</label>
            <input
              type="number"
              value={ruleForm.amount || ''}
              onChange={(e) => setRuleForm({ ...ruleForm, amount: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">赠送积分</label>
            <input
              type="number"
              value={ruleForm.bonusPoints || ''}
              onChange={(e) => setRuleForm({ ...ruleForm, bonusPoints: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRuleModal(false)}>
              取消
            </Button>
            <Button className="flex-1" variant="success" onClick={handleRuleSubmit}>
              {editingRuleIndex !== null ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
