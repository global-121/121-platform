import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramAttachments1753802632310 implements MigrationInterface {
  name = 'AddProgramAttachments1753802632310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_attachment" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "userId" integer NOT NULL, "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "blobName" character varying NOT NULL, CONSTRAINT "PK_2f85b77e3fa056980e2999f2a89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42cca4c665cd14fc597e7a5227" ON "121-service"."program_attachment" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" ADD CONSTRAINT "FK_28fad6e9cfc39949b09a84437ea" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" ADD CONSTRAINT "FK_bed7ec4e8c775261cb9960b700f" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Adjust permissions for the new attachment features
    await this.adjustPermissions(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" DROP CONSTRAINT "FK_bed7ec4e8c775261cb9960b700f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_attachment" DROP CONSTRAINT "FK_28fad6e9cfc39949b09a84437ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_42cca4c665cd14fc597e7a5227"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."program_attachment"`);
  }

  private async adjustPermissions(queryRunner: QueryRunner) {
    const permissionMap = {
      'program:attachments.read': [
        'admin',
        'program-admin',
        'view',
        'cva-manager',
        'cva-officer',
        'finance-manager',
        'finance-officer',
      ],
      'program:attachments.create': [
        'admin',
        'program-admin',
        'cva-manager',
        'finance-manager',
      ],
      'program:attachments.delete': ['admin', 'program-admin'],
    };

    const permissionNames = Object.keys(permissionMap);

    for (const permissionName of permissionNames) {
      let permissionIdQuery = await queryRunner.query(
        `SELECT "id" FROM "121-service"."permission" WHERE "name" = '${permissionName}'`,
      );

      if (permissionIdQuery.length === 0) {
        await queryRunner.query(
          `INSERT INTO "121-service"."permission" ("name") VALUES ('${permissionName}')`,
        );

        permissionIdQuery = await queryRunner.query(
          `SELECT "id" FROM "121-service"."permission" WHERE "name" = '${permissionName}'`,
        );
      }

      const permissionId = permissionIdQuery[0].id;

      const rolesToAssign = (permissionMap as any)[permissionName];

      // Loop through each role and assign the permission
      for (const role of rolesToAssign) {
        const roleIdQuery = await queryRunner.query(
          `SELECT "id" FROM "121-service"."user_role" where "role" = '${role}'`,
        );

        if (roleIdQuery.length === 0) {
          // Skip if this role doesn't exist
          continue;
        }

        const roleId = roleIdQuery[0].id;

        const roleAssignment = await queryRunner.query(
          `SELECT "userRoleId" FROM "121-service"."user_role_permissions_permission" where "userRoleId" = ${roleId} and "permissionId" = ${permissionId}`,
        );

        if (roleAssignment.length === 0) {
          await queryRunner.query(
            `INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId") VALUES (${roleId}, ${permissionId})`,
          );
        }
      }
    }
  }
}
