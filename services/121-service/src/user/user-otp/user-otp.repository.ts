import { InjectRepository } from '@nestjs/typeorm';
import {
  Equal,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';

import { UserOtpEntity } from '@121-service/src/user/user-otp/user-otp.entity';

export class UserOtpRepository extends Repository<UserOtpEntity> {
  constructor(
    @InjectRepository(UserOtpEntity)
    private baseRepository: Repository<UserOtpEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async replaceForUserIfIssuedBeforeAndNotLocked({
    userId,
    otp,
    issuedAt,
    expiresAt,
    previousIssuedBefore,
  }: {
    userId: number;
    otp: string;
    issuedAt: Date;
    expiresAt: Date;
    previousIssuedBefore: Date;
  }): Promise<boolean> {
    const result = await this.baseRepository
      .createQueryBuilder()
      .insert()
      .values({
        userId,
        otp,
        issuedAt,
        expiresAt,
        consumedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
      })
      .orUpdate(
        [
          'otp',
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
  }): Promise<UserOtpEntity | null> {
    return await this.baseRepository.findOne({
      where: { userId: Equal(userId) },
    });
  }

  public async consumeIfUsable({
    userId,
    otp,
    consumedAt,
    maxFailedAttempts,
  }: {
    userId: number;
    otp: string;
    consumedAt: Date;
    maxFailedAttempts: number;
  }): Promise<boolean> {
    const result = await this.baseRepository.update(
      {
        userId: Equal(userId),
        otp: Equal(otp),
        consumedAt: IsNull(),
        expiresAt: MoreThan(consumedAt),
        failedAttempts: LessThan(maxFailedAttempts),
      },
      { consumedAt },
    );

    const isConsumed = result.affected === 1;
    return isConsumed;
  }

  public async recordFailedAttempt({
    userId,
    maxFailedAttempts,
    lockedUntil,
  }: {
    userId: number;
    maxFailedAttempts: number;
    lockedUntil: Date;
  }): Promise<void> {
    await this.baseRepository
      .createQueryBuilder()
      .update()
      .set({
        failedAttempts: () => '"failedAttempts" + 1',
        lockedUntil: () =>
          'CASE WHEN "failedAttempts" + 1 >= :maxFailedAttempts THEN :lockedUntil ELSE "lockedUntil" END',
      })
      .where({
        userId: Equal(userId),
        failedAttempts: LessThan(maxFailedAttempts),
      })
      .setParameters({ maxFailedAttempts, lockedUntil })
      .execute();
  }
}
