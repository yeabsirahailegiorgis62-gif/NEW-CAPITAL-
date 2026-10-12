import { useState, useEffect } from 'react';
import { User, InAppNotification } from '@/types';
import { api } from '@/lib/api';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Truck, Clock, Car, Shield } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'workspace'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-1',
      recipientId: 'user-1',
      type: 'INFO',
      title: 'Welcome to Capital Fleet',
      message: 'System is configured for Capital Real Estate operations in Addis Ababa.',
      createdAt: new Date().toISOString(),
      readAt: null,
    },
  ]);

  // Check existing authenticated session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const user = await api.getProfile();
          setCurrentUser(user);
          setCurrentView('workspace');
          // Fetch notifications
          const notifs = await api.getNotifications();
          setNotifications(notifs);
        } catch {
          api.setToken(null);
        }
      }
    };
    checkSession();
  }, []);

  // Real backend authentication
  const handleLogin = async (identifier: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(identifier, pass);
      setCurrentUser(res.user);
      setCurrentView('workspace');
      setActiveTab('dashboard');

      // Fetch notifications
      const notifs = await api.getNotifications();
      setNotifications(notifs);
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Invalid credentials or account inactive');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentView('landing');
    setActiveTab('dashboard');
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  };

  if (currentView === 'landing') {
    return <LandingPage onSignInClick={() => setCurrentView('login')} />;
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onBackToLanding={() => setCurrentView('landing')}
        onLoginSubmit={handleLogin}
      />
    );
  }

  return (
    <AppShell
      currentUser={currentUser!}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Welcome back, {currentUser?.name}
              </h1>
              <Badge status={currentUser?.role === 'EMPLOYEE' ? 'Staff Employee' : currentUser?.role === 'LOGISTICS_ADMIN' ? 'Logistics Admin' : 'System Admin'} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser?.department?.name} · Capital Real Estate Operations
            </p>
          </div>
          {currentUser?.role === 'EMPLOYEE' && (
            <Button
              variant="primary"
              onClick={() => setActiveTab('new-booking')}
              leftIcon={<Truck className="w-4 h-4" />}
            >
              Book a Vehicle
            </Button>
          )}
        </div>

        {/* Phase 1 Baseline View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Fleet Quick Status</CardTitle>
              <Car className="w-4 h-4 text-brand-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">12 Vehicles</div>
              <p className="text-xs text-slate-500 mt-1">9 Operational · 2 Assigned · 1 Maintenance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Addis Ababa Time</CardTitle>
              <Clock className="w-4 h-4 text-brand-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">UTC+3 (EAT)</div>
              <p className="text-xs text-slate-500 mt-1">All trip reservations synchronized</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Active Workspace</CardTitle>
              <Shield className="w-4 h-4 text-brand-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-700">Phase 1 Complete</div>
              <p className="text-xs text-slate-500 mt-1">Design system and UI shell ready</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
export default App;
