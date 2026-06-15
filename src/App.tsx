import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Members from '@/pages/Members/Members';
import MemberDetail from '@/pages/MemberDetail/MemberDetail';
import Checkout from '@/pages/Checkout/Checkout';
import Recharge from '@/pages/Recharge/Recharge';
import Points from '@/pages/Points/Points';
import Birthday from '@/pages/Birthday/Birthday';
import Reports from '@/pages/Reports/Reports';
import Settings from '@/pages/Settings/Settings';
import { useMemberStore } from '@/store/useMemberStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSettingsStore } from '@/store/useSettingsStore';

function AppContent() {
  const loadMembers = useMemberStore(state => state.loadMembers);
  const loadTransactions = useTransactionStore(state => state.loadData);
  const loadSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    loadSettings();
    loadMembers();
    loadTransactions();
  }, [loadSettings, loadMembers, loadTransactions]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:id" element={<MemberDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route path="/points" element={<Points />} />
        <Route path="/birthday" element={<Birthday />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
