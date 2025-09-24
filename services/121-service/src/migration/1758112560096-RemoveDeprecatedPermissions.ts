import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeprecatedPermissions1758112560096
  implements MigrationInterface
{
  public async up(_queryRunner: QueryRunner): Promise<void> {
    /** Now handled in: @see {PermissionMaintenanceService.removeExtraneousPermissions} */
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
