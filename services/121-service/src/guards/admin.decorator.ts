import { SetMetadata } from '@nestjs/common';

export const Admin = (...admin: any[]): any => SetMetadata('admin', admin);
