import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserApiKeyEntity } from '@121-service/src/user/user-api-keys/user-api-key.entity';
import { UserApiKeyRepository } from '@121-service/src/user/user-api-keys/user-api-key.repository';
import { UserApiKeysService } from '@121-service/src/user/user-api-keys/user-api-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserApiKeyEntity])],
  providers: [UserApiKeysService, UserApiKeyRepository],
  exports: [UserApiKeysService],
})
export class UserApiKeysModule {}
