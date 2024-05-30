import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteSpecificPermissions1713509783878
  implements MigrationInterface
{
  name = 'DeleteSpecificPermissions1713509783878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionsToDelete = await queryRunner.query(
      `SELECT "id" FROM "121-service"."permission"
       WHERE "name" IN ('registration:status:rejected.update', 'registration:status:inclusionEnded.update')`,
    );

    const permissionIds = permissionsToDelete.map((perm) => perm.id);

    if (permissionIds.length > 0) {
      await queryRunner.query(
        `DELETE FROM "121-service"."user_role_permissions_permission"
         WHERE "permissionId" IN (${permissionIds.join(', ')})`,
      );

      await queryRunner.query(
        `DELETE FROM "121-service"."permission"
         WHERE "id" IN (${permissionIds.join(', ')})`,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
