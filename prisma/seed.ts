import { PrismaClient, UserRole, VehicleCategory, VehicleOperationalStatus, BookingStatus, IssueSeverity, IssueStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Capital Fleet Database ---');

  // 1. Clean existing records (in dependency order)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.vehicleIssue.deleteMany();
  await prisma.vehicleAssignment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Create Departments
  const deptEngineering = await prisma.department.create({
    data: {
      name: 'Project Engineering & Construction',
      description: 'Oversees site development and structural projects across Addis Ababa',
    },
  });

  const deptLogistics = await prisma.department.create({
    data: {
      name: 'Logistics & Fleet Operations',
      description: 'Central vehicle coordination, fleet scheduling, and maintenance',
    },
  });

  const deptExecutive = await prisma.department.create({
    data: {
      name: 'Executive & Administrative Office',
      description: 'Corporate leadership, legal, and operational strategy',
    },
  });

  const deptSales = await prisma.department.create({
    data: {
      name: 'Sales & Client Relations',
      description: 'Client site visits, showroom transports, and property marketing',
    },
  });

  // 3. Create Users
  const defaultPasswordHash = await bcrypt.hash('CapitalFleet2026!', 10);

  const userEmployee1 = await prisma.user.create({
    data: {
      name: 'Dawit Kebede',
      email: 'employee@capitalre.com',
      employeeId: 'EMP-101',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptEngineering.id,
      phone: '+251 91 123 4567',
      jobTitle: 'Senior Project Engineer',
      licenseNumber: 'ET-DL-84912',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
  });

  const userEmployee2 = await prisma.user.create({
    data: {
      name: 'Bethlehem Alemu',
      email: 'bethlehem@capitalre.com',
      employeeId: 'EMP-102',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptSales.id,
      phone: '+251 92 345 6789',
      jobTitle: 'Real Estate Consultant',
      licenseNumber: 'ET-DL-91823',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
  });

  const userLogisticsAdmin = await prisma.user.create({
    data: {
      name: 'Selamawit Tadesse',
      email: 'logistics@capitalre.com',
      employeeId: 'LOG-201',
      passwordHash: defaultPasswordHash,
      role: UserRole.LOGISTICS_ADMIN,
      departmentId: deptLogistics.id,
      phone: '+251 93 456 7890',
      jobTitle: 'Head of Fleet & Logistics',
      licenseNumber: 'ET-DL-74910',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    },
  });

  const userSystemAdmin = await prisma.user.create({
    data: {
      name: 'Ermias Haile',
      email: 'admin@capitalre.com',
      employeeId: 'SYS-001',
      passwordHash: defaultPasswordHash,
      role: UserRole.SYSTEM_ADMIN,
      departmentId: deptExecutive.id,
      phone: '+251 94 567 8901',
      jobTitle: 'Chief Information Officer',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
  });

  console.log('Seeded Users:');
  console.log(' - Dawit Kebede (employee@capitalre.com) -> EMPLOYEE');
  console.log(' - Bethlehem Alemu (bethlehem@capitalre.com) -> EMPLOYEE');
  console.log(' - Selamawit Tadesse (logistics@capitalre.com) -> LOGISTICS_ADMIN');
  console.log(' - Ermias Haile (admin@capitalre.com) -> SYSTEM_ADMIN');

  // 4. Create Vehicles with rich images and telemetry
  const vPrado = await prisma.vehicle.create({
    data: {
      name: 'Land Cruiser Prado TX',
      make: 'Toyota',
      model: 'Prado 2022',
      registrationNumber: '3-A12490',
      category: VehicleCategory.SUV,
      passengerCapacity: 7,
      operationalStatus: VehicleOperationalStatus.ACTIVE,
      imageUrl: '/vehicles/prado.png',
      fuelLevel: 92,
      mileage: 18450,
      transmission: 'Automatic 4WD',
      fuelType: 'Diesel',
      description: 'Executive 4WD suited for regional project sites and highway travel',
      notes: 'Fuel card allocated. Air conditioning operational.',
    },
  });

  const vHilux = await prisma.vehicle.create({
    data: {
      name: 'Hilux Double Cab',
      make: 'Toyota',
      model: 'Hilux 2.8 D-4D',
      registrationNumber: '3-B48201',
      category: VehicleCategory.PICKUP,
      passengerCapacity: 5,
      operationalStatus: VehicleOperationalStatus.ACTIVE,
      imageUrl: '/vehicles/hilux.png',
      fuelLevel: 78,
      mileage: 34200,
      transmission: 'Manual 4x4',
      fuelType: 'Diesel',
      description: 'Heavy duty construction site utility vehicle with cargo bed',
    },
  });

  const vHiAce = await prisma.vehicle.create({
    data: {
      name: 'HiAce Commuter Minibus',
      make: 'Toyota',
      model: 'HiAce High Roof',
      registrationNumber: '3-C99120',
      category: VehicleCategory.MINIBUS,
      passengerCapacity: 14,
      operationalStatus: VehicleOperationalStatus.ACTIVE,
      imageUrl: '/vehicles/hiace.png',
      fuelLevel: 85,
      mileage: 41900,
      transmission: 'Manual',
      fuelType: 'Diesel',
      description: 'Group transport for construction engineering crews and surveyors',
    },
  });

  const vCorolla = await prisma.vehicle.create({
    data: {
      name: 'Corolla Altis Sedan',
      make: 'Toyota',
      model: 'Corolla 1.8G',
      registrationNumber: '3-A77610',
      category: VehicleCategory.SEDAN,
      passengerCapacity: 5,
      operationalStatus: VehicleOperationalStatus.ACTIVE,
      imageUrl: '/vehicles/corolla.png',
      fuelLevel: 65,
      mileage: 12800,
      transmission: 'CVT Automatic',
      fuelType: 'Petrol',
      description: 'Urban pool vehicle for city meetings and document delivery',
    },
  });

  const vRanger = await prisma.vehicle.create({
    data: {
      name: 'Ford Ranger XLT',
      make: 'Ford',
      model: 'Ranger 3.2 4x4',
      registrationNumber: '3-B33190',
      category: VehicleCategory.PICKUP,
      passengerCapacity: 5,
      operationalStatus: VehicleOperationalStatus.ACTIVE,
      imageUrl: '/vehicles/ranger.png',
      fuelLevel: 90,
      mileage: 26500,
      transmission: 'Automatic 4x4',
      fuelType: 'Diesel',
      description: 'Field inspection pickup with off-road suspension package',
    },
  });

  const vDMax = await prisma.vehicle.create({
    data: {
      name: 'Isuzu D-Max Utility',
      make: 'Isuzu',
      model: 'D-Max 2.5',
      registrationNumber: '3-B66290',
      category: VehicleCategory.PICKUP,
      passengerCapacity: 5,
      operationalStatus: VehicleOperationalStatus.MAINTENANCE,
      imageUrl: '/vehicles/dmax.png',
      fuelLevel: 45,
      mileage: 58900,
      transmission: 'Manual',
      fuelType: 'Diesel',
      description: 'Scheduled for brake caliper and suspension servicing',
      notes: 'Under maintenance at Capital Fleet central workshop until end of week.',
    },
  });

  // 5. Vehicle Issue for D-Max
  await prisma.vehicleIssue.create({
    data: {
      vehicleId: vDMax.id,
      reportedById: userLogisticsAdmin.id,
      description: 'Brake pad wear detected during periodic inspection. Caliper rebuild in progress.',
      severity: IssueSeverity.HIGH,
      status: IssueStatus.IN_REVIEW,
      resolutionNotes: 'Parts ordered from regional distributor; scheduled completion in 48 hours.',
    },
  });

  // 6. Realistic Bookings
  const now = new Date();
  const departure1 = new Date(now.getTime() + 1000 * 60 * 60 * 2); // 2 hours from now
  const return1 = new Date(departure1.getTime() + 1000 * 60 * 60 * 4); // 4 hour trip

  const bookingAssigned = await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0001',
      requesterId: userEmployee1.id,
      destination: 'Bole Bulbula Site No. 4',
      purpose: 'Structural foundation inspection and concrete pour quality audit',
      departureAt: departure1,
      expectedReturnAt: return1,
      passengerCount: 3,
      requiresDriver: true,
      status: BookingStatus.ASSIGNED,
      additionalNotes: 'Requires 4WD capability due to unpaved access road near site entrance',
    },
  });

  // Vehicle assignment for booking 1
  await prisma.vehicleAssignment.create({
    data: {
      bookingId: bookingAssigned.id,
      vehicleId: vPrado.id,
      assignedById: userLogisticsAdmin.id,
      driverName: 'Abebe Molla',
      driverPhone: '+251 91 123 4567',
      assignmentNotes: 'Assigned Toyota Land Cruiser Prado with certified company driver.',
    },
  });

  // Booking 2: Pending Approval
  const departure2 = new Date(now.getTime() + 1000 * 60 * 60 * 26); // Tomorrow morning
  const return2 = new Date(departure2.getTime() + 1000 * 60 * 60 * 6);

  await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0002',
      requesterId: userEmployee2.id,
      destination: 'CMC Heights Luxury Apartments Showroom',
      purpose: 'High-value international investor client tour and contract signing',
      departureAt: departure2,
      expectedReturnAt: return2,
      passengerCount: 4,
      requiresDriver: false,
      status: BookingStatus.PENDING_APPROVAL,
      additionalNotes: 'Clean executive vehicle requested for prospective property buyers.',
    },
  });

  // 7. Initial notifications
  await prisma.notification.create({
    data: {
      recipientId: userEmployee1.id,
      bookingId: bookingAssigned.id,
      type: 'BOOKING_ASSIGNED',
      title: 'Vehicle Assigned for Your Trip',
      message: `Your booking CR-2026-0001 to Bole Bulbula Site No. 4 has been assigned Toyota Land Cruiser Prado (3-A12490) with driver Abebe Molla.`,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: userLogisticsAdmin.id,
      type: 'NEW_BOOKING_REQUEST',
      title: 'New Booking Awaiting Review',
      message: 'Bethlehem Alemu submitted request CR-2026-0002 for CMC Heights Luxury Apartments Showroom.',
    },
  });

  // 8. Initial audit record
  await prisma.auditLog.create({
    data: {
      actorId: userLogisticsAdmin.id,
      actorName: userLogisticsAdmin.name,
      entityType: 'Booking',
      entityId: bookingAssigned.id,
      action: 'ASSIGN_VEHICLE',
      newValues: {
        bookingReference: 'CR-2026-0001',
        vehicle: 'Toyota Land Cruiser Prado (3-A12490)',
        driver: 'Abebe Molla',
      },
    },
  });

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
