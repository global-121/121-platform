import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { UserOtpEntity } from '@121-service/src/user/user-otp/user-otp.entity';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';

describe('UserOtpRepository', () => {
  const maxFailedAttempts = 5;
  const issuedAtFirstOtp = new Date('2026-10-27T10:00:00.000Z');
  const issuedAtSecondOtp = new Date('2026-10-27T10:02:00.000Z');
  const tenMinutesInMs = 10 * 60_000;
  const lockedUntil = new Date('2026-10-27T10:17:00.000Z');
  const firstOtp = 'a'.repeat(64);
  const secondOtp = 'b'.repeat(64);

  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let userOtpRepository: UserOtpRepository;
  let userId: number;

  const tryIssueOtp = async ({
    otp,
    issuedAt,
  }: {
    otp: string;
    issuedAt: Date;
  }): Promise<boolean> =>
    await userOtpRepository.replaceForUserIfIssuedBeforeAndNotLocked({
      userId,
      otp,
      issuedAt,
      expiresAt: new Date(issuedAt.getTime() + tenMinutesInMs),
      previousIssuedBefore: new Date(issuedAt.getTime() - 60_000),
    });

  const issueOtp = async ({
    otp,
    issuedAt,
  }: {
    otp: string;
    issuedAt: Date;
  }): Promise<void> => {
    const isIssued = await tryIssueOtp({ otp, issuedAt });
    expect(isIssued).toBe(true);
  };

  const lockOtp = async ({ now }: { now: Date }): Promise<void> => {
    for (let attempt = 0; attempt < maxFailedAttempts; attempt++) {
      await userOtpRepository.recordFailedAttemptIfUsable({
        userId,
        otp: firstOtp,
        now,
        maxFailedAttempts,
        lockedUntil,
      });
    }
  };

  const getStoredOtpOrThrow = async (): Promise<UserOtpEntity> => {
    const userOtp = await userOtpRepository.getByUserId({ userId });
    if (!userOtp) {
      throw new Error('Expected the user to have a stored OTP');
    }
    return userOtp;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...ORMConfig,
          entities: ['src/**/*.entity.ts'],
          subscribers: [],
        }),
        TypeOrmModule.forFeature([UserOtpEntity]),
      ],
      providers: [UserOtpRepository],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    userOtpRepository = moduleRef.get(UserOtpRepository);
  });

  beforeEach(async () => {
    const userRepository = dataSource.getRepository(UserEntity);
    const user = await userRepository.save(
      userRepository.create({
        username: `otp-repository-${crypto.randomUUID()}@example.org`,
        password: 'password',
        userType: UserType.aidWorker,
        displayName: 'OTP repository test user',
      }),
    );
    userId = user.id;
  });

  afterEach(async () => {
    // The stored OTP is removed with the user (ON DELETE CASCADE)
    await dataSource.getRepository(UserEntity).delete({ id: userId });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('when issuing a new code', () => {
    const afterCooldownBeforeLockExpires = new Date('2026-10-27T10:10:00.000Z');
    const afterLockExpires = new Date('2026-10-27T10:18:00.000Z');
    const withinCooldown = new Date('2026-10-27T10:00:30.000Z');

    it('refuses a new code while the user is locked, even after the cooldown has passed', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });
      await lockOtp({ now: issuedAtFirstOtp });

      // Act
      const isIssued = await tryIssueOtp({
        otp: secondOtp,
        issuedAt: afterCooldownBeforeLockExpires,
      });

      // Assert
      expect(isIssued).toBe(false);
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.otp).toBe(firstOtp);
      expect(storedOtp.failedAttempts).toBe(maxFailedAttempts);
      expect(storedOtp.lockedUntil).toEqual(lockedUntil);
    });

    it('issues a new code after the lock has expired and resets the failed attempts and the lock', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });
      await lockOtp({ now: issuedAtFirstOtp });

      // Act
      const isIssued = await tryIssueOtp({
        otp: secondOtp,
        issuedAt: afterLockExpires,
      });

      // Assert
      expect(isIssued).toBe(true);
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.otp).toBe(secondOtp);
      expect(storedOtp.failedAttempts).toBe(0);
      expect(storedOtp.lockedUntil).toBeNull();
      expect(storedOtp.consumedAt).toBeNull();
    });

    it('refuses a new code within the cooldown when the user is not locked', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });

      // Act
      const isIssued = await tryIssueOtp({
        otp: secondOtp,
        issuedAt: withinCooldown,
      });

      // Assert
      expect(isIssued).toBe(false);
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.otp).toBe(firstOtp);
    });
  });

  describe('when recording a failed attempt', () => {
    it('does not count failed attempts observed on a code that was replaced since', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });
      await issueOtp({ otp: secondOtp, issuedAt: issuedAtSecondOtp });

      // Act
      await Promise.all(
        Array.from({ length: maxFailedAttempts }, () =>
          userOtpRepository.recordFailedAttemptIfUsable({
            userId,
            otp: firstOtp,
            now: issuedAtSecondOtp,
            maxFailedAttempts,
            lockedUntil,
          }),
        ),
      );

      // Assert
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.otp).toBe(secondOtp);
      expect(storedOtp.failedAttempts).toBe(0);
      expect(storedOtp.lockedUntil).toBeNull();
    });

    it('counts a failed attempt observed on the current code', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });

      // Act
      await userOtpRepository.recordFailedAttemptIfUsable({
        userId,
        otp: firstOtp,
        now: issuedAtFirstOtp,
        maxFailedAttempts,
        lockedUntil,
      });

      // Assert
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.failedAttempts).toBe(1);
      expect(storedOtp.lockedUntil).toBeNull();
    });

    it('locks the code when the maximum number of failed attempts is reached', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });

      // Act
      for (let attempt = 0; attempt < maxFailedAttempts + 1; attempt++) {
        await userOtpRepository.recordFailedAttemptIfUsable({
          userId,
          otp: firstOtp,
          now: issuedAtFirstOtp,
          maxFailedAttempts,
          lockedUntil,
        });
      }

      // Assert
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.failedAttempts).toBe(maxFailedAttempts);
      expect(storedOtp.lockedUntil).toEqual(lockedUntil);
    });

    it('does not count a failed attempt on an expired code', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });
      const expiresAt = (await getStoredOtpOrThrow()).expiresAt;

      // Act
      await userOtpRepository.recordFailedAttemptIfUsable({
        userId,
        otp: firstOtp,
        now: expiresAt,
        maxFailedAttempts,
        lockedUntil,
      });

      // Assert
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.failedAttempts).toBe(0);
    });

    it('does not count a failed attempt on a code that was already used', async () => {
      // Arrange
      await issueOtp({ otp: firstOtp, issuedAt: issuedAtFirstOtp });
      await userOtpRepository.consumeIfUsable({
        userId,
        otp: firstOtp,
        consumedAt: issuedAtFirstOtp,
        maxFailedAttempts,
      });

      // Act
      await userOtpRepository.recordFailedAttemptIfUsable({
        userId,
        otp: firstOtp,
        now: issuedAtFirstOtp,
        maxFailedAttempts,
        lockedUntil,
      });

      // Assert
      const storedOtp = await getStoredOtpOrThrow();
      expect(storedOtp.failedAttempts).toBe(0);
    });
  });
});
