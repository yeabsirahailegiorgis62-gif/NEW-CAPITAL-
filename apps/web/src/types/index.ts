export type UserRole = 'EMPLOYEE' | 'DRIVER' | 'LOGISTICS_ADMIN' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  employeeId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  licenseNumber?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

export type VehicleCategory = 'SEDAN' | 'SUV' | 'PICKUP' | 'MINIBUS' | 'OTHER';

export type VehicleOperationalStatus = 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE';

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  registrationNumber: string;
  category: VehicleCategory;
  passengerCapacity: number;
  operationalStatus: VehicleOperationalStatus;
  imageUrl?: string | null;
  fuelLevel?: number | null;
  mileage?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  description?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface BookingDay {
  id: string;
  bookingId: string;
  dayOfWeek: string;
  tripDate: string;
  timeSlot: 'MORNING' | 'AFTERNOON';
  status: BookingStatus | string;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  driverId?: string | null;
  driver?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  requesterId: string;
  requester?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    phone?: string | null;
    departmentId?: string | null;
    department?: {
      id: string;
      name: string;
    } | null;
  };
  requestType?: 'DAILY' | 'WEEKLY';
  pickupLocation?: string | null;
  contactPhone?: string | null;
  destination: string;
  purpose: string;
  departureAt: string;
  expectedReturnAt: string;
  actualDepartureAt?: string | null;
  actualReturnAt?: string | null;
  startOdometer?: number | null;
  endOdometer?: number | null;
  passengerCount: number;
  preferredVehicleId?: string | null;
  preferredVehicle?: Vehicle | null;
  requiresDriver: boolean;
  status: BookingStatus;
  additionalNotes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  assignments?: VehicleAssignment[];
  currentAssignment?: VehicleAssignment | null;
  bookingDays?: BookingDay[];
}

export interface SystemSettings {
  maxFailedLoginAttempts: number;
  accountLockoutDuration: number;
  sessionTimeout: number;
  requireStrongPassword: boolean;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  forcePasswordChangeAfterReset: boolean;
  passwordResetExpiresMinutes: number;
  minimumNoticeHours: number;
  maxPassengerCapacity: number;
  allowSameDayRequests: boolean;
  allowWeekendRequests: boolean;
  allowHolidayRequests: boolean;
  requireRequestApproval: boolean;
  pendingRequestExpirationHours: number;
  allowCancelPending: boolean;
  allowEditPending: boolean;
  allowCancelAfterApproval: boolean;
  preventDoubleVehicleAssignment: boolean;
  preventDoubleDriverAssignment: boolean;
  onlyShowAvailableVehicles: boolean;
  onlyShowActiveDrivers: boolean;
  requireDriverConfirmation: boolean;
  autoSuggestSuitableVehicle: boolean;
  [key: string]: any;
}

export interface VehicleAssignment {
  id: string;
  bookingId: string;
  vehicleId: string;
  vehicle?: Vehicle;
  assignedById: string;
  assignedBy?: {
    id: string;
    name: string;
  };
  driverId?: string | null;
  driver?: User | null;
  driverName?: string | null;
  driverPhone?: string | null;
  assignedAt: string;
  startOdometer?: number | null;
  endOdometer?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  unassignedAt?: string | null;
  assignmentNotes?: string | null;
}

export interface InAppNotification {
  id: string;
  recipientId: string;
  bookingId?: string | null;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
  booking?: Booking | null;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  createdAt: string;
}

export interface VehicleIssue {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  reportedById: string;
  reportedBy?: {
    id: string;
    name: string;
  };
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  resolutionNotes?: string | null;
  reportedAt: string;
  resolvedAt?: string | null;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  createdAt: string;
  _count?: {
    users: number;
  };
}

export interface LogisticsDashboardStats {
  pendingRequests: number;
  approvedAwaitingAssignment: number;
  vehiclesAssignedToday: number;
  availableVehicles: number;
  tripsInProgress: number;
  vehiclesInMaintenance: number;
}

export interface BookingVerificationResult {
  isValid: boolean;
  verificationStatus: 'VALID' | 'EXPIRED' | 'CANCELLED' | 'REJECTED' | 'PENDING' | 'COMPLETED' | 'INVALID';
  bookingReference: string;
  status?: BookingStatus;
  message?: string;
  requester?: {
    name: string;
    employeeId: string;
    department: string;
  };
  trip?: {
    destination: string;
    purpose: string;
    departureAt: string;
    expectedReturnAt: string;
    passengerCount: number;
    requiresDriver: boolean;
  };
  assignment?: {
    vehicleName: string;
    make: string;
    model: string;
    registrationNumber: string;
    category: VehicleCategory;
    driverName: string;
    assignedBy: string;
    assignedAt: string;
  } | null;
  approvalDate?: string;
  verifiedAt: string;
  securityNotice?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseClass?: string;
  status: 'AVAILABLE' | 'ON_MISSION' | 'OFF_DUTY';
  totalTrips: number;
  completedTrips: number;
  avatarUrl?: string;
  assignedVehicleId?: string;
  assignedVehicle?: Vehicle;
  notes?: string;
  createdAt: string;
}

export interface WeeklyItineraryStop {
  dayName: string;
  date: string;
  destination: string;
  purpose: string;
  departureTime: string;
  returnTime: string;
}

export interface TransportSystemRules {
  dailyNoticeHours: number;
  weeklyNoticeHours: number;
  maxAdvanceBookingDays: number;
  requireWeekendApproval: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  organizationName: string;
  dispatchEmail: string;
  dispatchPhone: string;
  dispatchLocation: string;
}
