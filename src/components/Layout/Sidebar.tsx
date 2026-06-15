import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Wallet, 
  Gift, 
  Calendar, 
  BarChart3, 
  Settings,
  Scissors
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '首页' },
  { path: '/members', icon: Users, label: '会员管理' },
  { path: '/checkout', icon: CreditCard, label: '消费收银' },
  { path: '/recharge', icon: Wallet, label: '充值管理' },
  { path: '/points', icon: Gift, label: '积分管理' },
  { path: '/birthday', icon: Calendar, label: '生日提醒' },
  { path: '/reports', icon: BarChart3, label: '报表中心' },
  { path: '/settings', icon: Settings, label: '系统设置' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-60 bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-blue-700">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <Scissors className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">理发店</h1>
          <p className="text-xs text-blue-300">会员管理系统</p>
        </div>
      </div>
      
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all duration-200 hover:bg-blue-700/50 ${
                isActive
                  ? 'bg-blue-700/70 text-white border-r-4 border-amber-400'
                  : 'text-blue-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-blue-700">
        <p className="text-xs text-blue-400 text-center">
          数据保存在本地浏览器
        </p>
      </div>
    </div>
  );
}
