import { UserRoleEntity } from './../src/user/user-role.entity';
import { Connection, MigrationInterface, QueryRunner } from 'typeorm';

export class programAdmin1666165585423 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(connection: Connection): Promise<void> {
    const userRoleRepo = connection.getRepository(UserRoleEntity);
    const roles = await userRoleRepo.find({
      where: { role: 'admin' },
    });
    for (const r of roles) {
      r.role = 'program-admin';
      r.label = 'Program Admin';
      await userRoleRepo.save(r);
    }
  }
}
