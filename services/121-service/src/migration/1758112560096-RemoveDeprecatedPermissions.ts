import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeprecatedPermissions1758112560096 implements Omit<
  MigrationInterface,
  'down'
> {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    /** Now handled in: @see {PermissionMaintenanceService.removeExtraneousPermissions} */
  }
}
