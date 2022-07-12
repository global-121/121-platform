import { FspQuestionEntity } from './../src/fsp/fsp-question.entity';
import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { ProgramEntity } from '../src/programs/program.entity';
import fs from 'fs';
import { RegistrationEntity } from '../src/registration/registration.entity';
import { RegistrationDataEntity } from '../src/registration/registration-data.entity';
import { InstanceEntity } from '../src/instance/instance.entity';
import { MonitoringQuestionEntity } from '../src/instance/monitoring-question.entity';
export class registrationData1656412499569 implements MigrationInterface {
  name = 'registrationData1656412499569';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."monitoring_question" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "intro" json NOT NULL, "conclusion" json NOT NULL, "options" json, CONSTRAINT "PK_7d225f0ae96964bfdffe7ea5a97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80cd1fc99c776e1893c667b4b2" ON "121-service"."monitoring_question" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "monitoringQuestionId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD CONSTRAINT "UQ_08faaae1dc458def2084456b201" UNIQUE ("monitoringQuestionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD CONSTRAINT "FK_08faaae1dc458def2084456b201" FOREIGN KEY ("monitoringQuestionId") REFERENCES "121-service"."monitoring_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "programQuestionId" integer, "fspQuestionId" integer, "programCustomAttributeId" integer, "monitoringQuestionId" integer, "value" character varying NOT NULL, CONSTRAINT "PK_ab77c4514c4e6be63475361e6ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f07a1f50a3d185ac010a45b47e" ON "121-service"."registration_data" ("created") `,
    );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP COLUMN "customData"`,
    // );
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD "customData" json NOT NULL DEFAULT '{}'`,
    // );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP CONSTRAINT "FK_08faaae1dc458def2084456b201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP CONSTRAINT "UQ_08faaae1dc458def2084456b201"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP COLUMN "monitoringQuestionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_80cd1fc99c776e1893c667b4b2"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."registration_data"`);
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_80cd1fc99c776e1893c667b4b2"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."monitoring_question"`);
  }

  private async migrateData(connection: Connection): Promise<void> {
    const programRepo = connection.getRepository(ProgramEntity);
    const registrationRepo = connection.getRepository(RegistrationEntity);
    const fspAttributeRepo = connection.getRepository(FspQuestionEntity);
    const registrationDataRepo = connection.getRepository(
      RegistrationDataEntity,
    );
    const instanceRepo = connection.getRepository(InstanceEntity);
    const monQuestionRepo = connection.getRepository(MonitoringQuestionEntity);

    let instancePilotLVV, instancePilotPV;
    try {
      instancePilotLVV = JSON.parse(
        fs.readFileSync('seed-data/instance/instance-pilot-nl.json', 'utf8'),
      );
      instancePilotPV = JSON.parse(
        fs.readFileSync('seed-data/instance/instance-pilot-nl-2.json', 'utf8'),
      );
    } catch {
      console.log(
        'NLRC programs not found. Not migrating phases and editable properties for NLRC program',
      );
    }
    if(!instancePilotLVV || !instancePilotPV){
      return;
    }

    const registrations = await registrationRepo
      .createQueryBuilder('registration')
      .select('registration.id')
      .addSelect('registration.customData')
      .getMany();

    if (registrations) {
      const fspAttributes = await fspAttributeRepo
        .createQueryBuilder('fspAttribute')
        .select('fspAttribute.id')
        .addSelect('fspAttribute.name')
        .getMany();

      const program = await programRepo
        .createQueryBuilder('program')
        .leftJoin('program.programQuestions', 'programQuestion')
        .leftJoin('program.programCustomAttributes', 'programCustomAttribute')
        .select('program.id')
        .addSelect('program.titlePortal')
        .addSelect('program.ngo')
        .addSelect('programQuestion.id')
        .addSelect('programQuestion.name')
        .addSelect('programCustomAttribute.id')
        .addSelect('programCustomAttribute.name')
        .where(`ngo = 'NLRC'`)
        .getOne();

      const instance = await instanceRepo
        .createQueryBuilder('instance')
        .select('instance.id')
        .getOne();

      if (fspAttributes && program && instance) {
        const programTitle = Object.assign(program.titlePortal);
        const titleString = programTitle['en'];
        const monitoringQuestion = new MonitoringQuestionEntity();
        monitoringQuestion.name = 'monitoringAnswer';
        if (titleString === 'NLRC Direct Digital Aid (LVV)') {
          // Use LVV monitoring question
          const monQuestion = instancePilotLVV['monitoringQuestion'];
          monitoringQuestion.intro = monQuestion['intro'];
          monitoringQuestion.options = monQuestion['options'];
          monitoringQuestion.conclusion = monQuestion['conclusion'];

          instance.monitoringQuestion = monitoringQuestion;
          await monQuestionRepo.save(monitoringQuestion);
          await instanceRepo.save(instance);
        } else if (titleString === 'NLRC Direct Digital Aid Program (PV)') {
          // Use PV monitoring question
          const monQuestion = instancePilotPV['monitoringQuestion'];
          monitoringQuestion.intro = monQuestion['intro'];
          monitoringQuestion.options = monQuestion['options'];
          monitoringQuestion.conclusion = monQuestion['conclusion'];

          instance.monitoringQuestion = monitoringQuestion;
          await monQuestionRepo.save(monitoringQuestion);
          await instanceRepo.save(instance);
        }

        for (const registration of registrations) {
          const customDataObject = Object.assign(registration.customData);
          for await (const key of Object.keys(customDataObject)) {
            const registrationData = new RegistrationDataEntity();
            registrationData.registrationId = registration.id;
            switch (key) {
              // Program Questions
              case 'nameFirst':
              case 'nameLast':
              case 'vnumber':
              case 'phoneNumber':
                const q = program.programQuestions.find(q => q.name === key);
                if (q) {
                  registrationData.programQuestion = q;
                  registrationData.value = registration.customData[key];
                }
                await registrationDataRepo.save(registrationData);
                break;
              // FSP attribute(s)
              case 'whatsappPhoneNumber':
                const attr = fspAttributes.find(att => att.name === key);
                if (attr) {
                  registrationData.fspQuestion = attr;
                  registrationData.value = registration.customData[key];
                }
                await registrationDataRepo.save(registrationData);
                break;
              // Custom data
              case 'namePartnerOrganization':
                const ca = program.programCustomAttributes.find(
                  q => q.name === key,
                );
                if (ca) {
                  registrationData.programCustomAttribute = ca;
                  registrationData.value = registration.customData[key];
                }
                await registrationDataRepo.save(registrationData);
                break;
              // Monitoring question
              case 'monitoringAnswer':
                registrationData.monitoringQuestion = monitoringQuestion;
                registrationData.value = registration.customData[key];

                await registrationDataRepo.save(registrationData);
                break;
            }
          }
        }
      }
    }
  }
}
