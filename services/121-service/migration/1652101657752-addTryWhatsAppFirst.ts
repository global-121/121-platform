import { ProgramEntity } from './../src/programs/program.entity';
import { Connection, MigrationInterface, QueryRunner } from 'typeorm';

export class addTryWhatsAppFirst1652101657752 implements MigrationInterface {
  name = 'addTryWhatsAppFirst1652101657752';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "tryWhatsAppFirst" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."try_whatsapp" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "sid" character varying NOT NULL, "registrationId" integer, CONSTRAINT "REL_f9302bf2f79e322f0e35357e80" UNIQUE ("registrationId"), CONSTRAINT "PK_43eae0bde4f6860ad2586b1b9ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80de8dd79363e1274cfdba6bd4" ON "121-service"."try_whatsapp" ("created") `,
    );
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "tryWhatsAppFirst"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_80de8dd79363e1274cfdba6bd4"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."try_whatsapp"`);
  }

  private async migrateData(connection: Connection): Promise<void> {
    const programRepo = connection.getRepository(ProgramEntity);
    const programs = await programRepo
      .createQueryBuilder('program')
      .select('program.id')
      .addSelect('program.ngo')
      .getMany();
    for (const p of programs) {
      if (p.ngo === 'NLRC') {
        p.tryWhatsAppFirst = true;
        programRepo.save(p);
      }
    }
  }
}
