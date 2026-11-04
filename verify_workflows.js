const http = require('http');

const API_BASE = 'http://localhost:4100/api';

async function request(endpoint, options = {}) {
  const url = new URL(API_BASE + endpoint);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const start = Date.now();
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const duration = Date.now() - start;
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({
            status: res.statusCode,
            data: parsed,
            duration,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function login(email, password = 'CapitalFleet2026!') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { identifier: email, password },
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return {
    token: res.data.accessToken || res.data.token,
    user: res.data.user,
    duration: res.duration,
  };
}

async function runAllTests() {
  console.log('====================================================');
  console.log('   CAPITAL FLEET - SYSTEM INTEGRITY VERIFICATION    ');
  console.log('====================================================\n');

  const results = {
    passed: 0,
    failed: 0,
    timings: {},
  };

  function assert(condition, testName, details = '') {
    if (condition) {
      results.passed++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      results.failed++;
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    // 1. Authenticate users
    console.log('--- Phase 4: Authentication & Role Setup ---');
    const adminAuth = await login('admin@capitalre.com');
    assert(adminAuth.user.role === 'SYSTEM_ADMIN', 'Admin authentication', `Role: ${adminAuth.user.role}`);
    results.timings['Admin Login'] = adminAuth.duration;

    const logisticsAuth = await login('logistics@capitalre.com');
    assert(logisticsAuth.user.role === 'LOGISTICS_ADMIN', 'Logistics Admin authentication', `Role: ${logisticsAuth.user.role}`);
    results.timings['Logistics Login'] = logisticsAuth.duration;

    const employeeAuth = await login('employee@capitalre.com');
    assert(employeeAuth.user.role === 'EMPLOYEE', 'Employee authentication', `Role: ${employeeAuth.user.role}`);
    results.timings['Employee Login'] = employeeAuth.duration;

    const driverAuth = await login('driver.abebe@capitalre.com');
    assert(driverAuth.user.role === 'DRIVER', 'Driver authentication', `Role: ${driverAuth.user.role}`);
    results.timings['Driver Login'] = driverAuth.duration;

    // Fetch vehicles and drivers for assignments
    const vRes = await request('/vehicles', {
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    const vehicles = Array.isArray(vRes.data) ? vRes.data : vRes.data.data;
    assert(vRes.status === 200 && vehicles.length > 0, 'Fetch active fleet vehicles');
    results.timings['Fetch Vehicles'] = vRes.duration;

    const uRes = await request('/users', {
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    const allUsers = Array.isArray(uRes.data) ? uRes.data : uRes.data.data;
    const drivers = allUsers.filter((u) => u.role === 'DRIVER');
    assert(uRes.status === 200 && drivers.length > 0, 'Fetch available company chauffeurs');
    results.timings['Fetch Drivers'] = uRes.duration;

    const vehicle1 = vehicles[0];
    const vehicle2 = vehicles[1] || vehicles[0];
    const driver1 = driverAuth.user;
    const driver2 = drivers.find((d) => d.id !== driverAuth.user.id) || drivers[0];

    // Dynamic base offset to avoid date collisions between repeated test runs
    const baseDays = Math.floor(Math.random() * 500) + 20;

    // WORKFLOW 1: SUCCESSFUL BOOKING (End-to-End)
    console.log('\n--- Workflow 1: Successful Booking End-to-End ---');
    const tomorrow = new Date(Date.now() + 86400000 * (baseDays + 1));
    const startStr = new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString();
    const endStr = new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString();

    const createRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'CMC Site Phase 2, Addis Ababa',
        purpose: 'Executive Site Inspection & Structural Audit',
        passengerCount: 3,
        requestType: 'DAILY',
        departureAt: startStr,
        expectedReturnAt: endStr,
        priority: 'NORMAL',
      },
    });
    assert(createRes.status === 201, '1.1 Employee submits transport request', JSON.stringify(createRes.data));
    results.timings['Submit Booking'] = createRes.duration;
    const booking1 = createRes.data;

    // Logistics Admin views booking
    const viewRes = await request(`/bookings/${booking1.id}`, {
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    assert(viewRes.status === 200 && viewRes.data.id === booking1.id, '1.2 Logistics Admin opens request details');
    results.timings['View Booking Details'] = viewRes.duration;

    // Logistics Admin approves request
    const approveRes = await request(`/bookings/${booking1.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    assert(approveRes.status === 200 || approveRes.status === 201, '1.3a Logistics Admin approves request', JSON.stringify(approveRes.data));
    assert(approveRes.data.status === 'APPROVED', '1.3b Booking status transitions to APPROVED');

    // Logistics Admin assigns vehicle and driver to approved request
    const assignRes = await request(`/bookings/${booking1.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        notes: 'Chauffeur assigned with luxury high-clearance SUV',
      },
    });
    assert(assignRes.status === 200 || assignRes.status === 201, '1.3d Logistics Admin assigns vehicle & driver to approved request', JSON.stringify(assignRes.data));
    results.timings['Assign Vehicle & Driver'] = assignRes.duration;

    const assignedBookingCheck = await request(`/bookings/${booking1.id}`, {
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    assert(assignedBookingCheck.data.status === 'ASSIGNED', '1.4a Booking status transitions to ASSIGNED');

    // Verify driver can see trip in their authenticated Driver Portal
    const driverPortalRes = await request(`/bookings`, {
      headers: { Authorization: `Bearer ${driverAuth.token}` },
    });
    const driverTrip = Array.isArray(driverPortalRes.data) && driverPortalRes.data.find(b => b.id === booking1.id);
    assert(Boolean(driverTrip), '1.4b Driver sees assigned trip in Driver Portal');
    assert(driverTrip && driverTrip.destination === booking1.destination, '1.4c Driver Portal displays trip destination and schedule');

    // Verify employee receives notification
    const empNotifRes = await request(`/notifications`, {
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
    });
    const assignNotif = Array.isArray(empNotifRes.data) && empNotifRes.data.find(n => n.bookingId === booking1.id);
    assert(Boolean(assignNotif), '1.4d Employee receives verified assignment notification');

    // Chauffeur confirms trip assignment
    const confirmRes = await request(`/bookings/assignments/${booking1.id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverAuth.token}` },
    });
    assert(confirmRes.status === 200 || confirmRes.status === 201, '1.5 Driver confirms assignment via /assignments/:id/confirm alias', JSON.stringify(confirmRes.data));
    results.timings['Driver Confirm Assignment'] = confirmRes.duration;

    // Driver starts trip
    const startTripRes = await request(`/bookings/${booking1.id}/start-trip`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverAuth.token}` },
      body: { startOdometer: 14500 },
    });
    assert(startTripRes.status === 200 || startTripRes.status === 201, '1.6 Driver starts trip via /start-trip alias', JSON.stringify(startTripRes.data));
    results.timings['Driver Start Trip'] = startTripRes.duration;

    // Driver completes trip
    const completeTripRes = await request(`/bookings/${booking1.id}/complete-trip`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverAuth.token}` },
      body: { endOdometer: 14532, notes: 'Trip executed safely with zero incident' },
    });
    assert(completeTripRes.status === 200 || completeTripRes.status === 201, '1.7 Driver completes trip via /complete-trip alias', JSON.stringify(completeTripRes.data));
    results.timings['Driver Complete Trip'] = completeTripRes.duration;

    // Verify final receipt data by ID
    const receiptRes = await request(`/bookings/${booking1.id}`, {
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
    });
    assert(receiptRes.status === 200 && receiptRes.data.status === 'COMPLETED', '1.8 Completed trip receipt reflects COMPLETED database status');
    assert(receiptRes.data.assignments && receiptRes.data.assignments.length > 0, '1.9 Receipt includes verified assignment details');

    // Verify receipt directly by booking reference for URL routing
    const receiptByRef = await request(`/bookings/${booking1.bookingReference}`, {
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
    });
    assert(receiptByRef.status === 200 && receiptByRef.data.bookingReference === booking1.bookingReference, '1.10 Receipt accessible directly by booking reference for URL routing');

    // WORKFLOW 2: CANCELLATION & AUDIT TRAIL
    console.log('\n--- Workflow 2: Safe Cancellation & Audit Trail ---');
    const futureDate = new Date(Date.now() + 86400000 * (baseDays + 10));
    const start2 = new Date(futureDate.setHours(10, 0, 0, 0)).toISOString();
    const end2 = new Date(futureDate.setHours(15, 0, 0, 0)).toISOString();

    const book2Res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'Bole Olympia Branch, Addis Ababa',
        purpose: 'Client Contract Closing & Escrow Finalization',
        passengerCount: 2,
        requestType: 'DAILY',
        departureAt: start2,
        expectedReturnAt: end2,
      },
    });
    const booking2 = book2Res.data;

    // Approve booking 2 before assigning
    await request(`/bookings/${booking2.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });

    // Assign vehicle
    await request(`/bookings/${booking2.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
      },
    });

    // Cancel booking as Logistics Admin
    const cancelRes = await request(`/bookings/${booking2.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        reason: 'Operational schedule change - site inspection rescheduled',
      },
    });
    assert(cancelRes.status === 200 || cancelRes.status === 201, '2.1 Logistics Admin cancels assigned booking', JSON.stringify(cancelRes.data));
    results.timings['Cancel Booking'] = cancelRes.duration;
    assert(cancelRes.data.status === 'CANCELLED', '2.2 Booking status is marked CANCELLED in database');
    assert(cancelRes.data.cancellationReason === 'Operational schedule change - site inspection rescheduled', '2.3 Cancellation reason is persisted');

    // Verify driver/vehicle can be reassigned for same period now that booking2 is cancelled
    const book3Res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'Kazanchis Headquarters',
        purpose: 'Urgent Executive Board Meeting Transfer',
        passengerCount: 1,
        requestType: 'DAILY',
        departureAt: start2,
        expectedReturnAt: end2,
      },
    });
    const booking3 = book3Res.data;

    // Approve booking 3 before assigning
    await request(`/bookings/${booking3.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });

    const reassignRes = await request(`/bookings/${booking3.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
      },
    });
    if (reassignRes.status !== 200 && reassignRes.status !== 201) {
      console.log('    [DIAGNOSTIC 2.4]', reassignRes.status, reassignRes.data);
    }
    assert(reassignRes.status === 200 || reassignRes.status === 201, '2.4 Vehicle and Chauffeur released and reassigned successfully after cancellation');

    // WORKFLOW 3: DOUBLE-BOOKING PREVENTION
    console.log('\n--- Workflow 3: Double-Booking Conflict Prevention ---');
    const overlapDate = new Date(Date.now() + 86400000 * (baseDays + 20));
    const overlapStart = new Date(overlapDate.setHours(8, 0, 0, 0)).toISOString();
    const overlapEnd = new Date(overlapDate.setHours(12, 0, 0, 0)).toISOString();

    const reqARes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'Gerji Imperial',
        purpose: 'Site Survey Alpha',
        passengerCount: 2,
        requestType: 'DAILY',
        departureAt: overlapStart,
        expectedReturnAt: overlapEnd,
      },
    });
    const reqBRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'Ayat Zone 4',
        purpose: 'Site Survey Beta',
        passengerCount: 2,
        requestType: 'DAILY',
        departureAt: overlapStart,
        expectedReturnAt: overlapEnd,
      },
    });

    const bookingA = reqARes.data;
    const bookingB = reqBRes.data;

    // Approve both bookings before assigning
    await request(`/bookings/${bookingA.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    await request(`/bookings/${bookingB.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });

    // Assign vehicle 1 to Booking A
    const assignARes = await request(`/bookings/${bookingA.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
      },
    });
    if (assignARes.status !== 200 && assignARes.status !== 201) {
      console.log('    [DIAGNOSTIC 3.1]', assignARes.status, assignARes.data);
    }
    assert(assignARes.status === 200 || assignARes.status === 201, '3.1 First booking assigned vehicle & driver');

    // Attempt to assign SAME VEHICLE to Booking B during overlapping time
    const conflictVehicleRes = await request(`/bookings/${bookingB.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver2.id,
      },
    });
    assert(conflictVehicleRes.status === 409, '3.2 Backend rejects vehicle double-booking with 409 Conflict', `Status: ${conflictVehicleRes.status}`);

    // Attempt to assign SAME DRIVER to Booking B during overlapping time
    const conflictDriverRes = await request(`/bookings/${bookingB.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle2.id,
        driverId: driver1.id,
      },
    });
    if (conflictDriverRes.status !== 409) {
      console.log('    [DIAGNOSTIC 3.3]', conflictDriverRes.status, conflictDriverRes.data);
    }
    assert(conflictDriverRes.status === 409, '3.3 Backend rejects driver double-booking with 409 Conflict', `Status: ${conflictDriverRes.status}`);

    // WORKFLOW 4: WEEKLY REQUEST MULTI-DAY VALIDATION
    console.log('\n--- Workflow 4: Weekly Request Multi-Day Validation ---');
    const weekStart = new Date(Date.now() + 86400000 * (baseDays + 30));
    const weekEnd = new Date(Date.now() + 86400000 * (baseDays + 35));

    const midWeekDate = new Date(Date.now() + 86400000 * (baseDays + 32));
    const midStart = new Date(midWeekDate.setHours(10, 0, 0, 0)).toISOString();
    const midEnd = new Date(midWeekDate.setHours(14, 0, 0, 0)).toISOString();

    const weeklyRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'Regional Project Offices - Adama Corridor',
        purpose: 'Weekly Construction Quality Audit',
        passengerCount: 4,
        requestType: 'WEEKLY',
        departureAt: weekStart.toISOString(),
        expectedReturnAt: weekEnd.toISOString(),
        weeklyDays: [
          { dayOfWeek: 'MONDAY', tripDate: weekStart.toISOString(), timeSlot: 'MORNING' },
          { dayOfWeek: 'WEDNESDAY', tripDate: midStart, timeSlot: 'MORNING' },
          { dayOfWeek: 'FRIDAY', tripDate: weekEnd.toISOString(), timeSlot: 'AFTERNOON' },
        ],
      },
    });
    assert(weeklyRes.status === 201, '4.1 Weekly transport request submitted', JSON.stringify(weeklyRes.data));
    const weeklyBooking = weeklyRes.data;

    // Approve weekly booking
    await request(`/bookings/${weeklyBooking.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });

    const singleReqRes = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        destination: 'Meskel Square',
        purpose: 'Mid-week Document Signing',
        passengerCount: 1,
        requestType: 'DAILY',
        departureAt: midStart,
        expectedReturnAt: midEnd,
      },
    });
    const singleBooking = singleReqRes.data;

    // Approve single booking
    await request(`/bookings/${singleBooking.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });

    // Assign vehicle to single booking
    await request(`/bookings/${singleBooking.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver1.id,
      },
    });

    // Now attempt to assign the same vehicle to the weekly booking
    const weeklyAssignConflict = await request(`/bookings/${weeklyBooking.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: vehicle1.id,
        driverId: driver2.id,
      },
    });
    assert(weeklyAssignConflict.status === 409, '4.2 Backend prevents assigning vehicle conflicting with multi-day weekly window', `Status: ${weeklyAssignConflict.status}`);

    // WORKFLOW 5: ERROR HANDLING & EDGE CASES
    console.log('\n--- Workflow 5: Error Handling & Invariant Safeguards ---');

    // Cannot cancel already completed booking
    const cancelCompletedRes = await request(`/bookings/${booking1.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: { reason: 'Late cancellation attempt' },
    });
    assert(cancelCompletedRes.status === 400, '5.1 Cannot cancel completed trip (returns 400 Bad Request)', `Status: ${cancelCompletedRes.status}`);

    // Cannot assign non-existent vehicle
    const nonExistentVehicleRes = await request(`/bookings/${weeklyBooking.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
      body: {
        vehicleId: 'non-existent-uuid-0000',
        driverId: driver1.id,
      },
    });
    assert(nonExistentVehicleRes.status === 404, '5.2 Non-existent vehicle ID returns 404 Not Found', `Status: ${nonExistentVehicleRes.status}`);

    // Non-existent booking ID
    const nonExistentBookingRes = await request('/bookings/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: `Bearer ${logisticsAuth.token}` },
    });
    assert(nonExistentBookingRes.status === 404, '5.3 Non-existent booking returns 404', `Status: ${nonExistentBookingRes.status}`);

    // WORKFLOW 6: ROLE-BASED ACCESS CONTROL (RBAC) & SECURITY
    console.log('\n--- Workflow 6: Role Security & Direct API Authorization ---');

    // Employee cannot assign vehicle (requires LOGISTICS_OFFICER or ADMIN)
    const unauthorizedAssign = await request(`/bookings/${weeklyBooking.id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeAuth.token}` },
      body: {
        vehicleId: vehicle2.id,
        driverId: driver2.id,
      },
    });
    assert(unauthorizedAssign.status === 403, '6.1 Employee cannot assign vehicle/driver (403 Forbidden)', `Status: ${unauthorizedAssign.status}`);

    // Employee cannot cancel another user's assigned booking without permission
    const unauthorizedCancel = await request(`/bookings/${booking3.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverAuth.token}` },
      body: { reason: 'Unauthorized driver cancellation' },
    });
    assert(unauthorizedCancel.status === 403, '6.2 Driver cannot cancel booking (403 Forbidden)', `Status: ${unauthorizedCancel.status}`);

    // Driver cannot create vehicle records
    const driverVehicleCreate = await request('/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverAuth.token}` },
      body: {
        plateNumber: 'ETH-99999',
        make: 'Fake',
        model: 'Car',
        year: 2026,
        capacity: 4,
      },
    });
    assert(driverVehicleCreate.status === 403, '6.3 Driver cannot create vehicles (403 Forbidden)', `Status: ${driverVehicleCreate.status}`);

    // Unauthenticated request rejected
    const unauthRes = await request('/bookings');
    assert(unauthRes.status === 401, '6.4 Unauthenticated request returns 401 Unauthorized', `Status: ${unauthRes.status}`);

    console.log('\n====================================================');
    console.log(`TOTAL TESTS: ${results.passed + results.failed}`);
    console.log(`PASSED: ${results.passed}`);
    console.log(`FAILED: ${results.failed}`);
    console.log('====================================================');
    console.log('\nMEASURED API TIMINGS (ms):');
    for (const [op, time] of Object.entries(results.timings)) {
      console.log(`  - ${op.padEnd(30)}: ${time} ms`);
    }

    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test script crashed:', err);
    process.exit(1);
  }
}

runAllTests();
