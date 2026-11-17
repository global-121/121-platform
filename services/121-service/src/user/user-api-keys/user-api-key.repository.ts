import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Equal, Repository } from 'typeorm';

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

  public async createForUser({
    userId,
    apiKey,
    manager,
  }: {
    userId: number;
    apiKey: string;
    manager: EntityManager;
  }): Promise<void> {
    await manager.getRepository(UserApiKeyEntity).insert({ userId, apiKey });
  }

  public async deleteForUser({ userId }: { userId: number }): Promise<void> {
    await this.baseRepository.delete({ userId: Equal(userId) });
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
