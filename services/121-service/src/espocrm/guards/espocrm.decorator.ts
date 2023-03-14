import { SetMetadata } from '@nestjs/common';

export const Espocrm = (...espocrm: any[]): any =>
  SetMetadata('espocrm', espocrm);
