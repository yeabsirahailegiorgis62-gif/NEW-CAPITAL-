// ROUTING: This SPA does not use react-router. App.tsx switches landing/login/workspace
// and the workspace `activeTab` (also stored in ?tab=) to choose which feature view to render.
import React, { useState, useEffect } from 'react';
import { User, Booking, Vehicle, InAppNotification, BookingStatus } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { LoginPage } from '@/pages/LoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { AppShell } from '@/components/layout/AppShell';
import { EmployeeDashboard } from '@/features/dashboard/EmployeeDashboard';
import { LogisticsDashboard } from '@/features/dashboard/LogisticsDashboard';
import { BookingRequestForm } from '@/features/bookings/BookingRequestForm';
import { BookingDetailsModal } from '@/features/bookings/BookingDetailsModal';
import { CancelBookingModal } from '@/features/bookings/CancelBookingModal';
import { BookingsTable } from '@/features/bookings/BookingsTable';
import { VehicleInventoryView } from '@/features/vehicles/VehicleInventoryView';
import { AvailabilityCalendar } from '@/features/availability/AvailabilityCalendar';
import { ReviewRequestsQueue } from '@/features/logistics/ReviewRequestsQueue';
import { AssignVehicleModal } from '@/features/logistics/AssignVehicleModal';
import { TripExecutionModal } from '@/features/logistics/TripExecutionModal';
import { MaintenanceView } from '@/features/maintenance/MaintenanceView';
import { UsersManagementView } from '@/features/admin/UsersManagementView';
import { AuditLogsView } from '@/features/admin/AuditLogsView';
import { ProfileModal } from '@/components/layout/ProfileModal';
import { AutomotiveLoadingScreen } from '@/components/loading/AutomotiveLoadingScreen';
import { DigitalReceiptModal } from '@/features/bookings/DigitalReceiptModal';
import { BookingVerificationModal } from '@/features/bookings/BookingVerificationModal';
import { PublicVerificationPage } from '@/pages/PublicVerificationPage';
import { DriversManagementView } from '@/features/drivers/DriversManagementView';
import { ReportsHubView } from '@/features/reports/ReportsHubView';
import { SystemSettingsView } from '@/features/admin/SystemSettingsView';
import { PrintableTransportFormModal } from '@/features/bookings/PrintableTransportFormModal';
import { DriverDashboard } from '@/features/dashboard/DriverDashboard';
import { AdminAnalyticsDashboard } from '@/features/dashboard/AdminAnalyticsDashboard';
import { DepartmentsManagementView } from '@/features/admin/DepartmentsManagementView';
import { ProfileSettingsView } from '@/features/profile/ProfileSettingsView';

