import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { PermissionEntity } from '@121-service/src/user/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';
import { Equal, MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSelectForValidation1707311790028
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set PV validation to true
    const instances = await queryRunner.query(`
      select
        id
      from
        "121-service"."instance"
      where
        name = 'NLRC';`);
    if (instances.length > 0) {
      await queryRunner.query(`
          update "121-service"."program"
          set "validation" = true
          where "id" = 2;
        `);
    }
    // Update registration status from selectedForValidation to registered (if any)
    await queryRunner.query(`
    UPDATE "121-service"."registration" SET "registrationStatus" = 'registered' WHERE "registrationStatus" = 'selectedForValidation';
      `);
    // Drop selected-for-validation from export-arrays (this assumes constant order in current array, which is the case AFAIK), finding a generic drop-array-element method was not easy
    await queryRunner.query(`
      update "121-service"."program_question" set export = '["all-people-affected","included","payment"]' where export::text = '["all-people-affected","included","selected-for-validation","payment"]';
      update "121-service"."program_question" set export = '["all-people-affected","included"]' where export::text = '["all-people-affected","included","selected-for-validation"]';
      update "121-service"."program_question" set export = '["all-people-affected"]' where export::text = '["all-people-affected","selected-for-validation"]';
      update "121-service"."program_question" set export = '[]' where export::text = '["selected-for-validation"]';
      update "121-service"."fsp_attribute" set export = '["all-people-affected","included","payment"]' where export::text = '["all-people-affected","included","selected-for-validation","payment"]';
      update "121-service"."fsp_attribute" set export = '["all-people-affected","included"]' where export::text = '["all-people-affected","included","selected-for-validation"]';
      update "121-service"."fsp_attribute" set export = '["all-people-affected"]' where export::text = '["all-people-affected","selected-for-validation"]';
      update "121-service"."fsp_attribute" set export = '[]' where export::text = '["selected-for-validation"]';
      `);

    // Add the new permissions
    const permissionsRepository =
      queryRunner.manager.getRepository(PermissionEntity);
    const newPermissions = [
      'registration:status:markAsValidated.update',
      'registration:status:markAsDeclined.update',
    ];

    for (const newPermission of newPermissions) {
      const name = newPermission as PermissionEnum;
      const permission = new PermissionEntity();
      permission.name = name;
      let permissionEntity = await permissionsRepository.findOne({
        where: { name: Equal(name) },
      });
      if (!permissionEntity) {
        permissionEntity = await permissionsRepository.save(permission);
      }

      // Loop over all existing roles, if it has the closes permission, also add the new permission
      const closestPermission =
        'registration:status:selectedForValidation.update' as PermissionEnum;
      const userRoleRepository =
        queryRunner.manager.getRepository(UserRoleEntity);
      const userRoles = await userRoleRepository.find({
        relations: ['permissions'],
      });
      for (const role of userRoles) {
        const rolePermissions = role.permissions.map(
          (p) => p.name as PermissionEnum,
        );
        if (
          (rolePermissions.includes(closestPermission) ||
            role.role === 'partner') && // specifically also add to NLRC partner role
          !rolePermissions.includes(name)
        ) {
          role.permissions.push(permissionEntity);
          await userRoleRepository.save(role);
        }
      }
    }

    // Remove permission from roles and permission itself
    const oldPermissionName =
      'registration:status:selectedForValidation.update' as any;
    const oldPermission = await permissionsRepository.findOne({
      where: { name: Equal(oldPermissionName) },
      relations: ['roles'],
    });
    if (oldPermission) {
      oldPermission.roles = [];
      // Removes relations
      await permissionsRepository.save(oldPermission);
      await permissionsRepository.delete({
        name: oldPermissionName,
      });
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
