import { PrismaClient, UserRole, VehicleCategory, VehicleOperationalStatus, BookingStatus, IssueSeverity, IssueStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Capital Fleet Database ---');

  // 1. Clean existing records in foreign key dependency order
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.vehicleIssue.deleteMany();
  await prisma.vehicleAssignment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Create All 8 Company Departments with unique codes
  const deptEngineering = await prisma.department.create({
    data: {
      name: 'Project Engineering & Construction',
      code: 'ENG-01',
      description: 'Oversees building development and structural projects across Addis Ababa',
      isActive: true,
    },
  });

  const deptFinance = await prisma.department.create({
    data: {
      name: 'Finance & Procurement',
      code: 'FIN-02',
      description: 'Financial audits, corporate treasury, escrow, and vendor procurement',
      isActive: true,
    },
  });

  const deptHR = await prisma.department.create({
    data: {
      name: 'Human Resources & Talent Management',
      code: 'HR-03',
      description: 'Personnel recruitment, talent development, and employee affairs',
      isActive: true,
    },
  });

  const deptIT = await prisma.department.create({
    data: {
      name: 'Information Technology & Systems',
      code: 'IT-04',
      description: 'Cloud infrastructure, enterprise ERP, networks, and smart property tech',
      isActive: true,
    },
  });

  const deptAdmin = await prisma.department.create({
    data: {
      name: 'General Administration & Facilities',
      code: 'ADM-05',
      description: 'Office operations, security protocols, and property maintenance',
      isActive: true,
    },
  });

  const deptSales = await prisma.department.create({
    data: {
      name: 'Sales & Real Estate Marketing',
      code: 'MKT-06',
      description: 'Client property walkthroughs, showroom appointments, and buyer relations',
      isActive: true,
    },
  });

  const deptLogistics = await prisma.department.create({
    data: {
      name: 'Logistics & Fleet Operations',
      code: 'LOG-07',
      description: 'Central fleet coordination, chauffeur dispatch, and workshop maintenance',
      isActive: true,
    },
  });

  const deptExecutive = await prisma.department.create({
    data: {
      name: 'Executive & Corporate Strategy',
      code: 'EXEC-08',
      description: 'C-Suite leadership, legal affairs, and strategic real estate investments',
      isActive: true,
    },
  });

  // 3. Create Users & Credentials
  const defaultPasswordHash = await bcrypt.hash('CapitalFleet2026!', 10);

  // A. System Administrator
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

  // B. Logistics Admin
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

  // C. Drivers (Dedicated Driver Accounts)
  const userDriver1 = await prisma.user.create({
    data: {
      name: 'Abebe Molla',
      email: 'driver.abebe@capitalre.com',
      employeeId: 'DRV-301',
      passwordHash: defaultPasswordHash,
      role: UserRole.DRIVER,
      departmentId: deptLogistics.id,
      phone: '+251 91 123 4567',
      jobTitle: 'Senior Fleet Chauffeur',
      licenseNumber: 'ETH-DL-8849',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
  });

  const userDriver2 = await prisma.user.create({
    data: {
      name: 'Mulugeta Tadesse',
      email: 'driver.mulugeta@capitalre.com',
      employeeId: 'DRV-302',
      passwordHash: defaultPasswordHash,
      role: UserRole.DRIVER,
      departmentId: deptLogistics.id,
      phone: '+251 92 345 6789',
      jobTitle: 'Heavy Commercial & Minibus Chauffeur',
      licenseNumber: 'ETH-DL-9102',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    },
  });

  const userDriver3 = await prisma.user.create({
    data: {
      name: 'Dawit Yohannes',
      email: 'driver.dawit@capitalre.com',
      employeeId: 'DRV-303',
      passwordHash: defaultPasswordHash,
      role: UserRole.DRIVER,
      departmentId: deptLogistics.id,
      phone: '+251 93 456 7890',
      jobTitle: 'Site Inspection & Utility Chauffeur',
      licenseNumber: 'ETH-DL-4412',
    },
  });

  const userDriver4 = await prisma.user.create({
    data: {
      name: 'Tewodros Kassahun',
      email: 'driver.tewodros@capitalre.com',
      employeeId: 'DRV-304',
      passwordHash: defaultPasswordHash,
      role: UserRole.DRIVER,
      departmentId: deptLogistics.id,
      phone: '+251 91 555 7891',
      jobTitle: 'Commuter Shuttle Operator',
      licenseNumber: 'ETH-DL-6310',
    },
  });

  // D. Departmental Employees
  const userEmpEngineering = await prisma.user.create({
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

  const userEmpFinance = await prisma.user.create({
    data: {
      name: 'Almaz Ayana',
      email: 'employee.finance@capitalre.com',
      employeeId: 'EMP-102',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptFinance.id,
      phone: '+251 91 999 1122',
      jobTitle: 'Senior Financial Auditor',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
  });

  const userEmpHR = await prisma.user.create({
    data: {
      name: 'Kassahun Desta',
      email: 'employee.hr@capitalre.com',
      employeeId: 'EMP-103',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptHR.id,
      phone: '+251 92 888 3344',
      jobTitle: 'HR Director',
    },
  });

  const userEmpIT = await prisma.user.create({
    data: {
      name: 'Yared Negash',
      email: 'employee.it@capitalre.com',
      employeeId: 'EMP-104',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptIT.id,
      phone: '+251 93 777 5566',
      jobTitle: 'Enterprise Systems Architect',
    },
  });

  const userEmpAdmin = await prisma.user.create({
    data: {
      name: 'Tigist Belay',
      email: 'employee.admin@capitalre.com',
      employeeId: 'EMP-105',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptAdmin.id,
      phone: '+251 94 666 7788',
      jobTitle: 'Corporate Affairs Administrator',
    },
  });

  const userEmpSales = await prisma.user.create({
    data: {
      name: 'Bethlehem Alemu',
      email: 'bethlehem@capitalre.com',
      employeeId: 'EMP-106',
      passwordHash: defaultPasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: deptSales.id,
      phone: '+251 92 345 6789',
      jobTitle: 'Real Estate Consultant',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
  });

  // 4. Vehicles
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
      mileage: 42100,
      transmission: 'Manual',
      fuelType: 'Diesel',
      description: 'High-capacity staff and delegation transporter',
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
      mileage: 21300,
      transmission: 'CVT Automatic',
      fuelType: 'Petrol',
      description: 'Comfortable urban sedan for administrative errands and meetings',
    },
  });

  const vRanger = await prisma.vehicle.create({
    data: {
      name: 'Ford Ranger XLT',
      make: 'Ford',
      model: 'Ranger 2.0 Bi-Turbo',
      registrationNumber: '3-B91044',
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

  // 5. Vehicle Issue
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

  // 6. Bookings & Driver Assignments (Linked to Driver Abebe Molla)
  const now = new Date();

  // Booking 1: Upcoming Assigned Trip for Driver Abebe Molla (Daily)
  const dep1 = new Date(now.getTime() + 1000 * 60 * 60 * 2);
  const ret1 = new Date(dep1.getTime() + 1000 * 60 * 60 * 4);
  const booking1 = await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0001',
      requesterId: userEmpEngineering.id,
      destination: 'Bole Bulbula Site No. 4, Addis Ababa',
      purpose: 'Structural foundation inspection and concrete pour quality audit',
      departureAt: dep1,
      expectedReturnAt: ret1,
      passengerCount: 3,
      requiresDriver: true,
      status: BookingStatus.ASSIGNED,
      additionalNotes: 'Requires 4WD capability due to unpaved access road near site entrance',
    },
  });

  await prisma.vehicleAssignment.create({
    data: {
      bookingId: booking1.id,
      vehicleId: vPrado.id,
      assignedById: userLogisticsAdmin.id,
      driverId: userDriver1.id,
      driverName: 'Abebe Molla',
      driverPhone: '+251 91 123 4567',
      assignmentNotes: 'Assigned Toyota Land Cruiser Prado with certified company driver Abebe Molla.',
    },
  });

  // Booking 2: Active Trip In-Progress for Driver Abebe Molla
  const dep2 = new Date(now.getTime() - 1000 * 60 * 45); // started 45 mins ago
  const ret2 = new Date(now.getTime() + 1000 * 60 * 90); // returns in 90 mins
  const booking2 = await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0002',
      requesterId: userEmpFinance.id,
      destination: 'Commercial Bank of Ethiopia Head Office, Churchill Ave',
      purpose: 'Escrow account audit documentation and treasury check clearance',
      departureAt: dep2,
      expectedReturnAt: ret2,
      actualDepartureAt: dep2,
      startOdometer: 34200,
      passengerCount: 2,
      requiresDriver: true,
      status: BookingStatus.IN_PROGRESS,
      additionalNotes: 'Urgent banking clearance before central clearing cutoff.',
    },
  });

  await prisma.vehicleAssignment.create({
    data: {
      bookingId: booking2.id,
      vehicleId: vHilux.id,
      assignedById: userLogisticsAdmin.id,
      driverId: userDriver1.id,
      driverName: 'Abebe Molla',
      driverPhone: '+251 91 123 4567',
      assignmentNotes: 'Live mission dispatch under way.',
    },
  });

  // Booking 3: Completed Trip History for Driver Abebe Molla (Weekly Itinerary)
  const dep3 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5); // 5 days ago
  const ret3 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1); // 1 day ago
  const booking3 = await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0003',
      requesterId: userEmpSales.id,
      destination: 'CMC Heights Luxury Apartments Showroom & Kazanchis Towers',
      purpose: 'Weekly investor tour: international buyer delegations from UAE and Kenya',
      departureAt: dep3,
      expectedReturnAt: ret3,
      actualDepartureAt: dep3,
      actualReturnAt: ret3,
      startOdometer: 17900,
      endOdometer: 18450,
      passengerCount: 6,
      requiresDriver: true,
      status: BookingStatus.COMPLETED,
      additionalNotes: 'Weekly itinerary successfully closed. All property viewings concluded.',
    },
  });

  await prisma.vehicleAssignment.create({
    data: {
      bookingId: booking3.id,
      vehicleId: vPrado.id,
      assignedById: userLogisticsAdmin.id,
      driverId: userDriver1.id,
      driverName: 'Abebe Molla',
      driverPhone: '+251 91 123 4567',
      assignmentNotes: 'Weekly itinerary concluded with zero incidents. 550 km logged.',
    },
  });

  // Booking 4: Pending Approval from IT Department
  const dep4 = new Date(now.getTime() + 1000 * 60 * 60 * 28);
  const ret4 = new Date(dep4.getTime() + 1000 * 60 * 60 * 5);
  await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0004',
      requesterId: userEmpIT.id,
      destination: 'Ethio Telecom Data Center & Gulele Tower Node',
      purpose: 'High-speed fiber termination and server telemetry deployment',
      departureAt: dep4,
      expectedReturnAt: ret4,
      passengerCount: 2,
      requiresDriver: false,
      status: BookingStatus.PENDING_APPROVAL,
      additionalNotes: 'Delicate fiber splicing instruments to be transported.',
    },
  });

  // Booking 5: Approved (Awaiting Vehicle Assignment) from HR Department
  const dep5 = new Date(now.getTime() + 1000 * 60 * 60 * 18);
  const ret5 = new Date(dep5.getTime() + 1000 * 60 * 60 * 8);
  await prisma.booking.create({
    data: {
      bookingReference: 'CR-2026-0005',
      requesterId: userEmpHR.id,
      destination: 'Addis Ababa University Institute of Technology (AAiT)',
      purpose: 'Annual engineering campus recruitment & graduate interview panels',
      departureAt: dep5,
      expectedReturnAt: ret5,
      passengerCount: 4,
      requiresDriver: true,
      status: BookingStatus.APPROVED,
      additionalNotes: 'Approved by Logistics. Pending vehicle allocation.',
    },
  });

  // 7. Initial notifications
  await prisma.notification.create({
    data: {
      recipientId: userDriver1.id,
      bookingId: booking1.id,
      type: 'VEHICLE_ASSIGNED',
      title: 'New Trip Assignment: CR-2026-0001',
      message: 'You have been assigned to drive Dawit Kebede (Engineering) to Bole Bulbula Site No. 4.',
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: userLogisticsAdmin.id,
      type: 'NEW_BOOKING_REQUEST',
      title: 'New Request: CR-2026-0004',
      message: 'Yared Negash (IT) submitted a request for Ethio Telecom Data Center.',
    },
  });

  // 8. Initial audit record
  await prisma.auditLog.create({
    data: {
      actorId: userLogisticsAdmin.id,
      actorName: userLogisticsAdmin.name,
      entityType: 'Booking',
      entityId: booking1.id,
      action: 'ASSIGN_VEHICLE',
      newValues: {
        bookingReference: 'CR-2026-0001',
        vehicle: 'Toyota Land Cruiser Prado (3-A12490)',
        driver: 'Abebe Molla',
      },
    },
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Capital Fleet Database Seeding Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login Accounts Seeded:');
  console.log('  1. System Admin:     admin@capitalre.com / CapitalFleet2026!');
  console.log('  2. Logistics Admin:  logistics@capitalre.com / CapitalFleet2026!');
  console.log('  3. Driver:           driver.abebe@capitalre.com / CapitalFleet2026!');
  console.log('  4. Driver (Heavy):   driver.mulugeta@capitalre.com / CapitalFleet2026!');
  console.log('  5. Engineering:      employee@capitalre.com / CapitalFleet2026!');
  console.log('  6. Finance:          employee.finance@capitalre.com / CapitalFleet2026!');
  console.log('  7. Human Resources:  employee.hr@capitalre.com / CapitalFleet2026!');
  console.log('  8. Information Tech: employee.it@capitalre.com / CapitalFleet2026!');
  console.log('  9. Administration:   employee.admin@capitalre.com / CapitalFleet2026!');
  console.log(' 10. Sales/Marketing:  bethlehem@capitalre.com / CapitalFleet2026!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
