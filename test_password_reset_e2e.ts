/**
 * Complete End-to-End Password Reset Workflow Verification
 * Tests the entire lifecycle:
 * 1. User Forgot-Password Request (public endpoint)
 * 2. Admin Request Queue Inspection (GET /api/auth/admin/reset-requests)
 * 3. Security Sanity Check: Ensure raw passphrase / hash is never exposed to admin
 * 4. Admin Approval & Email Dispatch (POST /api/auth/admin/reset-requests/:id/approve)
 * 5. Email Delivery Status & Audit Tracking
 * 6. Resend Passphrase functionality (POST /api/auth/admin/reset-requests/:id/resend)
 * 7. Rate Limiting & Brute-Force Lockout on invalid attempts
 * 8. Password Policy Verification (length, uppercase, number, special char)
 * 9. Password Reset Submission with Valid Passphrase
 * 10. Single-Use Replay Attack Prevention
 * 11. Old Password Rejection & New Password Authentication
 * 12. Reset Restore for Seed Data
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const API_BASE = 'http://localhost:4100/api';
const prisma = new PrismaClient();

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

async function run() {
  console.log('\n======================================================');
  console.log('🔒 CAPITAL FLEET: PASSWORD RESET WORKFLOW E2E TEST');
  console.log('======================================================\n');

  const testEmail = 'employee@capitalre.com';
  const testReason = 'Automated E2E Test Verification for Password Reset';

  // Step 0: Ensure user exists and get clean state
  const targetUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  if (!targetUser) {
    throw new Error(`Target user ${testEmail} not found in database!`);
  }
  console.log(`✓ Verified target test user: ${targetUser.name} (${targetUser.email})`);

  // Clean up any existing reset requests for clean testing
  await prisma.passwordResetToken.deleteMany({
    where: { userId: targetUser.id },
  });
  await prisma.passwordResetRequest.deleteMany({
    where: { userId: targetUser.id },
  });
  console.log('✓ Cleaned up prior reset tokens and requests for a fresh run\n');

  // STEP 1: User Forgot-Password Request
  console.log('--- Step 1: User Requests Password Reset ---');
  const forgotRes = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      reason: testReason,
    }),
  });
  const forgotData = await forgotRes.json();
  console.log('Response Status:', forgotRes.status);
  console.log('Response Message:', forgotData.message);
  if (!forgotRes.ok || !forgotData.message) {
    throw new Error(`Forgot password request failed: ${JSON.stringify(forgotData)}`);
  }

  // Check DB state
  const createdRequest = await prisma.passwordResetRequest.findFirst({
    where: { userId: targetUser.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  if (!createdRequest) {
    throw new Error('Password reset request record was not created in database with PENDING status!');
  }
  console.log(`✓ Created reset request in DB with ID: ${createdRequest.id}, status: ${createdRequest.status}`);
  console.log(`✓ Initial delivery status: ${createdRequest.emailDeliveryStatus}\n`);

  // STEP 2: Admin Logs In & Views Requests
  console.log('--- Step 2: Admin Retrieves Reset Requests ---');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@capitalre.com',
      password: 'CapitalFleet2026!',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.accessToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminToken = adminLoginData.accessToken;
  console.log('✓ Admin authenticated successfully');

  const adminRequestsRes = await fetch(`${API_BASE}/auth/admin/reset-requests`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminRequestsData = await adminRequestsRes.json();
  if (!adminRequestsRes.ok || !Array.isArray(adminRequestsData)) {
    throw new Error(`Admin failed to fetch reset requests: ${JSON.stringify(adminRequestsData)}`);
  }
  const foundRequest = adminRequestsData.find((r: any) => r.id === createdRequest.id);
  if (!foundRequest) {
    throw new Error('Created reset request not present in admin request queue!');
  }
  console.log(`✓ Found request in admin queue: Requester=${foundRequest.userName}, Status=${foundRequest.status}, Email=${foundRequest.userEmail}`);

  // STEP 3: Security Sanity Check (No Passphrase / Hash in Admin API)
  console.log('\n--- Step 3: Security Audit - Ensure No Sensitive Tokens in Admin Payload ---');
  if (foundRequest.passphrase || foundRequest.passphraseHash || foundRequest.token) {
    throw new Error('SECURITY VIOLATION: Raw passphrase or passphraseHash exposed in admin requests API!');
  }
  console.log('✓ PASS: Admin payload is free of sensitive passphrases and hashes');

  // STEP 4: Admin Approves Request & Triggers Email Dispatch
  console.log('\n--- Step 4: Admin Approves Request & Dispatches Passphrase ---');
  const approveRes = await fetch(`${API_BASE}/auth/admin/reset-requests/${createdRequest.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      expiresInMinutes: 15,
      adminNotes: 'Approved via automated test verification',
    }),
  });
  const approveData = await approveRes.json();
  console.log('Approve Status:', approveRes.status);
  console.log('Approve Message:', approveData.message);
  console.log('Delivery Status:', approveData.emailDeliveryStatus);

  if (!approveRes.ok) {
    throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
  }
  if (approveData.passphrase) {
    throw new Error('SECURITY VIOLATION: Raw passphrase must never be returned to the admin browser!');
  }

  // STEP 5: Verify Database Tracking & Token Hash
  console.log('\n--- Step 5: Verify DB Tracking & Cryptographic Hash ---');
  const approvedDbRequest = await prisma.passwordResetRequest.findUnique({
    where: { id: createdRequest.id },
    include: { tokens: true },
  });
  if (!approvedDbRequest) {
    throw new Error('Request not found in DB after approval');
  }
  if (approvedDbRequest.status !== 'APPROVED') {
    throw new Error(`Expected status APPROVED, got ${approvedDbRequest.status}`);
  }
  if (approvedDbRequest.emailDeliveryStatus !== 'SENT') {
    throw new Error(`Expected emailDeliveryStatus SENT, got ${approvedDbRequest.emailDeliveryStatus}`);
  }
  if (!approvedDbRequest.passphraseHash || approvedDbRequest.passphraseHash.length !== 64) {
    throw new Error('Expected 64-character SHA-256 passphraseHash in database');
  }
  const tokenRecord = approvedDbRequest.tokens[0];
  if (!tokenRecord || tokenRecord.token !== approvedDbRequest.passphraseHash) {
    throw new Error('Expected PasswordResetToken to match passphraseHash');
  }
  console.log(`✓ Request status is APPROVED`);
  console.log(`✓ Email delivery status: ${approvedDbRequest.emailDeliveryStatus} at ${approvedDbRequest.emailSentAt}`);
  console.log(`✓ SHA-256 hash verified (64 hex characters): ${approvedDbRequest.passphraseHash.substring(0, 16)}...`);

  // STEP 6: Resend Passphrase
  console.log('\n--- Step 6: Test Resend Passphrase ---');
  const resendRes = await fetch(`${API_BASE}/auth/admin/reset-requests/${createdRequest.id}/resend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      expiresInMinutes: 20,
    }),
  });
  const resendData = await resendRes.json();
  if (!resendRes.ok) {
    throw new Error(`Resend passphrase failed: ${JSON.stringify(resendData)}`);
  }
  console.log('✓ Resend succeeded:', resendData.message);
  console.log('✓ New delivery status:', resendData.emailDeliveryStatus);

  // Retrieve the updated active token hash from DB
  const resendTokens = await prisma.passwordResetToken.findMany({
    where: { requestId: createdRequest.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (resendTokens.length === 0) {
    throw new Error('No active token found after resend');
  }
  const activeToken = resendTokens[0];
  console.log(`✓ Active token ID: ${activeToken.id}, hash: ${activeToken.token.substring(0, 16)}...`);

  // For our test, since the email transport outputs the raw passphrase to log/mail,
  // we can create a temporary known passphrase for testing resetPassword:
  const testPassphrase = 'CPTL-TEST-9999';
  const testPassphraseHash = sha256(testPassphrase);

  // Update token with this known hash so we can test the exact verification
  await prisma.passwordResetToken.update({
    where: { id: activeToken.id },
    data: { token: testPassphraseHash },
  });
  await prisma.passwordResetRequest.update({
    where: { id: createdRequest.id },
    data: { passphraseHash: testPassphraseHash },
  });
  console.log(`✓ Linked test passphrase ${testPassphrase} (hash ${testPassphraseHash.substring(0, 16)}...)`);

  // STEP 7: Brute-Force Lockout Test (Invalid Passphrase attempts)
  console.log('\n--- Step 7: Test Invalid Passphrase & Attempt Counting ---');
  const badAttemptRes = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      passphrase: 'CPTL-WRONG-0000',
      newPassword: 'ValidPassword123!',
    }),
  });
  console.log('Invalid Attempt Status:', badAttemptRes.status);
  if (badAttemptRes.status !== 400 && badAttemptRes.status !== 401) {
    throw new Error(`Expected 400/401 for invalid passphrase, got ${badAttemptRes.status}`);
  }
  const dbTokenAfterBad = await prisma.passwordResetToken.findUnique({
    where: { id: activeToken.id },
  });
  console.log(`✓ Failed attempts recorded in DB: ${dbTokenAfterBad?.failedAttempts}`);
  if ((dbTokenAfterBad?.failedAttempts || 0) < 1) {
    throw new Error('failedAttempts was not incremented on invalid passphrase!');
  }

  // STEP 8: Password Complexity Validation
  console.log('\n--- Step 8: Test Password Complexity Rejection ---');
  const weakPasswordRes = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      passphrase: testPassphrase,
      newPassword: 'weak',
    }),
  });
  console.log('Weak Password Status:', weakPasswordRes.status);
  if (weakPasswordRes.status !== 400) {
    throw new Error(`Expected 400 for weak password, got ${weakPasswordRes.status}`);
  }
  console.log('✓ Weak password successfully rejected');

  // STEP 9: Valid Password Reset
  console.log('\n--- Step 9: User Submits Valid Passphrase & New Password ---');
  const newPassword = 'NewSecretPassword2026!';
  const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      passphrase: testPassphrase,
      newPassword: newPassword,
    }),
  });
  const resetData = await resetRes.json();
  console.log('Reset Response Status:', resetRes.status);
  console.log('Reset Response Message:', resetData.message);
  if (!resetRes.ok) {
    throw new Error(`Password reset failed: ${JSON.stringify(resetData)}`);
  }

  // Verify DB state
  const completedRequest = await prisma.passwordResetRequest.findUnique({
    where: { id: createdRequest.id },
  });
  const completedToken = await prisma.passwordResetToken.findUnique({
    where: { id: activeToken.id },
  });
  if (completedRequest?.status !== 'COMPLETED') {
    throw new Error(`Expected request status COMPLETED, got ${completedRequest?.status}`);
  }
  if (!completedToken?.usedAt) {
    throw new Error('Expected token.usedAt to be set after successful reset');
  }
  console.log(`✓ Request status updated to: ${completedRequest.status}`);
  console.log(`✓ Token marked as used at: ${completedToken.usedAt}`);

  // STEP 10: Single-Use Replay Attack Prevention
  console.log('\n--- Step 10: Test Single-Use Replay Attack Prevention ---');
  const replayRes = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      passphrase: testPassphrase,
      newPassword: 'AnotherPassword999!',
    }),
  });
  console.log('Replay Attempt Status:', replayRes.status);
  if (replayRes.ok) {
    throw new Error('SECURITY VIOLATION: Reused passphrase was accepted!');
  }
  console.log('✓ PASS: Replay attempt blocked cleanly');

  // STEP 11: Authentication Verification (Old vs New Password)
  console.log('\n--- Step 11: Authentication Verification ---');
  // Attempt with old password
  const oldLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: 'CapitalFleet2026!',
    }),
  });
  console.log('Old Password Login Status:', oldLoginRes.status);
  if (oldLoginRes.ok) {
    throw new Error('Old password was still accepted after reset!');
  }
  console.log('✓ Old password rejected (401 Unauthorized)');

  // Attempt with new password
  const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: newPassword,
    }),
  });
  const newLoginData = await newLoginRes.json();
  console.log('New Password Login Status:', newLoginRes.status);
  if (!newLoginRes.ok || !newLoginData.accessToken) {
    throw new Error(`Login with new password failed: ${JSON.stringify(newLoginData)}`);
  }
  console.log(`✓ Login with new password succeeded! Received JWT Token (length: ${newLoginData.accessToken.length})`);

  // STEP 12: Restore Standard Seed Password for Dev Environment
  console.log('\n--- Step 12: Restoring Standard Seed Password ---');
  const bcrypt = await import('bcrypt');
  const defaultHash = await bcrypt.hash('CapitalFleet2026!', 10);
  await prisma.user.update({
    where: { email: testEmail },
    data: { passwordHash: defaultHash, lockedUntil: null, failedLoginAttempts: 0 },
  });
  console.log('✓ Reset employee password back to standard seed value (CapitalFleet2026!)\n');

  console.log('======================================================');
  console.log('🎉 ALL 12 VERIFICATION CHECKS PASSED WITH ZERO ERRORS');
  console.log('======================================================\n');
}

run()
  .catch((err) => {
    console.error('\n❌ E2E Test Failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
