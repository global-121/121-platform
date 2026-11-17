import { EntityManager } from 'typeorm';

export interface CreateApiKeyParams {
  readonly userId: number;
  readonly manager: EntityManager;
}
