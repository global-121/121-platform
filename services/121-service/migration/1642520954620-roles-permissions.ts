import { PermissionEnum } from './../src/user/permission.enum';
import { DefaultUserRole } from './../src/user/user-role.enum';
import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEntity } from './../src/user/permissions.entity';
import { UserRoleEntity } from './../src/user/user-role.entity';

export class rolesPermissions1642520954620 implements MigrationInterface {
  public constructor(queryRunner: QueryRunner) {}

  name = 'rolesPermissions1642520954620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const resultCreate = await queryRunner.query(
      `CREATE TABLE "121-service"."permission" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2139f3b5ad8f7e095679fb50cf" ON "121-service"."permission" ("created") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_240853a0c3353c25fb12434ad3" ON "121-service"."permission" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."user_role_permissions_permission" ("userRoleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_27a1de268ae064dab970c081609" PRIMARY KEY ("userRoleId", "permissionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06012ed04be71b8bef3a3968ea" ON "121-service"."user_role_permissions_permission" ("userRoleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0ca2057b5085083ff9f18e3f9" ON "121-service"."user_role_permissions_permission" ("permissionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role" ADD CONSTRAINT "UQ_30ddd91a212a9d03669bc1dee74" UNIQUE ("role")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role" DROP CONSTRAINT "UQ_30ddd91a212a9d03669bc1dee74"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f0ca2057b5085083ff9f18e3f9"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_06012ed04be71b8bef3a3968ea"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."user_role_permissions_permission"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_240853a0c3353c25fb12434ad3"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2139f3b5ad8f7e095679fb50cf"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."permission"`);
  }

  private async migrateData(connection: Connection): Promise<void> {
    const permissionsRepository = connection.getRepository(PermissionEntity);
    const permissionEntities = [];
    for (const permissionName of Object.values(PermissionEnum)) {
      const permission = new PermissionEntity();
      permission.name = permissionName as PermissionEnum;
      const permissionEntity = await permissionsRepository.save(permission);
      permissionEntities.push(permissionEntity);
    }
    const permissions = permissionEntities;

    const userRoleRepository = connection.getRepository(UserRoleEntity);

    const defaultRoles = [
      {
        role: DefaultUserRole.Admin,
        label: 'Admin',
        permissions: Object.values(PermissionEnum),
      },
      {
        role: DefaultUserRole.RunProgram,
        label: 'Run Program',
        permissions: [
          PermissionEnum.InstanceUPDATE,
          PermissionEnum.ProgramCREATE,
          PermissionEnum.ProgramUPDATE,
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramPhaseUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.AidWorkerCREATE,
          PermissionEnum.AidWorkerDELETE,
          PermissionEnum.AidWorkerProgramUPDATE,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
        ],
      },
      {
        role: DefaultUserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
        permissions: [
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.ActionREAD,
        ],
      },
      {
        role: DefaultUserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
        permissions: [
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentFspInstructionREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
        ],
      },
      {
        role: DefaultUserRole.FieldValidation,
        label: 'Do Field Validation',
        permissions: [
          PermissionEnum.RegistrationReferenceIdSEARCH,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
        ],
      },
    ];

    const userRoleEntities = [];
    for (const defaultRole of defaultRoles) {
      const defaultRoleEntity = await userRoleRepository.findOne({
        where: { role: defaultRole.role },
      });
      if (!defaultRoleEntity) {
        // Migrations are also run, during seed, so on empty database, in which case there are no users to update
        continue;
      }
      defaultRoleEntity.role = defaultRole.role;
      defaultRoleEntity.label = defaultRole.label;
      defaultRoleEntity.permissions = permissions.filter(permission =>
        defaultRole.permissions.includes(permission.name),
      );
      userRoleEntities.push(await userRoleRepository.save(defaultRoleEntity));
    }
  }
}
