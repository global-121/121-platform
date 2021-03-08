import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InterfaceScript } from './scripts.module';
import { UserRoleEntity } from '../user/user-role.entity';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedDev implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    // *****  ADD DATA YOU WANT TO SEED*****
    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    await userRoleRepository.save([
      {
        role: UserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
      },
    ]);

    await this.connection.close();
  }
}

export default SeedDev;
