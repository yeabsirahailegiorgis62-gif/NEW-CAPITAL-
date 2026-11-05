import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { UserRole, PasswordResetRequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Password Recovery Workflow E2E Integration Suite', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;

  const testEmployeeEmail = 'e2e-recovery-employee@capitalre.com';
  const testEmployeeId = 'EMP-E2E-REC-01';
  const testAdminEmail = 'e2e-recovery-admin@capitalre.com';
  const testOtherEmployeeEmail = 'e2e-recovery-other@capitalre.com';
  const testOtherEmployeeId = 'EMP-E2E-REC-02';

  const initialPassword = 'InitialSecurePassword2026!';
  const newPassword = 'BrandNewPassword2026!';

  let testEmployeeUser: any;
  let testAdminUser: any;
  let testOtherUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);

    // Clean up any leftovers from previous test runs
    await cleanupTestData();

    // Seed test users
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    testEmployeeUser = await prisma.user.create({
      data: {
        name: 'E2E Test Employee',
        email: testEmployeeEmail,
        employeeId: testEmployeeId,
        passwordHash,
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    });

    testAdminUser = await prisma.user.create({
      data: {
        name: 'E2E Test Administrator',
        email: testAdminEmail,
        employeeId: 'ADMIN-E2E-01',
        passwordHash,
        role: UserRole.SYSTEM_ADMIN,
        isActive: true,
      },
    });

    testOtherUser = await prisma.user.create({
      data: {
        name: 'E2E Other Employee',
        email: testOtherEmployeeEmail,
        employeeId: testOtherEmployeeId,
        passwordHash,
        role: UserRole.EMPLOYEE,
        isActive: true,
      },
    });
  }, 45000);

  afterAll(async () => {
    await cleanupTestData();
    if (app) {
      await app.close();
    }
  });

  async function cleanupTestData() {
    try {
      const users = await prisma.user.findMany({
        where: {
          email: { in: [testEmployeeEmail, testAdminEmail, testOtherEmployeeEmail] },
        },
      });

      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        await prisma.passwordResetToken.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.passwordResetRequest.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.auditLog.deleteMany({
          where: { entityId: { in: userIds } },
        });
        await prisma.notification.deleteMany({
          where: { recipientId: { in: userIds } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } catch (e) {
      // Ignore cleanup error if already removed
    }
  }

  describe('Comprehensive 24-Point Password Recovery Lifecycle', () => {
    let activeRequestId: string;
    let issuedPassphrase: string;
    let resetAuthToken: string;

    // 1. Employee submits a recovery request
    it('1. Employee submits a recovery request with PENDING status', async () => {
      const result = await authService.forgotPassword({
        identifier: testEmployeeEmail,
        reason: 'Locked out during quarterly audit',
      });

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      activeRequestId = result.requestId!;

      const reqInDb = await prisma.passwordResetRequest.findUnique({
        where: { id: activeRequestId },
      });
      expect(reqInDb).toBeDefined();
      expect(reqInDb?.status).toBe(PasswordResetRequestStatus.PENDING);
      expect(reqInDb?.userId).toBe(testEmployeeUser.id);
    });

    // 2. Request appears in the administrator dashboard
    it('2. Request appears in administrator reset requests listing', async () => {
      const pendingList = await authService.getResetRequests('PENDING');
      const found = pendingList.find((r) => r.id === activeRequestId);

      expect(found).toBeDefined();
      expect(found?.userEmail).toBe(testEmployeeEmail);
      expect(found?.status).toBe(PasswordResetRequestStatus.PENDING);
    });

    // 3, 4, 5, 6. Administrator approves request, generates phrase, stores hash, returns phrase once
    it('3, 4, 5, 6. Administrator approves request, stores only HMAC hash, and receives plaintext phrase once', async () => {
      const approveRes = await authService.approveResetRequest(
        testAdminUser.id,
        testAdminUser.name,
        activeRequestId,
        {
          expiresInMinutes: 15,
        },
      );

      expect(approveRes.success).toBe(true);
      expect(approveRes.recoveryPhrase).toBeDefined();
      expect(approveRes.recoveryPhrase).toMatch(/^CPTL-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      issuedPassphrase = approveRes.recoveryPhrase!;

      // 5. Verify only cryptographic hash is persisted in database, never raw phrase
      const updatedReq = await prisma.passwordResetRequest.findUnique({
        where: { id: activeRequestId },
      });
      expect(updatedReq?.status).toBe(PasswordResetRequestStatus.APPROVED);
      expect(updatedReq?.passphraseHash).toBeDefined();
      expect(updatedReq?.passphraseHash).not.toEqual(issuedPassphrase);
      expect(updatedReq?.passphraseHash?.length).toBe(64); // 64 hex characters (SHA-256 / HMAC-SHA-256)

      const tokens = await prisma.passwordResetToken.findMany({
        where: { requestId: activeRequestId },
      });
      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe(updatedReq?.passphraseHash);
      expect(tokens[0].usedAt).toBeNull();
    });

    // 9. Incorrect phrase is rejected
    it('9. Incorrect recovery phrase is rejected with 400 Bad Request', async () => {
      await expect(
        authService.verifyPassphrase({
          identifier: testEmployeeEmail,
          passphrase: 'CPTL-FAKE-9999',
        }),
      ).rejects.toThrow();
    });

    // 12. Another employee cannot use the phrase
    it('12. Another employee cannot use this phrase (request & user binding enforced)', async () => {
      await expect(
        authService.verifyPassphrase({
          identifier: testOtherEmployeeEmail, // Different user
          passphrase: issuedPassphrase,
        }),
      ).rejects.toThrow();
    });

    // 8. Employee enters phrase containing whitespace and lowercase formatting
    it('8. Whitespace tolerance: phrase with extra internal spaces and lowercase verifies successfully', async () => {
      const formattedWithSpaces = `  ${issuedPassphrase.toLowerCase().replace('-', ' - ')}  `;
      const verifyRes = await authService.verifyPassphrase({
        identifier: testEmployeeId, // Using Employee ID
        passphrase: formattedWithSpaces,
      });

      expect(verifyRes.valid).toBe(true);
      expect(verifyRes.resetAuthToken).toBeDefined();
      expect(verifyRes.employee.name).toBe(testEmployeeUser.name);
      expect(verifyRes.employee.email).toBe(testEmployeeEmail);
    });

    // 7. Successful verification returns short-lived reset authorization token
    it('7. Successful verification issues a short-lived reset authorization token', async () => {
      const verifyRes = await authService.verifyPassphrase({
        identifier: testEmployeeEmail,
        passphrase: issuedPassphrase,
      });

      expect(verifyRes.valid).toBe(true);
      expect(verifyRes.resetAuthToken).toBeDefined();
      resetAuthToken = verifyRes.resetAuthToken;

      const tokenRow = await prisma.passwordResetToken.findFirst({
        where: { requestId: activeRequestId },
      });
      expect(tokenRow?.resetAuthHash).toBeDefined();
      expect(tokenRow?.resetAuthExpiresAt).toBeDefined();
      expect(tokenRow?.resetAuthUsedAt).toBeNull();
    });

    // 16. Invalid reset authorization token is rejected
    it('16. Invalid or forged reset authorization token is rejected', async () => {
      await expect(
        authService.resetPassword({
          resetAuthToken: 'forged_fake_token_abcdef1234567890',
          newPassword,
        }),
      ).rejects.toThrow();
    });

    // 17. Expired reset authorization token is rejected
    it('17. Expired reset authorization token is rejected', async () => {
      // Temporarily set authorization expiration to past
      await prisma.passwordResetToken.updateMany({
        where: { requestId: activeRequestId },
        data: { resetAuthExpiresAt: new Date(Date.now() - 60000) },
      });

      await expect(
        authService.resetPassword({
          resetAuthToken,
          newPassword,
        }),
      ).rejects.toThrow();

      // Restore expiration for subsequent test
      await prisma.passwordResetToken.updateMany({
        where: { requestId: activeRequestId },
        data: { resetAuthExpiresAt: new Date(Date.now() + 300000) },
      });
    });

    // 20, 21, 22. Password reset updates credentials, verifies with new password, invalidates old
    it('20, 21, 22. Successful reset updates password hash; new password authenticates; old password rejected', async () => {
      const resetRes = await authService.resetPassword({
        resetAuthToken,
        newPassword,
        identifier: testEmployeeEmail,
      });

      expect(resetRes.success).toBe(true);

      // Verify request transitioned to COMPLETED
      const completedReq = await prisma.passwordResetRequest.findUnique({
        where: { id: activeRequestId },
      });
      expect(completedReq?.status).toBe(PasswordResetRequestStatus.COMPLETED);

      // Verify token marked used
      const usedToken = await prisma.passwordResetToken.findFirst({
        where: { requestId: activeRequestId },
      });
      expect(usedToken?.usedAt).toBeDefined();
      expect(usedToken?.resetAuthUsedAt).toBeDefined();

      // 21. Authenticate with new password
      const newAuth = await authService.validateUser(testEmployeeEmail, newPassword);
      expect(newAuth).toBeDefined();
      expect(newAuth.email).toBe(testEmployeeEmail);

      // 22. Attempt authentication with old password fails
      await expect(
        authService.validateUser(testEmployeeEmail, initialPassword),
      ).rejects.toThrow();
    });

    // 15, 18. Consumed authorization and used phrases cannot be replayed
    it('15, 18. Consumed reset authorization token and used phrase cannot be reused (replay protection)', async () => {
      // Attempting to reuse the consumed authorization token
      await expect(
        authService.resetPassword({
          resetAuthToken,
          newPassword: 'AnotherPassword2026!',
        }),
      ).rejects.toThrow();

      // Attempting to re-verify the original phrase
      await expect(
        authService.verifyPassphrase({
          identifier: testEmployeeEmail,
          passphrase: issuedPassphrase,
        }),
      ).rejects.toThrow();
    });

    // 10, 11. Failed-attempt protection and locking after 5 invalid attempts
    it('10, 11. Five failed passphrase verification attempts trigger security lockout', async () => {
      // Create and approve a new request for testing lockout
      const reqRes = await authService.forgotPassword({ identifier: testOtherEmployeeEmail });
      const lockoutReqId = reqRes.requestId!;

      await authService.approveResetRequest(
        testAdminUser.id,
        testAdminUser.name,
        lockoutReqId,
      );

      // Send 4 invalid attempts
      for (let i = 1; i <= 4; i++) {
        await expect(
          authService.verifyPassphrase({
            identifier: testOtherEmployeeEmail,
            passphrase: 'CPTL-WRON-0000',
          }),
        ).rejects.toThrow();
      }

      // Check failed attempts count is 4
      const reqAfter4 = await prisma.passwordResetRequest.findUnique({
        where: { id: lockoutReqId },
      });
      expect(reqAfter4?.failedAttempts).toBe(4);
      expect(reqAfter4?.status).toBe(PasswordResetRequestStatus.APPROVED);

      // 5th attempt locks the request
      await expect(
        authService.verifyPassphrase({
          identifier: testOtherEmployeeEmail,
          passphrase: 'CPTL-WRON-0000',
        }),
      ).rejects.toThrow(/Too many failed/);

      // Verify request is now FAILED (locked)
      const reqAfter5 = await prisma.passwordResetRequest.findUnique({
        where: { id: lockoutReqId },
      });
      expect(reqAfter5?.status).toBe(PasswordResetRequestStatus.FAILED);

      // 11. Subsequent attempts remain locked
      await expect(
        authService.verifyPassphrase({
          identifier: testOtherEmployeeEmail,
          passphrase: 'CPTL-WRON-0000',
        }),
      ).rejects.toThrow(/locked/);
    });

    // 13. Expired recovery phrases are rejected
    it('13. Expired recovery phrases are rejected', async () => {
      const expReqRes = await authService.forgotPassword({ identifier: testEmployeeEmail });
      const expReqId = expReqRes.requestId!;

      const approveRes = await authService.approveResetRequest(
        testAdminUser.id,
        testAdminUser.name,
        expReqId,
      );
      const phrase = approveRes.recoveryPhrase!;

      // Force request and token expiration into the past
      await prisma.passwordResetRequest.update({
        where: { id: expReqId },
        data: { expiresAt: new Date(Date.now() - 60000) },
      });
      await prisma.passwordResetToken.updateMany({
        where: { requestId: expReqId },
        data: { expiresAt: new Date(Date.now() - 60000) },
      });

      await expect(
        authService.verifyPassphrase({
          identifier: testEmployeeEmail,
          passphrase: phrase,
        }),
      ).rejects.toThrow(/expired/);
    });

    // 14. Admin-rejected requests cannot be used
    it('14. Rejected password recovery requests cannot be verified or used', async () => {
      const rejReqRes = await authService.forgotPassword({ identifier: testOtherEmployeeEmail });
      const rejReqId = rejReqRes.requestId!;

      await authService.rejectResetRequest(
        testAdminUser.id,
        testAdminUser.name,
        rejReqId,
        { rejectReason: 'Could not verify employee identity via HR' },
      );

      const rejectedReq = await prisma.passwordResetRequest.findUnique({
        where: { id: rejReqId },
      });
      expect(rejectedReq?.status).toBe(PasswordResetRequestStatus.REJECTED);

      await expect(
        authService.verifyPassphrase({
          identifier: testOtherEmployeeEmail,
          passphrase: 'CPTL-ANYY-1234',
        }),
      ).rejects.toThrow();
    });

    // 19. Concurrent single-use race condition protection
    it('19. Concurrent reset requests cannot both succeed (atomic single-use race protection)', async () => {
      // Set up a fresh approved request and verified authorization token
      const raceReqRes = await authService.forgotPassword({ identifier: testEmployeeEmail });
      const raceReqId = raceReqRes.requestId!;

      const raceApprove = await authService.approveResetRequest(
        testAdminUser.id,
        testAdminUser.name,
        raceReqId,
      );

      const verified = await authService.verifyPassphrase({
        identifier: testEmployeeEmail,
        passphrase: raceApprove.recoveryPhrase!,
      });

      const authToken = verified.resetAuthToken;

      // Execute two simultaneous password reset calls with the exact same authorization
      const promise1 = authService.resetPassword({
        resetAuthToken: authToken,
        newPassword: 'PasswordOne2026!',
      });

      const promise2 = authService.resetPassword({
        resetAuthToken: authToken,
        newPassword: 'PasswordTwo2026!',
      });

      const results = await Promise.allSettled([promise1, promise2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE must succeed and ONE must be rejected!
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
    });
  });
});

