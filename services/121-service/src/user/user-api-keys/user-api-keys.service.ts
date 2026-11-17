import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

import { CreateApiKeyParams } from '@121-service/src/user/user-api-keys/interfaces/create-api-key-params.interface';
import { CreateApiKeyResult } from '@121-service/src/user/user-api-keys/interfaces/create-api-key-result.interface';
import { GetUserIdByApiKeyParams } from '@121-service/src/user/user-api-keys/interfaces/get-user-id-by-api-key-params.interface';
import { GetUserIdByApiKeyResult } from '@121-service/src/user/user-api-keys/interfaces/get-user-id-by-api-key-result.interface';
import { API_KEY_BYTE_LENGTH } from '@121-service/src/user/user-api-keys/user-api-key.const';
import { UserApiKeyRepository } from '@121-service/src/user/user-api-keys/user-api-key.repository';

@Injectable()
export class UserApiKeysService {
  public constructor(
    private readonly userApiKeyRepository: UserApiKeyRepository,
  ) {}

  public async createApiKey({
    userId,
  }: CreateApiKeyParams): Promise<CreateApiKeyResult> {
    const apiKey = this.generateApiKey();
    await this.userApiKeyRepository.save({
      userId,
      apiKey: this.hashApiKey({ apiKey }),
    });
    return { apiKey };
  }

  private generateApiKey(): string {
    return crypto.randomBytes(API_KEY_BYTE_LENGTH).toString('base64url');
  }

  private hashApiKey({ apiKey }: { apiKey: string }): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  public async getUserIdByApiKey({
    apiKey,
  }: GetUserIdByApiKeyParams): Promise<GetUserIdByApiKeyResult | undefined> {
    const userApiKey = await this.userApiKeyRepository.getByApiKey({
      apiKey: this.hashApiKey({ apiKey }),
    });

    if (!userApiKey) {
      return;
    }

    return { userId: userApiKey.userId };
  }
}
