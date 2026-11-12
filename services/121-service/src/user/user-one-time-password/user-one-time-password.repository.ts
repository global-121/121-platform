import { InjectRepository } from '@nestjs/typeorm';
import {
  Equal,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';

import { UserOneTimePasswordEntity } from '@121-service/src/user/user-one-time-password/user-one-time-password.entity';

export class UserOneTimePasswordRepository extends Repository<UserOneTimePasswordEntity> {
  constructor(
    @InjectRepository(UserOneTimePasswordEntity)
    private baseRepository: Repository<UserOneTimePasswordEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async replaceForUserIfIssuedBeforeAndNotLocked({
    userId,
    oneTimePassword,
    issuedAt,
    expiresAt,
    previousIssuedBefore,
  }: {
    userId: number;
    oneTimePassword: string;
    issuedAt: Date;
    expiresAt: Date;
    previousIssuedBefore: Date;
  }): Promise<boolean> {
    const result = await this.baseRepository
      .createQueryBuilder()
      .insert()
      .values({
        userId,
        oneTimePassword,
        issuedAt,
        expiresAt,
        consumedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
      })
      .orUpdate(
        [
          'oneTimePassword',
          'issuedAt',
          'expiresAt',
          'consumedAt',
          'failedAttempts',
          'lockedUntil',
        ],
        ['userId'],
        {
          overwriteCondition: {
            where: [
              {
                issuedAt: LessThan(previousIssuedBefore),
                lockedUntil: IsNull(),
              },
              {
                issuedAt: LessThan(previousIssuedBefore),
                lockedUntil: LessThanOrEqual(issuedAt),
              },
            ],
          },
        },
      )
      .returning(['id'])
      .execute();

    const isInsertedOrReplaced = result.raw.length > 0;
    return isInsertedOrReplaced;
  }

  public async getByUserId({
    userId,
  }: {
    userId: number;
  }): Promise<UserOneTimePasswordEntity | null> {
    return await this.baseRepository.findOne({
      where: { userId: Equal(userId) },
    });
  }

  public async consumeIfUsable({
    userId,
    oneTimePassword,
    consumedAt,
    maxFailedAttempts,
  }: {
    userId: number;
    oneTimePassword: string;
    consumedAt: Date;
    maxFailedAttempts: number;
  }): Promise<boolean> {
    const result = await this.baseRepository.update(
      {
        userId: Equal(userId),
        oneTimePassword: Equal(oneTimePassword),
        consumedAt: IsNull(),
        expiresAt: MoreThan(consumedAt),
        failedAttempts: LessThan(maxFailedAttempts),
      },
      { consumedAt },
    );

    const isConsumed = result.affected === 1;
    return isConsumed;
  }

  public async recordFailedAttemptIfUsable({
    userId,
    oneTimePassword,
    now,
    maxFailedAttempts,
    lockedUntil,
  }: {
    userId: number;
    oneTimePassword: string;
    now: Date;
    maxFailedAttempts: number;
    lockedUntil: Date;
  }): Promise<{ isLocked: boolean }> {
    const result = await this.baseRepository
      .createQueryBuilder()
      .update()
      .set({
        failedAttempts: () => '"failedAttempts" + 1',
        lockedUntil: () =>
          'CASE WHEN "failedAttempts" + 1 >= :maxFailedAttempts THEN :lockedUntil ELSE "lockedUntil" END',
      })
      .where({
        userId: Equal(userId),
        oneTimePassword: Equal(oneTimePassword),
        consumedAt: IsNull(),
        expiresAt: MoreThan(now),
        failedAttempts: LessThan(maxFailedAttempts),
      })
      .setParameters({ maxFailedAttempts, lockedUntil })
      .returning(['lockedUntil'])
      .execute();

    const updatedRows: { lockedUntil: Date | null }[] = result.raw;
    const isLocked = updatedRows.some((row) => row.lockedUntil !== null);
    return { isLocked };
  }
}
