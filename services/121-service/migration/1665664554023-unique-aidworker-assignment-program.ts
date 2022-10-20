import {MigrationInterface, QueryRunner} from "typeorm";

export class uniqueAidworkerAssignmentProgram1665664554023 implements MigrationInterface {
    name = 'uniqueAidworkerAssignmentProgram1665664554023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ALTER COLUMN "programId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "userProgramAssignmentUnique" UNIQUE ("userId", "programId")`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_1315d078dc3df552bba424c032b" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" DROP CONSTRAINT "userProgramAssignmentUnique"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ALTER COLUMN "programId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_1315d078dc3df552bba424c032b" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
