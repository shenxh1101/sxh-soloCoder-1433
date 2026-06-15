import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Gift, Wallet, ChevronRight, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/useMemberStore';
import { formatMoney } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { Member } from '@/types';

export default function Members() {
  const navigate = useNavigate();
  const { members, addMember, updateMember, deleteMember } = useMemberStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthday: '',
    balance: 0,
    points: 0,
    notes: '',
  });

  const filteredMembers = useMemo(() => {
    if (!searchKeyword.trim()) return members;
    const lower = searchKeyword.toLowerCase();
    return members.filter(
      m => m.name.toLowerCase().includes(lower) || m.phone.includes(searchKeyword)
    );
  }, [members, searchKeyword]);

  const handleAdd = () => {
    setFormData({ name: '', phone: '', birthday: '', balance: 0, points: 0, notes: '' });
    setEditingMember(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      birthday: member.birthday || '',
      balance: member.balance,
      points: member.points,
      notes: member.notes,
    });
    setEditingMember(member);
    setIsAddModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个会员吗？')) {
      deleteMember(id);
    }
    setActiveMenuId(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入会员姓名');
      return;
    }
    if (!formData.phone.trim()) {
      alert('请输入手机号码');
      return;
    }

    if (editingMember) {
      updateMember(editingMember.id, {
        name: formData.name,
        phone: formData.phone,
        birthday: formData.birthday || null,
        balance: Number(formData.balance) || 0,
        points: Number(formData.points) || 0,
        notes: formData.notes,
      });
    } else {
      addMember({
        name: formData.name,
        phone: formData.phone,
        birthday: formData.birthday || null,
        balance: Number(formData.balance) || 0,
        points: Number(formData.points) || 0,
        notes: formData.notes,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">会员管理</h1>
          <p className="text-slate-500 mt-1">共 {members.length} 位会员</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          新增会员
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索会员姓名或手机号..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">会员信息</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">储值余额</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">积分</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">到店次数</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">累计消费</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p>没有找到匹配的会员</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/members/${member.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} />
                      <div>
                        <p className="font-semibold text-slate-800">{member.name}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-600">
                      {formatMoney(member.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      {member.points.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {member.visitCount} 次
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatMoney(member.totalConsumption)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === member.id ? null : member.id);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </button>
                      {activeMenuId === member.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 w-32"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleEdit(member)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingMember ? '编辑会员' : '新增会员'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入会员姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">手机号 *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入手机号码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">生日</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">初始余额 (元)</label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">初始积分</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="添加备注信息..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {editingMember ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
