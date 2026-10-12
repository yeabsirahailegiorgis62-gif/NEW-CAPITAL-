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
} from '@/types';

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

  // --- BOOKINGS ---
  async createBooking(data: {
    destination: string;
    purpose: string;
    departureAt: string;
    expectedReturnAt: string;
    passengerCount: number;
    preferredVehicleId?: string;
    requiresDriver: boolean;
    additionalNotes?: string;
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

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
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

  async assignVehicle(bookingId: string, data: { vehicleId: string; driverName?: string; driverPhone?: string; assignmentNotes?: string }): Promise<VehicleAssignment> {
    return this.request<VehicleAssignment>(`/bookings/${bookingId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startTrip(bookingId: string, data?: { actualDepartureAt?: string; startOdometer?: number }): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}/start`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async completeTrip(bookingId: string, data?: { actualReturnAt?: string; endOdometer?: number; notes?: string; reportedProblem?: string }): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async getLogisticsDashboardStats(): Promise<LogisticsDashboardStats> {
    return this.request<LogisticsDashboardStats>('/bookings/stats');
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

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
