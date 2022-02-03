import { SetMetadata } from '@nestjs/common';

export const PersonAffectedAuth = (...personAffectedAuth: any[]): any =>
  SetMetadata('personAffectedAuth', personAffectedAuth);
