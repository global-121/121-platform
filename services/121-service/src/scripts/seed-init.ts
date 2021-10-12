import { UserRole } from '../user-role.enum';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import crypto from 'crypto';
import { UserRoleEntity } from '../user/user-role.entity';
import { UserType } from '../user/user-type-enum';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.dropAll();
    await this.connection.synchronize();

    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    await userRoleRepository.save([
      {
        role: UserRole.Admin,
        label: 'Admin',
      },
      {
        role: UserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
      },
      {
        role: UserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
      },
      {
        role: UserRole.RunProgram,
        label: 'Run Program',
      },
      {
        role: UserRole.FieldValidation,
        label: 'Do Field Validation',
      },
    ]);

    // ***** CREATE ADMIN USER *****

    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: crypto
        .createHmac('sha256', process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN)
        .digest('hex'),
      userType: UserType.aidWorker,
    });
  }

  public async dropAll(): Promise<void> {
    const entities = this.connection.entityMetadatas;
    try {
      for (const entity of entities) {
        const repository = await this.connection.getRepository(entity.name);
        if (repository.metadata.schema === '121-service') {
          const q = `DROP TABLE \"${repository.metadata.schema}\".\"${entity.tableName}\" CASCADE;`;
          await repository.query(q);
        }
      }
    } catch (error) {
      throw new Error(`ERROR: Cleaning test db: ${error}`);
    }
  }
}

export default SeedInit;
