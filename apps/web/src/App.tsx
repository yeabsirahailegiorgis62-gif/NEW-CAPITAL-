import React, { useState, useEffect } from 'react';
import { User, Booking, Vehicle, InAppNotification, BookingStatus } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AppShell } from '@/components/layout/AppShell';
import { EmployeeDashboard } from '@/features/dashboard/EmployeeDashboard';
import { LogisticsDashboard } from '@/features/dashboard/LogisticsDashboard';
import { BookingRequestForm } from '@/features/bookings/BookingRequestForm';
import { BookingDetailsModal } from '@/features/bookings/BookingDetailsModal';
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

export function App() {
  const toast = useToast();

  const [isAppLoading, setIsAppLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'workspace'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Modal states
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  const [verificationReference, setVerificationReference] = useState<string | null>(null);
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [tripModalBooking, setTripModalBooking] = useState<{ booking: Booking; mode: 'start' | 'complete' } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Check URL query parameters for QR code verification (?verify=CR-2026-XXXX or ?ref=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyRef = params.get('verify') || params.get('ref');
      if (verifyRef) {
        setVerificationReference(verifyRef);
      }
    }
  }, []);

  // Check authenticated session on load
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

  const handleCancelBooking = async (id: string, reason?: string) => {
    try {
      await api.cancelBooking(id, reason);
      setSelectedBookingForDetails(null);
      toast.warning('Booking cancelled');
      await refreshAllData();
    } catch (err: any) {
      toast.error('Cancel failed', err.message);
    }
  };

  const handleOpenReceipt = async (target: Booking | { id: string; bookingReference?: string }) => {
    if ('bookingReference' in target && 'status' in target && target.bookingReference && target.status) {
      setSelectedBookingForReceipt(target as Booking);
    } else if (target.id) {
      try {
        const full = await api.getBooking(target.id);
        setSelectedBookingForReceipt(full);
      } catch (err) {
        console.error('Failed to load booking for receipt', err);
        toast.error('Receipt error', 'Could not retrieve full booking record.');
      }
    }
  };

  if (isAppLoading) {
    return <AutomotiveLoadingScreen onFinish={() => setIsAppLoading(false)} minDuration={1800} />;
  }

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage onSignInClick={() => setCurrentView('login')} />
        <BookingVerificationModal
          isOpen={verificationReference !== null}
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
          onBackToLanding={() => setCurrentView('landing')}
          onLoginSubmit={handleLogin}
        />
        <BookingVerificationModal
          isOpen={verificationReference !== null}
          onClose={() => setVerificationReference(null)}
          initialReference={verificationReference}
        />
      </>
    );
  }

  const isEmployee = currentUser?.role === 'EMPLOYEE';
  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';

  return (
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
        } else if (target.id) {
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
          {isEmployee ? (
            <EmployeeDashboard
              currentUser={currentUser!}
              onNewBookingClick={() => setActiveTab('new-booking')}
              onOpenBooking={(b) => setSelectedBookingForDetails(b)}
              onOpenReceipt={handleOpenReceipt}
              onNavigateTab={setActiveTab}
            />
          ) : (
            <LogisticsDashboard
              onNavigateTab={setActiveTab}
              onOpenBooking={(b) => setSelectedBookingForDetails(b)}
            />
          )}
        </>
      )}

      {activeTab === 'new-booking' && (
        <BookingRequestForm
          onSuccess={(b) => {
            refreshAllData();
            setSelectedBookingForDetails(b);
            setActiveTab(isEmployee ? 'my-bookings' : 'dashboard');
          }}
          onCancel={() => setActiveTab('dashboard')}
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
            onOpenReceipt={handleOpenReceipt}
            onRefresh={refreshAllData}
          />
        </div>
      )}

      {activeTab === 'requests-queue' && (
        <ReviewRequestsQueue
          currentUser={currentUser!}
          bookings={bookings}
          onRefreshQueue={refreshAllData}
          onSelectBooking={(b) => setSelectedBookingForDetails(b)}
          onAssignVehicle={(b) => setAssigningBooking(b)}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
          onOpenReceipt={handleOpenReceipt}
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

      {activeTab === 'maintenance' && (
        <MaintenanceView currentUser={currentUser!} />
      )}

      {activeTab === 'users' && isSystemAdmin && (
        <UsersManagementView />
      )}

      {activeTab === 'audit-logs' && !isEmployee && (
        <AuditLogsView />
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={!!selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
        booking={selectedBookingForDetails}
        currentUser={currentUser!}
        onApprove={handleApproveBooking}
        onReject={handleRejectBooking}
        onOpenReceipt={handleOpenReceipt}
        onAssign={(b) => {
          setSelectedBookingForDetails(null);
          setAssigningBooking(b);
        }}
        onStartTrip={(b) => {
          setSelectedBookingForDetails(null);
          setTripModalBooking({ booking: b, mode: 'start' });
        }}
        onCompleteTrip={(b) => {
          setSelectedBookingForDetails(null);
          setTripModalBooking({ booking: b, mode: 'complete' });
        }}
        onCancelBooking={handleCancelBooking}
      />

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={!!selectedBookingForReceipt}
        onClose={() => setSelectedBookingForReceipt(null)}
        booking={selectedBookingForReceipt}
        onVerifyBooking={(ref) => setVerificationReference(ref)}
      />

      {/* QR Code Booking Verification Modal */}
      <BookingVerificationModal
        isOpen={verificationReference !== null}
        onClose={() => setVerificationReference(null)}
        initialReference={verificationReference}
      />

      {/* Assign Vehicle Modal */}
      <AssignVehicleModal
        isOpen={!!assigningBooking}
        onClose={() => setAssigningBooking(null)}
        booking={assigningBooking}
        onAssigned={() => {
          refreshAllData();
          toast.success('Vehicle assigned!', 'The employee will be notified of their assigned vehicle.');
        }}
      />

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
    </AppShell>
  );
}

export default App;
