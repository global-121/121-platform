import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SeedMockHelperServiceTyped } from '@121-service/src/scripts/services/seed-mock-helper-typed.service';

/**
 * Updated SeedMockHelperService that uses the new type-safe approach.
 * This can gradually replace the original service while maintaining backward compatibility.
 */
@Injectable()
export class SeedMockHelperServiceUpdated extends SeedMockHelperServiceTyped {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  // All methods are inherited from SeedMockHelperServiceTyped
  // This service exists to show how the transition can be made
}