export function App() {
  const toast = useToast();

  // STATE: Session, current screen, bookings cache, and which modal is open.
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'workspace'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'login' || window.location.pathname === '/auth') {
        return 'login';
      }
    }
    return 'landing';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) return tab;
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && currentView === 'workspace') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab, currentView]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Modal states
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [printableBooking, setPrintableBooking] = useState<Booking | null>(null);
  const [verificationReference, setVerificationReference] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('verify') || params.get('ref');
    }
    return null;
  });
  const [isDirectScan, setIsDirectScan] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('verify') || params.get('ref'));
    }
    return false;
  });
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [tripModalBooking, setTripModalBooking] = useState<{ booking: Booking; mode: 'start' | 'complete' } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Check URL query parameters for QR code verification (?verify=...) or direct receipt (?receipt=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyRef = params.get('verify') || params.get('ref');
      if (verifyRef) {
        setVerificationReference(verifyRef);
        setIsDirectScan(true);
      }
      const receiptParam = params.get('receipt');
      if (receiptParam) {
        handleOpenReceipt({ id: receiptParam });
      }
    }
  }, []);

  // HOOK: On load, restore JWT from sessionStorage and fetch GET /api/auth/me.
  useEffect(() => {
    const checkSession = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const user = await api.getProfile();
          setCurrentUser(user);
          setCurrentView('workspace');
          await refreshAllData();
        } catch {
          api.setToken(null);
        }
      }
    };
    checkSession();
  }, []);

  const refreshAllData = async () => {
    try {
      const [notifs, bookingsData] = await Promise.all([
        api.getNotifications(),
        api.getBookings(),
      ]);
      setNotifications(notifs);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  };

  // EVENT HANDLER: LoginPage calls this; ApiClient.login stores the JWT then loads workspace data.
  const handleLogin = async (identifier: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(identifier, pass);
      setCurrentUser(res.user);
      setCurrentView('workspace');
      setActiveTab('dashboard');
      const [notifs, bookingsData] = await Promise.all([
        api.getNotifications(),
        api.getBookings(),
      ]);
      setNotifications(notifs);
      setBookings(bookingsData);
      // Show a welcome toast if there are unread notifications
      const unread = notifs.filter((n) => !n.readAt);
      if (unread.length > 0) {
        toast.info(
          `Welcome back, ${res.user.name.split(' ')[0]}!`,
          `You have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}.`
        );
      }
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Invalid credentials or account inactive');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setNotifications([]);
    setBookings([]);
    setCurrentView('landing');
    setActiveTab('dashboard');
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch {
      // ignore
    }
  };

  // Called by AppShell polling to keep notifications fresh
  const handleNotificationsRefresh = (fresh: InAppNotification[]) => {
    setNotifications((prev) => {
      // Check if there are any new unread notifications compared to what we had
      const prevUnreadIds = new Set(prev.filter((n) => !n.readAt).map((n) => n.id));
      const newUnread = fresh.filter((n) => !n.readAt && !prevUnreadIds.has(n.id));
      if (newUnread.length > 0) {
        // Show a subtle toast for each new notification (max 3 to avoid flooding)
        newUnread.slice(0, 3).forEach((n) => {
          const type = n.type === 'BOOKING_APPROVED' || n.type === 'VEHICLE_ASSIGNED'
            ? 'success'
            : n.type === 'BOOKING_REJECTED'
            ? 'error'
            : 'info';
          toast.showToast({ type, title: n.title, message: n.message, duration: 6000 });
        });
      }
      return fresh;
    });
  };

  // Workflow Handlers
  const handleApproveBooking = async (id: string) => {
    try {
      // Optimistic update so UI updates immediately
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' as BookingStatus } : b))
      );
      await api.approveBooking(id);
      setSelectedBookingForDetails(null);
      toast.success('Booking approved', 'Moved to Approved queue for vehicle allocation.');
      await refreshAllData();
    } catch (err: any) {
      toast.error('Approval failed', err.message);
      await refreshAllData();
    }
  };

  const handleRejectBooking = async (id: string, reason: string) => {
    try {
      // Optimistic update
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: 'REJECTED' as BookingStatus, rejectionReason: reason }
            : b
        )
      );
      await api.rejectBooking(id, reason);
      setSelectedBookingForDetails(null);
      toast.info('Booking rejected', 'The employee has been notified.');
      await refreshAllData();
    } catch (err: any) {
      toast.error('Rejection failed', err.message);
      await refreshAllData();
    }
  };

  const handleConfirmCancelBooking = async (
    bookingId: string,
    data: { reason: string; notes?: string; bookingDayId?: string }
  ) => {
    try {
      await api.cancelBooking(bookingId, data);
      setCancellingBooking(null);
      setSelectedBookingForDetails(null);
      toast.success(
        'Booking Cancelled',
        data.bookingDayId
          ? 'Selected scheduled trip date has been cancelled and its resources released.'
          : 'Booking cancelled. Vehicle and driver have been safely released.'
      );
      await refreshAllData();
    } catch (err: any) {
      toast.error('Cancellation failed', err.message || 'Could not cancel booking');
      throw err;
    }
  };

  const handleOpenReceipt = async (target: Booking | { id: string; bookingReference?: string }) => {
    setIsReceiptOpen(true);
    setReceiptError(null);

    // If an entire booking object is already in memory, display it immediately
    if ('bookingReference' in target && 'status' in target && target.bookingReference && target.status) {
      setSelectedBookingForReceipt(target as Booking);
      setIsReceiptLoading(false);
    } else {
      setIsReceiptLoading(true);
    }

    const lookupKey = target.id || ('bookingReference' in target ? target.bookingReference : undefined);
    if (lookupKey) {
      try {
        const full = await api.getBooking(lookupKey);
        setSelectedBookingForReceipt(full);
        setIsReceiptLoading(false);
      } catch (err: any) {
        console.error('Failed to load booking for receipt', err);
        setIsReceiptLoading(false);
        if (!('bookingReference' in target && (target as any).status)) {
          const msg = err.message || 'Could not retrieve verified booking record from fleet database.';
          setReceiptError(msg);
          toast.error('Receipt error', msg);
        }
      }
    }
  };

  // Direct Public Scan Page (Bypasses splash screen and authentication for mobile QR scanning)
  if (verificationReference && isDirectScan) {
    return (
      <PublicVerificationPage
        reference={verificationReference}
        onNavigateToPortal={() => {
          setIsDirectScan(false);
          setVerificationReference(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setCurrentView(currentUser ? 'workspace' : 'login');
        }}
        onSearchOtherReference={(newRef) => {
          setVerificationReference(newRef);
          if (typeof window !== 'undefined') {
            const newUrl = `${window.location.origin}/?verify=${encodeURIComponent(newRef)}`;
            window.history.replaceState({}, document.title, newUrl);
          }
        }}
      />
    );
  }

  if (isAppLoading) {
    return <AutomotiveLoadingScreen onFinish={() => setIsAppLoading(false)} minDuration={1800} />;
  }

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage onSignInClick={() => setCurrentView('login')} />
        <BookingVerificationModal
          isOpen={verificationReference !== null && !currentUser}
          onClose={() => setVerificationReference(null)}
          initialReference={verificationReference}
        />
      </>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        <LoginPage
          onLoginSubmit={handleLogin}
          onOpenVerification={() => setVerificationReference('')}
          onBackToLanding={() => setCurrentView('landing')}
        />
        <BookingVerificationModal
          isOpen={verificationReference !== null && !currentUser}
          onClose={() => setVerificationReference(null)}
          initialReference={verificationReference}
        />
      </>
    );
  }

  // AUTHORIZATION: Role flags decide which dashboard and sidebar tabs are shown.
  const isEmployee = currentUser?.role === 'EMPLOYEE';
  const isDriver = currentUser?.role === 'DRIVER';
  const isLogisticsAdmin = currentUser?.role === 'LOGISTICS_ADMIN';
  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
  const canAssignVehicles = isLogisticsAdmin || isSystemAdmin;

  return (
    <>
      <AppShell
      currentUser={currentUser!}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onOpenProfile={() => setIsProfileOpen(true)}
      onOpenReceipt={handleOpenReceipt}
      onOpenVerification={(ref) => setVerificationReference(ref || '')}
      onNotificationsRefresh={handleNotificationsRefresh}
      onOpenBooking={async (target) => {
        if ('bookingReference' in target) {
          setSelectedBookingForDetails(target as Booking);
        }
        if (target.id) {
          try {
            const b = await api.getBooking(target.id);
            setSelectedBookingForDetails(b);
          } catch (err) {
            console.error('Failed to load booking details', err);
          }
        }
      }}
    >
      {/* Dynamic Tab Rendering */}
      {activeTab === 'dashboard' && (
        <>
          {isDriver ? (
            <DriverDashboard
              currentUser={currentUser!}
              onOpenBooking={(b) => setSelectedBookingForDetails(b)}
              onStartTrip={(b) => setTripModalBooking({ booking: b, mode: 'start' })}
              onCompleteTrip={(b) => setTripModalBooking({ booking: b, mode: 'complete' })}
              onOpenReceipt={handleOpenReceipt}
              onRefresh={refreshAllData}
            />
          ) : isEmployee ? (
            <EmployeeDashboard
              currentUser={currentUser!}
              onNewBookingClick={() => setActiveTab('new-booking')}
              onOpenBooking={(b) => setSelectedBookingForDetails(b)}
              onOpenReceipt={handleOpenReceipt}
              onNavigateTab={setActiveTab}
            />
          ) : isSystemAdmin ? (
            <AdminAnalyticsDashboard
              onNavigateTab={setActiveTab}
              onOpenBooking={(b) => setSelectedBookingForDetails(b)}
              onAssignVehicle={(b) => setAssigningBooking(b)}
              onCancelBooking={(b) => setCancellingBooking(b)}
              onOpenReceipt={handleOpenReceipt}
            />
          ) : (
            <LogisticsDashboard
              currentUser={currentUser!}
              onNavigateTab={setActiveTab}
              onOpenBooking={(b) => setSelectedBookingForDetails(b)}
              onAssignVehicle={(b) => setAssigningBooking(b)}
              onCancelBooking={(b) => setCancellingBooking(b)}
              onOpenReceipt={handleOpenReceipt}
              onApproveBooking={handleApproveBooking}
              onRejectBooking={handleRejectBooking}
              onRefresh={refreshAllData}
            />
          )}
        </>
      )}

      {activeTab === 'new-booking' && (
        <BookingRequestForm
          currentUser={currentUser!}
          onSuccess={(b) => {
            refreshAllData();
            setSelectedBookingForDetails(b);
            setActiveTab(isEmployee ? 'my-bookings' : 'dashboard');
          }}
          onCancel={() => setActiveTab('dashboard')}
          onOpenReceipt={handleOpenReceipt}
          onPrintForm={(b) => setPrintableBooking(b)}
        />
      )}

      {activeTab === 'my-bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Trip Bookings & History</h2>
          </div>
          <BookingsTable
            bookings={bookings}
            currentUser={currentUser!}
            onSelectBooking={(b) => setSelectedBookingForDetails(b)}
            onCancelBooking={(b) => setCancellingBooking(b)}
            onOpenReceipt={handleOpenReceipt}
            onRefresh={refreshAllData}
          />
        </div>
      )}

      {activeTab === 'requests-queue' && (
        <ReviewRequestsQueue
          currentUser={currentUser!}
          bookings={bookings}
          initialTab="pending"
          onRefreshQueue={refreshAllData}
          onSelectBooking={(b) => setSelectedBookingForDetails(b)}
          onAssignVehicle={canAssignVehicles ? (b) => setAssigningBooking(b) : undefined}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
          onCancelBooking={(b) => setCancellingBooking(b)}
          onOpenReceipt={handleOpenReceipt}
          onPrintForm={(b) => setPrintableBooking(b)}
        />
      )}

      {activeTab === 'assign-queue' && (
        <ReviewRequestsQueue
          currentUser={currentUser!}
          bookings={bookings}
          initialTab="approved"
          onRefreshQueue={refreshAllData}
          onSelectBooking={(b) => setSelectedBookingForDetails(b)}
          onAssignVehicle={canAssignVehicles ? (b) => setAssigningBooking(b) : undefined}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
          onCancelBooking={(b) => setCancellingBooking(b)}
          onOpenReceipt={handleOpenReceipt}
          onPrintForm={(b) => setPrintableBooking(b)}
        />
      )}

      {activeTab === 'availability' && (
        <AvailabilityCalendar
          currentUser={currentUser!}
          onSelectBooking={(b) => setSelectedBookingForDetails(b)}
        />
      )}

      {activeTab === 'vehicles' && (
        <VehicleInventoryView
          currentUser={currentUser!}
          onReportIssue={() => setActiveTab('maintenance')}
        />
      )}

      {activeTab === 'drivers' && !isEmployee && (
        <DriversManagementView currentUser={currentUser!} />
      )}

      {activeTab === 'maintenance' && (
        <MaintenanceView currentUser={currentUser!} />
      )}

      {activeTab === 'reports' && !isEmployee && (
        <ReportsHubView currentUser={currentUser!} />
      )}

      {activeTab === 'settings' && isSystemAdmin && (
        <SystemSettingsView currentUser={currentUser!} />
      )}

      {activeTab === 'departments' && isSystemAdmin && (
        <DepartmentsManagementView />
      )}

      {(activeTab === 'users' || activeTab === 'reset-requests') && isSystemAdmin && (
        <UsersManagementView initialTab={activeTab === 'reset-requests' ? 'resetRequests' : 'staff'} />
      )}

      {activeTab === 'audit-logs' && !isEmployee && (
        <AuditLogsView />
      )}

      {activeTab === 'weekly-requests' && !isEmployee && (
        <ReviewRequestsQueue
          currentUser={currentUser!}
          bookings={bookings.filter((b) => b.requestType === 'WEEKLY')}
          initialTab="pending"
          onRefreshQueue={refreshAllData}
          onSelectBooking={(b) => setSelectedBookingForDetails(b)}
          onAssignVehicle={canAssignVehicles ? (b) => setAssigningBooking(b) : undefined}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
          onCancelBooking={(b) => setCancellingBooking(b)}
          onOpenReceipt={handleOpenReceipt}
          onPrintForm={(b) => setPrintableBooking(b)}
        />
      )}

      {activeTab === 'profile-settings' && (
        <ProfileSettingsView
          currentUser={currentUser!}
          onProfileUpdated={refreshAllData}
          onLogout={handleLogout}
        />
      )}
    </AppShell>

    {/* Booking Details Modal */}
    {selectedBookingForDetails && (
      <BookingDetailsModal
        isOpen={!!selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
        booking={selectedBookingForDetails}
        currentUser={currentUser!}
        onApprove={handleApproveBooking}
        onReject={handleRejectBooking}
        onOpenReceipt={(b) => {
          setSelectedBookingForDetails(null);
          handleOpenReceipt(b);
        }}
        onPrintForm={(b) => setPrintableBooking(b)}
        onAssign={canAssignVehicles ? (b) => {
          setSelectedBookingForDetails(null);
          setAssigningBooking(b);
        } : undefined}
        onStartTrip={(b) => {
          setSelectedBookingForDetails(null);
          setTripModalBooking({ booking: b, mode: 'start' });
        }}
        onCompleteTrip={(b) => {
          setSelectedBookingForDetails(null);
          setTripModalBooking({ booking: b, mode: 'complete' });
        }}
        onCancelBooking={(b) => {
          setSelectedBookingForDetails(null);
          setCancellingBooking(b);
        }}
      />
    )}

    {/* Logistics Cancellation Confirmation Modal */}
    {cancellingBooking && (
      <CancelBookingModal
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        booking={cancellingBooking}
        onConfirmCancel={handleConfirmCancelBooking}
      />
    )}

    {/* Digital Receipt Modal */}
    <DigitalReceiptModal
      isOpen={isReceiptOpen || !!selectedBookingForReceipt}
      onClose={() => {
        setIsReceiptOpen(false);
        setSelectedBookingForReceipt(null);
        setReceiptError(null);
        if (typeof window !== 'undefined' && window.location.search.includes('receipt=')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('receipt');
          window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
        }
      }}
      booking={selectedBookingForReceipt}
      isLoading={isReceiptLoading}
      error={receiptError}
      onVerifyBooking={(ref) => setVerificationReference(ref)}
    />

    {/* QR Code Booking Verification Modal */}
    <BookingVerificationModal
      isOpen={verificationReference !== null}
      onClose={() => setVerificationReference(null)}
      initialReference={verificationReference}
    />

    {/* Assign Vehicle Modal */}
    {assigningBooking && (
      <AssignVehicleModal
        isOpen={!!assigningBooking}
        onClose={() => setAssigningBooking(null)}
        booking={assigningBooking}
        onAssigned={() => {
          refreshAllData();
          toast.success('Vehicle assigned!', 'The employee will be notified of their assigned vehicle.');
        }}
      />
    )}

    {/* Trip Execution Telemetry Modal */}
    {tripModalBooking && (
      <TripExecutionModal
        isOpen={!!tripModalBooking}
        onClose={() => setTripModalBooking(null)}
        booking={tripModalBooking.booking}
        mode={tripModalBooking.mode}
        onSuccess={() => {
          refreshAllData();
          toast.success(
            tripModalBooking.mode === 'start' ? 'Trip started' : 'Trip completed',
            tripModalBooking.mode === 'start' ? 'Odometer logged and trip is now in progress.' : 'Trip record closed successfully.'
          );
        }}
      />
    )}

    {/* User Profile & Avatar Settings Modal */}
    {currentUser && (
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => setCurrentUser(updated)}
        onSave={async (data) => {
          const updated = await api.updateOwnProfile(data);
          toast.success('Profile updated', 'Your changes have been saved.');
          return updated;
        }}
      />
    )}

    {/* Printable Official Transport Request Form Modal */}
    {printableBooking && (
      <PrintableTransportFormModal
        isOpen={!!printableBooking}
        onClose={() => setPrintableBooking(null)}
        booking={printableBooking}
      />
    )}
  </>
  );
}

export default App;
