import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  public async replaceForUser({
    userId,
    hash,
    expiresAt,
  }: {
    userId: number;
    hash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.baseRepository.upsert(
      { userId, hash, expiresAt, consumedAt: null, failedAttempts: 0 },
      { conflictPaths: ['userId'] },
    );
  }
}
