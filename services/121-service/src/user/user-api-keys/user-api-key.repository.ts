import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { UserApiKeyEntity } from '@121-service/src/user/user-api-keys/user-api-key.entity';

export class UserApiKeyRepository extends Repository<UserApiKeyEntity> {
  constructor(
    @InjectRepository(UserApiKeyEntity)
    private baseRepository: Repository<UserApiKeyEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getByApiKey({
    apiKey,
  }: {
    apiKey: string;
  }): Promise<UserApiKeyEntity | null> {
    return await this.baseRepository.findOne({
      where: { apiKey: Equal(apiKey) },
    });
  }
}
