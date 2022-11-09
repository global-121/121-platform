import {MigrationInterface, QueryRunner} from "typeorm";

export class addRegistrationProgramIdColumn1667984005227 implements MigrationInterface {
    name = 'addRegistrationProgramIdColumn1667984005227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD "registrationProgramId" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP COLUMN "registrationProgramId"`);
    }

}
