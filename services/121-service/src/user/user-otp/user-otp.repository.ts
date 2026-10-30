import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

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

  public async replaceForUserIfIssuedBefore({
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
      })
      .orUpdate(
        ['otp', 'issuedAt', 'expiresAt', 'consumedAt', 'failedAttempts'],
        ['userId'],
        {
          overwriteCondition: {
            where: { issuedAt: LessThan(previousIssuedBefore) },
          },
        },
      )
      .returning(['id'])
      .execute();

    const isInsertedOrReplaced = result.raw.length > 0;
    return isInsertedOrReplaced;
  }
}
