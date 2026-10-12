export type UserRole = 'EMPLOYEE' | 'LOGISTICS_ADMIN' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  employeeId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
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

export interface Booking {
  id: string;
  bookingReference: string;
  requesterId: string;
  requester?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    department?: {
      id: string;
      name: string;
    } | null;
  };
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
  driverName?: string | null;
  driverPhone?: string | null;
  assignedAt: string;
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
  description?: string | null;
  createdAt: string;
}

export interface LogisticsDashboardStats {
  pendingRequests: number;
  approvedAwaitingAssignment: number;
  vehiclesAssignedToday: number;
  availableVehicles: number;
  tripsInProgress: number;
  vehiclesInMaintenance: number;
}
