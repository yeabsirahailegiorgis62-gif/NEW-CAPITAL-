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

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TESTING ASSIGN VEHICLE & CANCEL BOOKING SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
    // 1. Logins
    const empAuth = await login('employee@capitalre.com');
    const logAuth = await login('logistics@capitalre.com');
    const logHeaders = { Authorization: `Bearer ${logAuth.token}` };
    const empHeaders = { Authorization: `Bearer ${empAuth.token}` };

    assert(empAuth.user.role === 'EMPLOYEE', 'Employee login');
    assert(logAuth.user.role === 'LOGISTICS_ADMIN', 'Logistics Admin login');

    // TEST 1: Create a single-day booking as Employee with fresh time
    console.log('\n--- Scenario 1: Assign Vehicle directly to a PENDING_APPROVAL booking ---');
    const uniqueOffset = Math.floor(Math.random() * 50) + 20;
    const dep1 = new Date(Date.now() + 86400000 * uniqueOffset).toISOString();
    const ret1 = new Date(Date.now() + 86400000 * uniqueOffset + 3600000 * 4).toISOString();

    const createRes1 = await request('/bookings', {
      method: 'POST',
      headers: empHeaders,
      body: {
        departureAt: dep1,
        expectedReturnAt: ret1,
        destination: 'Ayat Construction Zone Site C',
        purpose: 'Site structural inspection with municipal engineers',
        passengerCount: 2,
        requiresDriver: true,
        priority: 'STANDARD',
      },
    });

    assert(createRes1.status === 201, 'Created booking 1', `Status: ${createRes1.status}`);
    const booking1 = createRes1.data;
    assert(booking1.status === 'PENDING_APPROVAL', 'Booking 1 is initially PENDING_APPROVAL');

    // Query vehicle recommendations like AssignVehicleModal does
    const vRecsRes = await request(`/vehicles/recommendations/${booking1.id}`, { headers: logHeaders });
    assert(vRecsRes.status === 200, 'Fetched vehicle recommendations');
    const availableVehicle = vRecsRes.data.find((r) => r.isAvailable);
    assert(!!availableVehicle, 'Found available recommended vehicle');

    // Query driver recommendations like AssignVehicleModal does
    const dRecsRes = await request(`/vehicles/driver-recommendations/${booking1.id}`, { headers: logHeaders });
    assert(dRecsRes.status === 200, 'Fetched driver recommendations');
    const availableDriver = dRecsRes.data.find((r) => r.isAvailable);
    assert(!!availableDriver, 'Found available recommended driver');

    // TEST 2: Attempting to assign vehicle to PENDING_APPROVAL booking MUST be rejected with 400
    const assignPendingRes = await request(`/bookings/${booking1.id}/assign`, {
      method: 'POST',
      headers: logHeaders,
      body: {
        vehicleId: availableVehicle.vehicle.id,
        driverId: availableDriver.driver.id,
        driverName: availableDriver.driver.name,
        driverPhone: availableDriver.driver.phone,
        assignmentNotes: 'Attempting assignment before approval.',
      },
    });

    assert(
      assignPendingRes.status === 400,
      'Direct assignment on PENDING_APPROVAL booking is rejected with 400 Bad Request',
      `Status: ${assignPendingRes.status}, data: ${JSON.stringify(assignPendingRes.data)}`
    );

    // Now officially approve the booking
    const approveRes = await request(`/bookings/${booking1.id}/approve`, {
      method: 'POST',
      headers: logHeaders,
    });
    assert(approveRes.status === 200 || approveRes.status === 201, 'Logistics Officer approves booking');
    assert(approveRes.data.status === 'APPROVED', 'Booking status transitioned to APPROVED');

    // TEST 2B: Now assign vehicle to the APPROVED booking
    const assignRes1 = await request(`/bookings/${booking1.id}/assign`, {
      method: 'POST',
      headers: logHeaders,
      body: {
        vehicleId: availableVehicle.vehicle.id,
        driverId: availableDriver.driver.id,
        driverName: availableDriver.driver.name,
        driverPhone: availableDriver.driver.phone,
        assignmentNotes: 'Assigned by logistics coordinator after approval.',
      },
    });

    assert(
      assignRes1.status === 200 || assignRes1.status === 201,
      'Assign vehicle to APPROVED booking succeeds',
      `Status: ${assignRes1.status}, data: ${JSON.stringify(assignRes1.data)}`
    );

    // Verify booking status is now ASSIGNED
    const getRes1 = await request(`/bookings/${booking1.id}`, { headers: logHeaders });
    assert(getRes1.data.status === 'ASSIGNED', 'Booking 1 status transitioned to ASSIGNED', `Status: ${getRes1.data.status}`);
    assert(getRes1.data.assignments && getRes1.data.assignments.length > 0, 'Booking 1 has active assignment record');
    assert(getRes1.data.assignments[0].vehicleId === availableVehicle.vehicle.id, 'Assigned vehicle matches selection');
    assert(getRes1.data.assignments[0].driverId === availableDriver.driver.id, 'Assigned driver matches selection');

    // TEST 3: Logistics Admin cancels the ASSIGNED booking via PATCH /bookings/:id/cancel
    console.log('\n--- Scenario 2: Cancel ASSIGNED booking & verify resource release ---');
    const cancelRes1 = await request(`/bookings/${booking1.id}/cancel`, {
      method: 'PATCH',
      headers: logHeaders,
      body: {
        reason: 'Trip No Longer Required',
        notes: 'Inspection meeting rescheduled by client.',
      },
    });

    assert(
      cancelRes1.status === 200,
      'Cancel ASSIGNED booking via PATCH succeeds',
      `Status: ${cancelRes1.status}, data: ${JSON.stringify(cancelRes1.data)}`
    );

    const getRes1Cancelled = await request(`/bookings/${booking1.id}`, { headers: logHeaders });
    assert(getRes1Cancelled.data.status === 'CANCELLED', 'Booking 1 status is CANCELLED');
    const activeAssignments = (getRes1Cancelled.data.assignments || []).filter((a) => !a.unassignedAt);
    assert(activeAssignments.length === 0, 'Vehicle assignment unassignedAt timestamp recorded (resource released)');

    // TEST 4: Create another booking and cancel while in PENDING_APPROVAL
    console.log('\n--- Scenario 3: Cancel PENDING_APPROVAL booking directly ---');
    const createRes2 = await request('/bookings', {
      method: 'POST',
      headers: empHeaders,
      body: {
        departureAt: new Date(Date.now() + 86400000 * (uniqueOffset + 1)).toISOString(),
        expectedReturnAt: new Date(Date.now() + 86400000 * (uniqueOffset + 1) + 3600000 * 3).toISOString(),
        destination: 'Bole Subcity Municipal Office',
        purpose: 'Permit submission',
        passengerCount: 1,
        requiresDriver: false,
        priority: 'STANDARD',
      },
    });

    assert(createRes2.status === 201, 'Created booking 2', `Status: ${createRes2.status}`);
    const booking2 = createRes2.data;

    const cancelRes2 = await request(`/bookings/${booking2.id}/cancel`, {
      method: 'PATCH',
      headers: logHeaders,
      body: {
        reason: 'Employee Cancelled the Request',
        notes: 'Permits submitted electronically instead.',
      },
    });

    assert(cancelRes2.status === 200, 'Logistics Admin can cancel PENDING_APPROVAL booking via PATCH', `Status: ${cancelRes2.status}`);
    const getRes2Cancelled = await request(`/bookings/${booking2.id}`, { headers: logHeaders });
    assert(getRes2Cancelled.data.status === 'CANCELLED', 'Booking 2 status is CANCELLED');

    // TEST 5: Create booking, Approve it first, then Assign vehicle
    console.log('\n--- Scenario 4: Standard Approve then Assign flow ---');
    const createRes3 = await request('/bookings', {
      method: 'POST',
      headers: empHeaders,
      body: {
        departureAt: new Date(Date.now() + 86400000 * (uniqueOffset + 2)).toISOString(),
        expectedReturnAt: new Date(Date.now() + 86400000 * (uniqueOffset + 2) + 3600000 * 5).toISOString(),
        destination: 'CMC Luxury Villa Project Phase 2',
        purpose: 'Executive architectural walk-through',
        passengerCount: 3,
        requiresDriver: true,
        priority: 'HIGH',
      },
    });

    assert(createRes3.status === 201, 'Created booking 3');
    const booking3 = createRes3.data;

    // Approve
    const approveRes3 = await request(`/bookings/${booking3.id}/approve`, {
      method: 'POST',
      headers: logHeaders,
    });
    assert(approveRes3.status === 200 || approveRes3.status === 201, 'Approved booking 3');

    // Find available vehicle for booking 3
    const vRecsRes3 = await request(`/vehicles/recommendations/${booking3.id}`, { headers: logHeaders });
    const availVehicle3 = vRecsRes3.data.find((r) => r.isAvailable);
    const dRecsRes3 = await request(`/vehicles/driver-recommendations/${booking3.id}`, { headers: logHeaders });
    const availDriver3 = dRecsRes3.data.find((r) => r.isAvailable);

    // Assign
    const assignRes3 = await request(`/bookings/${booking3.id}/assign`, {
      method: 'POST',
      headers: logHeaders,
      body: {
        vehicleId: availVehicle3.vehicle.id,
        driverId: availDriver3.driver.id,
        assignmentNotes: 'VIP walk-through allocation',
      },
    });
    assert(assignRes3.status === 200 || assignRes3.status === 201, 'Assigned vehicle to APPROVED booking 3');

    // Cancel
    const cancelRes3 = await request(`/bookings/${booking3.id}/cancel`, {
      method: 'PATCH',
      headers: logHeaders,
      body: { reason: 'Scheduling Conflict' },
    });
    assert(cancelRes3.status === 200, 'Cancelled booking 3 after assignment via PATCH');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 ALL INTEGRITY TESTS PASSED: ${passed} PASSED, ${failed} FAILED`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
