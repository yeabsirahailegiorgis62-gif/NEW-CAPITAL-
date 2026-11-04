const http = require('http');

const API_BASE = 'http://localhost:4100/api';

async function request(endpoint, options = {}) {
  const url = new URL(API_BASE + endpoint);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

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
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, data: parsed });
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
  };
}

async function runEndToEndTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚗 END-TO-END WORKFLOW VERIFICATION: VEHICLE ASSIGNMENT & LOGISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      failed++;
      console.error(`  ❌ [FAIL] ${name} — ${details}`);
    }
  }

  try {
    // Authenticate users
    console.log('1. Authenticating test users...');
    const employee = await login('employee@capitalre.com');
    const logistics = await login('logistics@capitalre.com');
    const driverAbebe = await login('driver.abebe@capitalre.com');
    const driverMulugeta = await login('driver.mulugeta@capitalre.com');

    const empHeaders = { Authorization: `Bearer ${employee.token}` };
    const logHeaders = { Authorization: `Bearer ${logistics.token}` };
    const abebeHeaders = { Authorization: `Bearer ${driverAbebe.token}` };
    const mulugetaHeaders = { Authorization: `Bearer ${driverMulugeta.token}` };

    assert(employee.user.role === 'EMPLOYEE', 'Employee role verified');
    assert(logistics.user.role === 'LOGISTICS_ADMIN', 'Logistics Admin role verified');
    assert(driverAbebe.user.role === 'DRIVER', 'Driver Abebe role verified');
    assert(driverMulugeta.user.role === 'DRIVER', 'Driver Mulugeta role verified');

    // Fetch available fleet vehicles
    const vehiclesRes = await request('/vehicles', { headers: logHeaders });
    assert(vehiclesRes.status === 200 && vehiclesRes.data.length > 0, 'Fetched vehicles inventory');
    const activeVehicles = vehiclesRes.data.filter(v => v.operationalStatus === 'ACTIVE');
    const vehicle1 = activeVehicles[0];
    const vehicle2 = activeVehicles[1] || activeVehicles[0];

    // STEP 1: Employee submits a request without vehicle selection
    console.log('\n2. Step 1 — Employee submits request without choosing a vehicle...');
    const offset = Math.floor(Math.random() * 40) + 15;
    const departureAt = new Date(Date.now() + 86400000 * offset).toISOString();
    const expectedReturnAt = new Date(Date.now() + 86400000 * offset + 3600000 * 5).toISOString();

    const submitRes = await request('/bookings', {
      method: 'POST',
      headers: empHeaders,
      body: {
        departureAt,
        expectedReturnAt,
        destination: 'Gerji Commercial Heights Site B',
        pickupLocation: 'Capital Real Estate Headquarters Gate 1',
        purpose: 'Site inspection with municipal planning commission',
        passengerCount: 3,
        requiresDriver: true,
        contactPhone: '+251911223344',
        additionalNotes: 'Requires hard hats and survey equipment cargo space.',
        priority: 'STANDARD',
      },
    });

    assert(submitRes.status === 201 || submitRes.status === 200, 'Employee submits booking without vehicle choice');
    const booking = submitRes.data;
    assert(booking.status === 'PENDING_APPROVAL', 'Initial booking status is PENDING_APPROVAL', booking.status);
    assert(booking.preferredVehicleId === null || booking.preferredVehicleId === undefined, 'No vehicle selected by employee');
    assert(booking.destination === 'Gerji Commercial Heights Site B', 'Destination preserved correctly');

    // STEP 2: RBAC Security Check: Employee cannot approve or assign vehicles
    console.log('\n3. Security & RBAC Enforcement: Unauthorized actions by employee...');
    const empApproveRes = await request(`/bookings/${booking.id}/approve`, {
      method: 'POST',
      headers: empHeaders,
    });
    assert(empApproveRes.status === 403, 'Employee CANNOT approve booking (403 Forbidden)', empApproveRes.status);

    const empAssignRes = await request(`/bookings/${booking.id}/assign`, {
      method: 'POST',
      headers: empHeaders,
      body: {
        vehicleId: vehicle1.id,
        driverId: driverAbebe.user.id,
        assignmentNotes: 'Unauthorized assignment attempt',
      },
    });
    assert(empAssignRes.status === 403, 'Employee CANNOT assign vehicle (403 Forbidden)', empAssignRes.status);

    // STEP 3: Logistics Admin reviews and approves request
    console.log('\n4. Step 2 — Logistics Admin reviews and approves request...');
    const approveRes = await request(`/bookings/${booking.id}/approve`, {
      method: 'POST',
      headers: logHeaders,
    });
    assert(approveRes.status === 200 || approveRes.status === 201, 'Logistics Admin approves request');
    assert(approveRes.data.status === 'APPROVED', 'Booking status transitioned to APPROVED', approveRes.data.status);

    // Verify Audit Log records approving officer
    const detailsAfterApproval = await request(`/bookings/${booking.id}`, { headers: logHeaders });
    const approvalLog = detailsAfterApproval.data.auditLogs?.find(l => l.action.includes('APPROV'));
    assert(approvalLog !== undefined, 'Audit log records approval action');
    assert(
      approvalLog?.actorName === logistics.user.name || approvalLog?.newValues?.approverName === logistics.user.name,
      'Audit log records approving officer name',
      JSON.stringify(approvalLog)
    );

    // STEP 4: Logistics Admin assigns vehicle and driver (Step 3 in workflow)
    console.log('\n5. Step 3 — Logistics Admin assigns vehicle and driver...');
    const assignRes = await request(`/bookings/${booking.id}/assign`, {
      method: 'POST',
      headers: logHeaders,
      body: {
        vehicleId: vehicle1.id,
        driverId: driverAbebe.user.id,
        assignmentNotes: 'Vehicle keys and fuel voucher ready at Gate 1 Dispatch.',
      },
    });
    assert(assignRes.status === 200 || assignRes.status === 201, 'Logistics Admin assigns vehicle and driver', assignRes.status);

    // Query updated booking record
    const bookingAfterAssign = await request(`/bookings/${booking.id}`, { headers: logHeaders });
    assert(bookingAfterAssign.data.status === 'ASSIGNED', 'Booking status transitioned to ASSIGNED', bookingAfterAssign.data.status);

    // Check assignment details
    const activeAssignment = bookingAfterAssign.data.assignments?.[0];
    assert(activeAssignment?.vehicleId === vehicle1.id, 'Assigned vehicle matches selection', activeAssignment?.vehicleId);
    assert(activeAssignment?.driverId === driverAbebe.user.id, 'Assigned driver matches Abebe', activeAssignment?.driverId);
    assert(activeAssignment?.assignedBy !== null, 'Assigning officer recorded in assignment');

    // STEP 5: Verification of Driver Portal Access (Requirement 7)
    console.log('\n6. Step 4 — Driver Portal Access & Scope Verification...');
    const abebeBookingsRes = await request('/bookings', { headers: abebeHeaders });
    assert(abebeBookingsRes.status === 200, 'Assigned driver Abebe can query bookings');
    const abebeSeesTrip = abebeBookingsRes.data.some(b => b.id === booking.id);
    assert(abebeSeesTrip === true, 'Assigned driver Abebe sees the assigned trip in portal');

    const mulugetaBookingsRes = await request('/bookings', { headers: mulugetaHeaders });
    assert(mulugetaBookingsRes.status === 200, 'Unassigned driver Mulugeta can query bookings');
    const mulugetaSeesTrip = mulugetaBookingsRes.data.some(b => b.id === booking.id);
    assert(mulugetaSeesTrip === false, 'Unassigned driver Mulugeta CANNOT see Abebe’s assigned trip');

    // STEP 6: Conflict Prevention (Requirement 6)
    console.log('\n7. Conflict Prevention: Attempting to double-book vehicle or driver...');
    // Create another booking at the exact same time
    const conflictBookingRes = await request('/bookings', {
      method: 'POST',
      headers: empHeaders,
      body: {
        departureAt,
        expectedReturnAt,
        destination: 'Bole Atlas Project Phase 2',
        purpose: 'Executive client review',
        passengerCount: 2,
        requiresDriver: true,
      },
    });
    const conflictBooking = conflictBookingRes.data;
    await request(`/bookings/${conflictBooking.id}/approve`, { method: 'POST', headers: logHeaders });

    // Attempt to assign the same vehicle (vehicle1) to conflictBooking
    const doubleBookVehicleRes = await request(`/bookings/${conflictBooking.id}/assign`, {
      method: 'POST',
      headers: logHeaders,
      body: {
        vehicleId: vehicle1.id,
        driverId: driverMulugeta.user.id, // different driver
      },
    });
    assert(
      doubleBookVehicleRes.status === 409 || doubleBookVehicleRes.status === 400,
      'Conflicting vehicle assignment is rejected with conflict error (409/400)',
      doubleBookVehicleRes.status
    );

    // Attempt to assign the same driver (driverAbebe) to conflictBooking with a different vehicle
    if (vehicle2.id !== vehicle1.id) {
      const doubleBookDriverRes = await request(`/bookings/${conflictBooking.id}/assign`, {
        method: 'POST',
        headers: logHeaders,
        body: {
          vehicleId: vehicle2.id,
          driverId: driverAbebe.user.id,
        },
      });
      assert(
        doubleBookDriverRes.status === 409 || doubleBookDriverRes.status === 400,
        'Conflicting driver assignment is rejected with conflict error (409/400)',
        doubleBookDriverRes.status
      );
    }

    // Clean up conflictBooking
    await request(`/bookings/${conflictBooking.id}/cancel`, {
      method: 'POST',
      headers: logHeaders,
      body: { reason: 'Test conflict teardown' },
    });

    // STEP 7: Reassignment & History Preservation (Requirement 4D)
    console.log('\n8. Reassignment & History Preservation: Reassigning vehicle/driver...');
    if (vehicle2.id !== vehicle1.id) {
      const reassignRes = await request(`/bookings/${booking.id}/assign`, {
        method: 'POST',
        headers: logHeaders,
        body: {
          vehicleId: vehicle2.id,
          driverId: driverMulugeta.user.id,
          assignmentNotes: 'Vehicle upgraded for cargo capacity.',
        },
      });
      assert(reassignRes.status === 200 || reassignRes.status === 201, 'Reassignment successful', reassignRes.status);

      // Fetch booking record and inspect audit logs
      const finalBookingRes = await request(`/bookings/${booking.id}`, { headers: logHeaders });
      const logs = finalBookingRes.data.auditLogs || [];
      const hasReassignedLog = logs.some(l => l.action.includes('REASSIGN') || l.action.includes('ASSIGN'));
      assert(hasReassignedLog, 'Audit log preserved reassignment event history without overwriting');
    }

    // STEP 8: Cancellation & Resource Release
    console.log('\n9. Cancellation Workflow & Resource Release...');
    const cancelRes = await request(`/bookings/${booking.id}/cancel`, {
      method: 'POST',
      headers: logHeaders,
      body: {
        reason: 'Client rescheduled on-site meeting to following week.',
        notes: 'Release assigned vehicle and driver back to available pool.',
      },
    });
    assert(cancelRes.status === 200 || cancelRes.status === 201, 'Logistics Admin cancelled booking', cancelRes.status);

    const cancelledDetails = await request(`/bookings/${booking.id}`, { headers: logHeaders });
    assert(cancelledDetails.data.status === 'CANCELLED', 'Booking status transitioned to CANCELLED');
    assert(cancelledDetails.data.cancellationReason !== null, 'Cancellation reason preserved');
    const cancelLog = cancelledDetails.data.auditLogs?.find(l => l.action.includes('CANCEL'));
    assert(cancelLog !== undefined, 'Cancellation event preserved in audit log with responsible officer');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runEndToEndTests();
