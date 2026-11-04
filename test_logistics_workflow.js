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
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
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
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken;
}

async function run() {
  console.log('🚀 Running Comprehensive Logistics Admin Workflow & Auto-Assign Verification...\n');

  // 1. Log in
  console.log('1. Logging in as Employee, Logistics Admin, and Driver...');
  const empToken = await login('employee@capitalre.com');
  const logAdminToken = await login('logistics@capitalre.com');
  const driverToken = await login('driver.abebe@capitalre.com');
  console.log('   ✅ All tokens acquired.\n');

  // 2. Employee submits a new booking
  console.log('2. Creating a test booking request as employee...');
  const baseFutureDays = 30 + Math.floor(Math.random() * 200);
  const dep = new Date(Date.now() + 86400000 * baseFutureDays);
  const ret = new Date(Date.now() + 86400000 * baseFutureDays + 7200000);

  const createRes1 = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      destination: 'Bole Medhanealem Real Estate Office',
      purpose: 'VIP Client Escort and Contract Signing',
      departureAt: dep.toISOString(),
      expectedReturnAt: ret.toISOString(),
      passengerCount: 4,
      requiresDriver: true,
      priority: 'HIGH',
    },
  });
  console.log(`   Status: ${createRes1.status}`);
  if (createRes1.status !== 201) {
    throw new Error(`Create booking failed: ${JSON.stringify(createRes1.data)}`);
  }
  const booking1 = createRes1.data;
  console.log(`   ✅ Booking created: ID=${booking1.id}, Ref=${booking1.bookingReference}, Status=${booking1.status}\n`);

  // 3. Logistics Admin directly approves request
  console.log('3. Testing Logistics Admin granting approval...');
  const approveRes = await request(`/bookings/${booking1.id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });
  console.log(`   Status: ${approveRes.status}`);
  if (approveRes.status !== 200 && approveRes.status !== 201) {
    throw new Error(`Approve booking failed: ${JSON.stringify(approveRes.data)}`);
  }
  console.log(`   ✅ Booking approved by Logistics Admin. Current status=${approveRes.data.status}\n`);

  // 4. Logistics Admin tests 1-Click Auto-Assign on Approved Booking
  console.log('4. Testing Logistics Admin 1-Click ⚡ Auto-Assign on approved booking...');
  const autoAssignRes1 = await request(`/bookings/${booking1.id}/auto-assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });
  console.log(`   Status: ${autoAssignRes1.status}`);
  if (autoAssignRes1.status !== 200 && autoAssignRes1.status !== 201) {
    throw new Error(`Auto-assign failed: ${JSON.stringify(autoAssignRes1.data)}`);
  }
  console.log(`   ✅ Auto-assigned! Vehicle=${autoAssignRes1.data.vehicle?.name} (${autoAssignRes1.data.vehicle?.registrationNumber}), Driver=${autoAssignRes1.data.driverName || 'Chauffeur'}\n`);

  // 5. Create another booking and test DIRECT Assign Vehicle rejection on PENDING_APPROVAL, then assign after approval
  console.log('5. Creating booking 2 and testing approval enforcement on Assign Vehicle...');
  const dep2 = new Date(Date.now() + 86400000 * (baseFutureDays + 2));
  const ret2 = new Date(Date.now() + 86400000 * (baseFutureDays + 2) + 7200000);

  const createRes2 = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      destination: 'CMC Site 4 Commercial Center',
      purpose: 'Technical Site Inspection',
      departureAt: dep2.toISOString(),
      expectedReturnAt: ret2.toISOString(),
      passengerCount: 2,
      requiresDriver: false,
    },
  });
  const booking2 = createRes2.data;
  console.log(`   Created booking ID=${booking2.id}, status=${booking2.status}`);

  // Fetch recommendations for booking2 to get a conflict-free vehicle
  const recRes = await request(`/vehicles/recommendations/${booking2.id}`, {
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });
  const availRec = recRes.data.find((r) => r.isAvailable);
  if (!availRec) throw new Error('No available conflict-free vehicle found');
  const availVeh = availRec.vehicle;

  // 5A. Attempt direct assign on PENDING_APPROVAL - MUST BE REJECTED WITH 400
  const assignPendingRes2 = await request(`/bookings/${booking2.id}/assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
    body: {
      vehicleId: availVeh.id,
      driverName: 'Self-Driven (Inspector)',
      assignmentNotes: 'Attempting direct assignment before approval',
    },
  });
  console.log(`   Direct Assign on pending status: ${assignPendingRes2.status}`);
  if (assignPendingRes2.status !== 400) {
    throw new Error(`Expected 400 when assigning pending booking, got: ${assignPendingRes2.status}`);
  }
  console.log('   ✅ Direct assign on pending request correctly rejected with 400 Bad Request!');

  // 5B. Approve booking 2
  await request(`/bookings/${booking2.id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });

  // 5C. Assign now that it is APPROVED
  const directAssignRes = await request(`/bookings/${booking2.id}/assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
    body: {
      vehicleId: availVeh.id,
      driverName: 'Self-Driven (Inspector)',
      assignmentNotes: 'Assigned by Logistics Admin after approval',
    },
  });
  console.log(`   Direct Assign after approval status: ${directAssignRes.status}`);
  if (directAssignRes.status !== 200 && directAssignRes.status !== 201) {
    throw new Error(`Direct assign failed: ${JSON.stringify(directAssignRes.data)}`);
  }
  console.log(`   ✅ Directly assigned approved request! Current status: ${directAssignRes.data.status}\n`);

  // 6. Create another booking and test Auto-Assign rejection on PENDING_APPROVAL, then auto-assign after approval
  console.log('6. Testing ⚡ Auto-Assign rejection on PENDING_APPROVAL and success on APPROVED...');
  const dep3 = new Date(Date.now() + 86400000 * (baseFutureDays + 4));
  const ret3 = new Date(Date.now() + 86400000 * (baseFutureDays + 4) + 7200000);

  const createRes3 = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      destination: 'Kazanchis Headquarters - Audit Division',
      purpose: 'Statutory Financial Audit Transport',
      departureAt: dep3.toISOString(),
      expectedReturnAt: ret3.toISOString(),
      passengerCount: 3,
      requiresDriver: true,
    },
  });
  const booking3 = createRes3.data;
  console.log(`   Created booking ID=${booking3.id}, status=${booking3.status}`);

  // 6A. Attempt auto-assign on PENDING_APPROVAL - MUST BE REJECTED WITH 400
  const autoAssignPendingRes3 = await request(`/bookings/${booking3.id}/auto-assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });
  console.log(`   Auto-assign on pending status: ${autoAssignPendingRes3.status}`);
  if (autoAssignPendingRes3.status !== 400) {
    throw new Error(`Expected 400 when auto-assigning pending booking, got: ${autoAssignPendingRes3.status}`);
  }
  console.log('   ✅ Auto-assign on pending request correctly rejected with 400 Bad Request!');

  // 6B. Approve booking 3
  await request(`/bookings/${booking3.id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });

  // 6C. Auto-assign now that it is APPROVED
  const autoAssignRes3 = await request(`/bookings/${booking3.id}/auto-assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
  });
  console.log(`   Status: ${autoAssignRes3.status}`);
  if (autoAssignRes3.status !== 200 && autoAssignRes3.status !== 201) {
    throw new Error(`Auto-assign from approved failed: ${JSON.stringify(autoAssignRes3.data)}`);
  }
  console.log(`   ✅ Auto-Assign on approved request successful! Assigned to: ${autoAssignRes3.data.vehicle?.name}\n`);

  // 7. Create another booking and test Logistics Admin Declining/Rejecting
  console.log('7. Testing Logistics Admin granting Decline / Reject with justification...');
  const dep4 = new Date(Date.now() + 86400000 * (baseFutureDays + 6));
  const ret4 = new Date(Date.now() + 86400000 * (baseFutureDays + 6) + 7200000);

  const createRes4 = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      destination: 'Hawassa Branch Office',
      purpose: 'Regional inspection trip',
      departureAt: dep4.toISOString(),
      expectedReturnAt: ret4.toISOString(),
      passengerCount: 6,
      requiresDriver: true,
    },
  });
  const booking4 = createRes4.data;

  const rejectRes = await request(`/bookings/${booking4.id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${logAdminToken}` },
    body: {
      rejectionReason: 'All heavy capacity vehicles are currently reserved for construction site transfer. Please resubmit for next Tuesday.',
    },
  });
  console.log(`   Reject status: ${rejectRes.status}`);
  if (rejectRes.status !== 200 && rejectRes.status !== 201) {
    throw new Error(`Reject booking failed: ${JSON.stringify(rejectRes.data)}`);
  }
  console.log(`   ✅ Booking rejected with reason! Status=${rejectRes.data.status}, Reason=${rejectRes.data.rejectionReason}\n`);

  console.log('🎉 ALL LOGISTICS WORKFLOW & AUTO-ASSIGN TESTS PASSED PERFECTLY!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
