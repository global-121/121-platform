import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { UserOneTimePasswordEntity } from '@121-service/src/user/user-one-time-password/user-one-time-password.entity';
import { UserOneTimePasswordRepository } from '@121-service/src/user/user-one-time-password/user-one-time-password.repository';

describe('UserOneTimePasswordRepository', () => {
  const maxFailedAttempts = 5;
  const issuedAtFirstOneTimePassword = new Date('2026-10-27T10:00:00.000Z');
  const issuedAtSecondOneTimePassword = new Date('2026-10-27T10:02:00.000Z');
  const tenMinutesInMs = 10 * 60_000;
  const lockedUntil = new Date('2026-10-27T10:17:00.000Z');
  const firstOneTimePassword = 'a'.repeat(64);
  const secondOneTimePassword = 'b'.repeat(64);

  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let userOneTimePasswordRepository: UserOneTimePasswordRepository;
  let userId: number;

  const tryIssueOneTimePassword = async ({
    oneTimePassword,
    issuedAt,
  }: {
    oneTimePassword: string;
    issuedAt: Date;
  }): Promise<boolean> =>
    await userOneTimePasswordRepository.replaceForUserIfIssuedBeforeAndNotLocked({
      userId,
      oneTimePassword,
      issuedAt,
      expiresAt: new Date(issuedAt.getTime() + tenMinutesInMs),
      previousIssuedBefore: new Date(issuedAt.getTime() - 60_000),
    });

  const issueOneTimePassword = async ({
    oneTimePassword,
    issuedAt,
  }: {
    oneTimePassword: string;
    issuedAt: Date;
  }): Promise<void> => {
    const isIssued = await tryIssueOneTimePassword({ oneTimePassword, issuedAt });
    expect(isIssued).toBe(true);
  };

  const lockOneTimePassword = async ({ now }: { now: Date }): Promise<void> => {
    for (let attempt = 0; attempt < maxFailedAttempts; attempt++) {
      await userOneTimePasswordRepository.recordFailedAttemptIfUsable({
        userId,
        oneTimePassword: firstOneTimePassword,
        now,
        maxFailedAttempts,
        lockedUntil,
      });
    }
  };

  const consumeOneTimePassword = async ({
    oneTimePassword,
    consumedAt,
  }: {
    oneTimePassword: string;
    consumedAt: Date;
  }): Promise<boolean> =>
    await userOneTimePasswordRepository.consumeIfUsable({
      userId,
      oneTimePassword,
      consumedAt,
      maxFailedAttempts,
    });

  const getStoredOneTimePasswordOrThrow = async (): Promise<UserOneTimePasswordEntity> => {
    const userOneTimePassword = await userOneTimePasswordRepository.getByUserId({ userId });
    if (!userOneTimePassword) {
      throw new Error('Expected the user to have a stored one-time password');
    }
    return userOneTimePassword;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...ORMConfig,
          entities: ['src/**/*.entity.ts'],
          subscribers: [],
        }),
        TypeOrmModule.forFeature([UserOneTimePasswordEntity]),
      ],
      providers: [UserOneTimePasswordRepository],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    userOneTimePasswordRepository = moduleRef.get(UserOneTimePasswordRepository);
  });

  beforeEach(async () => {
    const userRepository = dataSource.getRepository(UserEntity);
    const user = await userRepository.save(
      userRepository.create({
        username: `one-time-password-repository-${crypto.randomUUID()}@example.org`,
        password: 'password',
        userType: UserType.aidWorker,
        displayName: 'One-time password repository test user',
      }),
    );
    userId = user.id;
  });

  afterEach(async () => {
    // The stored one-time password is removed with the user (ON DELETE CASCADE)
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
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await lockOneTimePassword({ now: issuedAtFirstOneTimePassword });

      // Act
      const isIssued = await tryIssueOneTimePassword({
        oneTimePassword: secondOneTimePassword,
        issuedAt: afterCooldownBeforeLockExpires,
      });

      // Assert
      expect(isIssued).toBe(false);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.oneTimePassword).toBe(firstOneTimePassword);
      expect(storedOneTimePassword.failedAttempts).toBe(maxFailedAttempts);
      expect(storedOneTimePassword.lockedUntil).toEqual(lockedUntil);
    });

    it('issues a new code after the lock has expired and resets the failed attempts and the lock', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await lockOneTimePassword({ now: issuedAtFirstOneTimePassword });

      // Act
      const isIssued = await tryIssueOneTimePassword({
        oneTimePassword: secondOneTimePassword,
        issuedAt: afterLockExpires,
      });

      // Assert
      expect(isIssued).toBe(true);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.oneTimePassword).toBe(secondOneTimePassword);
      expect(storedOneTimePassword.failedAttempts).toBe(0);
      expect(storedOneTimePassword.lockedUntil).toBeNull();
      expect(storedOneTimePassword.consumedAt).toBeNull();
    });

    it('refuses a new code within the cooldown when the user is not locked', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });

      // Act
      const isIssued = await tryIssueOneTimePassword({
        oneTimePassword: secondOneTimePassword,
        issuedAt: withinCooldown,
      });

      // Assert
      expect(isIssued).toBe(false);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.oneTimePassword).toBe(firstOneTimePassword);
    });
  });

  describe('when consuming a code', () => {
    const duringValidity = new Date('2026-10-27T10:05:00.000Z');

    it('consumes the current code while it is valid', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });

      // Act
      const isConsumed = await consumeOneTimePassword({
        oneTimePassword: firstOneTimePassword,
        consumedAt: duringValidity,
      });

      // Assert
      expect(isConsumed).toBe(true);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.consumedAt).toEqual(duringValidity);
    });

    it('refuses an expired code', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      const { expiresAt } = await getStoredOneTimePasswordOrThrow();

      // Act
      const isConsumed = await consumeOneTimePassword({
        oneTimePassword: firstOneTimePassword,
        consumedAt: expiresAt,
      });

      // Assert
      expect(isConsumed).toBe(false);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.consumedAt).toBeNull();
    });

    it('refuses a locked code, even when the code is correct', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await lockOneTimePassword({ now: issuedAtFirstOneTimePassword });

      // Act
      const isConsumed = await consumeOneTimePassword({
        oneTimePassword: firstOneTimePassword,
        consumedAt: duringValidity,
      });

      // Assert
      expect(isConsumed).toBe(false);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.consumedAt).toBeNull();
    });

    it('refuses a code that was already consumed', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await consumeOneTimePassword({ oneTimePassword: firstOneTimePassword, consumedAt: duringValidity });
      const laterDuringValidity = new Date(duringValidity.getTime() + 1000);

      // Act
      const isConsumedAgain = await consumeOneTimePassword({
        oneTimePassword: firstOneTimePassword,
        consumedAt: laterDuringValidity,
      });

      // Assert
      expect(isConsumedAgain).toBe(false);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.consumedAt).toEqual(duringValidity);
    });

    it('refuses a code that was replaced by a newer one', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await issueOneTimePassword({ oneTimePassword: secondOneTimePassword, issuedAt: issuedAtSecondOneTimePassword });

      // Act
      const isConsumed = await consumeOneTimePassword({
        oneTimePassword: firstOneTimePassword,
        consumedAt: issuedAtSecondOneTimePassword,
      });

      // Assert
      expect(isConsumed).toBe(false);
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.oneTimePassword).toBe(secondOneTimePassword);
      expect(storedOneTimePassword.consumedAt).toBeNull();
    });

    it('lets exactly one of two concurrent consumes of a valid code succeed', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });

      // Act
      const results = await Promise.all([
        consumeOneTimePassword({ oneTimePassword: firstOneTimePassword, consumedAt: duringValidity }),
        consumeOneTimePassword({ oneTimePassword: firstOneTimePassword, consumedAt: duringValidity }),
      ]);

      // Assert
      expect(results.filter(Boolean)).toHaveLength(1);
    });
  });

  describe('when recording a failed attempt', () => {
    it('does not count failed attempts observed on a code that was replaced since', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await issueOneTimePassword({ oneTimePassword: secondOneTimePassword, issuedAt: issuedAtSecondOneTimePassword });

      // Act
      await Promise.all(
        Array.from({ length: maxFailedAttempts }, () =>
          userOneTimePasswordRepository.recordFailedAttemptIfUsable({
            userId,
            oneTimePassword: firstOneTimePassword,
            now: issuedAtSecondOneTimePassword,
            maxFailedAttempts,
            lockedUntil,
          }),
        ),
      );

      // Assert
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.oneTimePassword).toBe(secondOneTimePassword);
      expect(storedOneTimePassword.failedAttempts).toBe(0);
      expect(storedOneTimePassword.lockedUntil).toBeNull();
    });

    it('counts a failed attempt observed on the current code', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });

      // Act
      await userOneTimePasswordRepository.recordFailedAttemptIfUsable({
        userId,
        oneTimePassword: firstOneTimePassword,
        now: issuedAtFirstOneTimePassword,
        maxFailedAttempts,
        lockedUntil,
      });

      // Assert
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.failedAttempts).toBe(1);
      expect(storedOneTimePassword.lockedUntil).toBeNull();
    });

    it('locks the code when the maximum number of failed attempts is reached', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });

      // Act
      for (let attempt = 0; attempt < maxFailedAttempts + 1; attempt++) {
        await userOneTimePasswordRepository.recordFailedAttemptIfUsable({
          userId,
          oneTimePassword: firstOneTimePassword,
          now: issuedAtFirstOneTimePassword,
          maxFailedAttempts,
          lockedUntil,
        });
      }

      // Assert
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.failedAttempts).toBe(maxFailedAttempts);
      expect(storedOneTimePassword.lockedUntil).toEqual(lockedUntil);
    });

    it('reports the lock only for the attempt that reaches the maximum', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      const lockResults: boolean[] = [];

      // Act
      for (let attempt = 0; attempt < maxFailedAttempts + 1; attempt++) {
        const { isLocked } =
          await userOneTimePasswordRepository.recordFailedAttemptIfUsable({
            userId,
            oneTimePassword: firstOneTimePassword,
            now: issuedAtFirstOneTimePassword,
            maxFailedAttempts,
            lockedUntil,
          });
        lockResults.push(isLocked);
      }

      // Assert
      expect(lockResults).toEqual([false, false, false, false, true, false]);
    });

    it('does not count a failed attempt on an expired code', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      const expiresAt = (await getStoredOneTimePasswordOrThrow()).expiresAt;

      // Act
      await userOneTimePasswordRepository.recordFailedAttemptIfUsable({
        userId,
        oneTimePassword: firstOneTimePassword,
        now: expiresAt,
        maxFailedAttempts,
        lockedUntil,
      });

      // Assert
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.failedAttempts).toBe(0);
    });

    it('does not count a failed attempt on a code that was already used', async () => {
      // Arrange
      await issueOneTimePassword({ oneTimePassword: firstOneTimePassword, issuedAt: issuedAtFirstOneTimePassword });
      await userOneTimePasswordRepository.consumeIfUsable({
        userId,
        oneTimePassword: firstOneTimePassword,
        consumedAt: issuedAtFirstOneTimePassword,
        maxFailedAttempts,
      });

      // Act
      await userOneTimePasswordRepository.recordFailedAttemptIfUsable({
        userId,
        oneTimePassword: firstOneTimePassword,
        now: issuedAtFirstOneTimePassword,
        maxFailedAttempts,
        lockedUntil,
      });

      // Assert
      const storedOneTimePassword = await getStoredOneTimePasswordOrThrow();
      expect(storedOneTimePassword.failedAttempts).toBe(0);
    });
  });
});
