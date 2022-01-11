import { MigrationInterface, QueryRunner } from "typeorm";

export class renamePartnerOrgToSegment1641908738060 implements MigrationInterface {
    name = 'renamePartnerOrgToSegment1641908738060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."registration" RENAME COLUMN "namePartnerOrganization" TO "segment"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."registration" RENAME COLUMN "segment" TO "namePartnerOrganization"`);
    }

}
