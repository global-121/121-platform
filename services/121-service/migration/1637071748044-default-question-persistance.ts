import {MigrationInterface, QueryRunner} from "typeorm";

export class defaultQuestionPersistance1637071748044 implements MigrationInterface {
    name = 'defaultQuestionPersistance1637071748044'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program_question" ALTER COLUMN "persistence" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program_question" ALTER COLUMN "persistence" SET DEFAULT false`);
    }

}
