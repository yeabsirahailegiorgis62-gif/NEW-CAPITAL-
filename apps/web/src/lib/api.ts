import {
  User,
  Vehicle,
  Booking,
  VehicleAssignment,
  InAppNotification,
  AuditLog,
  VehicleIssue,
  LogisticsDashboardStats,
  VehicleCategory,
  VehicleOperationalStatus,
  BookingStatus,
  UserRole,
  Department,
  BookingVerificationResult,
  SystemSettings,
  VehicleMaintenance,
  FuelRecord,
  FuelStats,
  VehicleRecommendation,
  DriverRecommendation,
  PasswordResetRequest,
} from '@/types';

// API CLIENT: Single HTTP layer. Browser calls `/api/...`; Vite proxies that to NestJS :4100.
const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? sessionStorage.getItem('capital_fleet_token') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('capital_fleet_token', token);
      } else {
        sessionStorage.removeItem('capital_fleet_token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  // AUTHENTICATION: Attaches Authorization: Bearer <JWT> on every authenticated request.
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      try {
        const errorData = await response.json();
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- AUTHENTICATION ---
  async login(identifier: string, password: string): Promise<{ accessToken: string; user: User }> {
    const res = await this.request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(res.accessToken);
    return res;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // --- VEHICLES ---
  async getVehicles(query?: { search?: string; category?: VehicleCategory; status?: VehicleOperationalStatus }): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.category) params.append('category', query.category);
    if (query?.status) params.append('status', query.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Vehicle[]>(`/vehicles${qs}`);
  }

  async getVehicle(id: string): Promise<Vehicle & { issues: VehicleIssue[]; assignments: any[] }> {
    return this.request(`/vehicles/${id}`);
  }

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    return this.request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getFleetAvailability(
    departureAt: string,
    expectedReturnAt: string,
    minCapacity?: number,
    category?: VehicleCategory,
  ): Promise<Array<{
    vehicle: Vehicle;
    isAvailable: boolean;
    availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE';
    reason: string;
    activeBookingConflict?: any;
  }>> {
    const params = new URLSearchParams({
      departureAt,
      expectedReturnAt,
    });
    if (minCapacity) params.append('minCapacity', String(minCapacity));
    if (category) params.append('category', category);
    return this.request(`/vehicles/availability?${params.toString()}`);
  }

  async getVehicleRecommendations(bookingId: string): Promise<VehicleRecommendation[]> {
    return this.request<VehicleRecommendation[]>(`/vehicles/recommendations/${bookingId}`);
  }

  async getDriverRecommendations(bookingId: string): Promise<DriverRecommendation[]> {
    return this.request<DriverRecommendation[]>(`/vehicles/driver-recommendations/${bookingId}`);
  }

  // --- BOOKINGS ---
  async createBooking(data: {
    destination: string;
    purpose: string;
    departureAt: string;
    expectedReturnAt: string;
    passengerCount: number;
    requestType?: 'DAILY' | 'WEEKLY';
    pickupLocation?: string;
    contactPhone?: string;
    preferredVehicleId?: string;
    requiresDriver: boolean;
    additionalNotes?: string;
    priority?: string;
    passengerDetails?: string;
    documentUrl?: string;
    weeklyDays?: Array<{
      dayOfWeek: string;
      tripDate: string;
      timeSlot: 'MORNING' | 'AFTERNOON';
      notes?: string;
    }>;
  }): Promise<Booking> {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBookings(query?: { status?: BookingStatus; search?: string; from?: string; to?: string }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.from) params.append('from', query.from);
    if (query?.to) params.append('to', query.to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Booking[]>(`/bookings${qs}`);
  }

  async getBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async cancelBooking(
    id: string,
    data?: string | { reason: string; notes?: string; bookingDayId?: string }
  ): Promise<Booking> {
    const payload = typeof data === 'string' ? { reason: data } : data || {};
    return this.request<Booking>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async approveBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}/approve`, { method: 'POST' });
  }

  async rejectBooking(id: string, rejectionReason: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  async assignVehicle(bookingId: string, data: { vehicleId: string; driverId?: string; driverName?: string; driverPhone?: string; assignmentNotes?: string }): Promise<VehicleAssignment> {
    return this.request<VehicleAssignment>(`/bookings/${bookingId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async autoAssignBooking(bookingId: string): Promise<VehicleAssignment> {
    return this.request<VehicleAssignment>(`/bookings/${bookingId}/auto-assign`, {
      method: 'POST',
    });
  }

  async confirmAssignment(assignmentId: string): Promise<VehicleAssignment> {
    return this.request<VehicleAssignment>(`/bookings/assignments/${assignmentId}/confirm`, {
      method: 'POST',
    });
  }

  async declineAssignment(assignmentId: string, reason: string): Promise<VehicleAssignment> {
    return this.request<VehicleAssignment>(`/bookings/assignments/${assignmentId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async startTrip(bookingId: string, data?: { actualDepartureAt?: string; startOdometer?: number }): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}/start-trip`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async markArrival(bookingId: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}/mark-arrival`, {
      method: 'POST',
    });
  }

  async reportDelay(bookingId: string, reason: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}/report-delay`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async completeTrip(bookingId: string, data?: { actualReturnAt?: string; endOdometer?: number; tripNotes?: string; notes?: string; reportedProblem?: string }): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}/complete-trip`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async checkDuplicate(params: { tripDate: string; destination: string; departureTime?: string }): Promise<{ isDuplicate: boolean; matches: any[] }> {
    return this.request('/bookings/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getLogisticsDashboardStats(): Promise<LogisticsDashboardStats> {
    return this.request<LogisticsDashboardStats>('/bookings/stats');
  }

  async verifyBooking(reference: string): Promise<BookingVerificationResult> {
    return this.request<BookingVerificationResult>(`/bookings/verify/${encodeURIComponent(reference)}`);
  }

  async verifyTripToken(token: string): Promise<BookingVerificationResult> {
    return this.request<BookingVerificationResult>(`/bookings/verify-token/${encodeURIComponent(token)}`);
  }

  // --- VEHICLE ISSUES & MAINTENANCE ---
  async getIssues(query?: { status?: string; vehicleId?: string }): Promise<VehicleIssue[]> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.vehicleId) params.append('vehicleId', query.vehicleId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<VehicleIssue[]>(`/vehicle-issues${qs}`);
  }

  async reportIssue(data: { vehicleId: string; description: string; severity?: string; setMaintenanceStatus?: boolean }): Promise<{ issue: VehicleIssue; maintenanceSet: boolean; affectedBookings: Booking[] }> {
    return this.request('/vehicle-issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIssue(id: string, data: { status?: string; resolutionNotes?: string }): Promise<VehicleIssue> {
    return this.request<VehicleIssue>(`/vehicle-issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- VEHICLE MAINTENANCE ---
  async getMaintenance(vehicleId?: string): Promise<VehicleMaintenance[]> {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<VehicleMaintenance[]>(`/maintenance${qs}`);
  }

  async getMaintenanceOverview(): Promise<any> {
    return this.request<any>('/maintenance/overview');
  }

  async createMaintenance(data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> {
    return this.request<VehicleMaintenance>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaintenance(id: string, data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> {
    return this.request<VehicleMaintenance>(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMaintenance(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/maintenance/${id}`, {
      method: 'DELETE',
    });
  }

  // --- FUEL MANAGEMENT ---
  async getFuelRecords(vehicleId?: string): Promise<FuelRecord[]> {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<FuelRecord[]>(`/fuel${qs}`);
  }

  async getFuelStats(): Promise<FuelStats> {
    return this.request<FuelStats>('/fuel/stats');
  }

  async createFuelRecord(data: Partial<FuelRecord>): Promise<FuelRecord> {
    return this.request<FuelRecord>('/fuel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<InAppNotification[]> {
    return this.request<InAppNotification[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<InAppNotification> {
    return this.request<InAppNotification>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  // --- AUDIT LOGS ---
  async getAuditLogs(query?: { entityType?: string; entityId?: string }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (query?.entityType) params.append('entityType', query.entityType);
    if (query?.entityId) params.append('entityId', query.entityId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<AuditLog[]>(`/audit-logs${qs}`);
  }

  // --- USERS ---
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getOwnProfile(): Promise<User> {
    return this.request<User>('/users/profile/me');
  }

  async updateOwnProfile(data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    jobTitle?: string;
    licenseNumber?: string;
  }): Promise<User> {
    return this.request<User>('/users/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    employeeId?: string;
    departmentId?: string;
    phone?: string;
    jobTitle?: string;
    licenseNumber?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- DEPARTMENTS ---
  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/departments');
  }

  async createDepartment(data: { name: string; code?: string; description?: string }): Promise<Department> {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    return this.request<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string): Promise<void> {
    return this.request<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // --- AUTH & PROFILE ---
  async forgotPassword(
    identifier: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string; requestId?: string; alreadyPending?: boolean }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, reason }),
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
    identifier?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, identifier }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getResetRequests(status?: string): Promise<PasswordResetRequest[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<PasswordResetRequest[]>(`/auth/admin/reset-requests${query}`);
  }

  async approveResetRequest(
    requestId: string,
    data?: {
      expiresInMinutes?: number;
      adminNotes?: string;
      forcePasswordChange?: boolean;
    },
  ): Promise<{
    success: boolean;
    message: string;
    emailDeliveryStatus?: string;
    emailError?: string | null;
    expiresAt?: string;
    user?: { id: string; name: string; email: string };
  }> {
    return this.request(`/auth/admin/reset-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async resendResetPassphrase(
    requestId: string,
    data?: {
      expiresInMinutes?: number;
      adminNotes?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
    emailDeliveryStatus?: string;
    emailError?: string | null;
    expiresAt?: string;
  }> {
    return this.request(`/auth/admin/reset-requests/${requestId}/resend`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async rejectResetRequest(
    requestId: string,
    rejectReason?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/auth/admin/reset-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason }),
    });
  }

  async adminResetPassword(
    userId: string,
    forcePasswordChange = true,
    passphrase?: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string; passphrase?: string; expiresAt?: string }> {
    return this.request(`/auth/admin/reset-password/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ forcePasswordChange, passphrase }),
    });
  }


  // --- SETTINGS & DANGER ZONE ---
  async getSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>('/settings');
  }

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return this.request<SystemSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async purgeOperationsData(adminPassword: string, confirmationPhrase: string): Promise<{ success: boolean; message: string; purgedSummary: any; retained: string[] }> {
    return this.request('/settings/danger/purge-operations', {
      method: 'POST',
      body: JSON.stringify({ adminPassword, confirmationPhrase }),
    });
  }

  // --- BOOKING DAYS ---
  async updateBookingDay(dayId: string, data: { status?: string; vehicleId?: string; driverId?: string; notes?: string }): Promise<any> {
    return this.request(`/bookings/days/${dayId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();



