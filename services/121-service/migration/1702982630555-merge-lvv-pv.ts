import * as fs from 'fs';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeLvvPv1702982630555 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const instances = await queryRunner.query(`
      select
        id
      from
        "121-service"."instance"
      where
        name = 'NLRC';`);

    // Is NLRC
    if (instances.length > 0) {
      await this.updateRegistrationProgramId(queryRunner);
      await this.updateRegistrationDataId(queryRunner);
      await this.updateTemplates(queryRunner);
      await this.changeProgramIdEntities(queryRunner);
      await this.updatePaymentNumber(queryRunner);
      await this.removeUnusedEntities(queryRunner);
      await this.mergeNameFirstLast(queryRunner);
    }
  }

  private async updatePaymentNumber(queryRunner: QueryRunner): Promise<void> {
    const maxPaymentLvvResult = await queryRunner.query(`
      select
        max(payment) as max_payment
        from "121-service".transaction
      where
        "programId" = 1;`);
    const maxPaymentLvv = maxPaymentLvvResult[0].max_payment;
    const maxPaymentPvResult = await queryRunner.query(`
      select
        max(payment) as max_payment
        from "121-service".transaction
      where
        "programId" = 2;`);
    const maxPaymentPv = maxPaymentPvResult[0].max_payment;
    const difference = maxPaymentLvv - maxPaymentPv;
    await queryRunner.query(`
      update
        "121-service".transaction
      set
        payment = payment + ${difference}
      where
        "programId" = 2;`);

    await queryRunner.query(`TRUNCATE "121-service"."latest_transaction"`);

    // Update latest transaction entity
    await queryRunner.query(`
      INSERT INTO "121-service"."latest_transaction" ("payment", "registrationId", "transactionId")
      SELECT t.payment, t."registrationId", t.id AS transactionId
      FROM (
          SELECT payment, "registrationId", MAX(created) AS max_created
          FROM "121-service"."transaction"
          GROUP BY payment, "registrationId"
      ) AS latest_transactions
      INNER JOIN "121-service"."transaction" AS t
          ON t.payment = latest_transactions.payment
          AND t."registrationId" = latest_transactions."registrationId"
          AND t.created = latest_transactions.max_created;`);
  }

  private async updateTemplates(queryRunner: QueryRunner): Promise<void> {
    // This is the only language that is different between LVV and PV
    // Message content does not need to be updated
    await queryRunner.query(`
        update
          "121-service".message_template
        set
          "programId" = 2
        where
          "programId" = 1 and language = 'ar';`);
  }

  private async changeProgramIdEntities(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const tables = [
      'registration',
      'transaction',
      'action',
      'whatsapp_template_test',
    ];
    for (const table of tables) {
      await queryRunner.query(`
        update
          "121-service".${table}
        set
          "programId" = 2
        where
          "programId" = 1;`);
    }
  }

  private async removeUnusedEntities(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'program_question',
      'program_custom_attribute',
      'program_aidworker_assignment', // Related program_aidworker_assignment_roles_user_role is automatically deleted
      'message_template',
      'program_fsp_configuration',
      'intersolve_voucher_instruction',
    ];
    for (const table of tables) {
      await queryRunner.query(`
        delete from
          "121-service".${table}
        where
          "programId" = 1;`);
    }
    await queryRunner.query(`
      delete from
        "121-service".program
      where
        id = 1;`);
  }

  private async updateRegistrationDataId(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const programQuestionNameIdsPV = await queryRunner.query(`
      select
        id, name
      from
        "121-service".program_question
      where
        "programId" = 2;`);
    for (const programQuestionPv of programQuestionNameIdsPV) {
      const programQuestionNameIdsLVV = await queryRunner.query(`
        select
          id
        from
          "121-service".program_question
        where
          "programId" = 1 and name = '${programQuestionPv.name}';`);
      await queryRunner.query(`
        update
          "121-service".registration_data
        set
          "programQuestionId" = ${programQuestionPv.id}
        where
          "programQuestionId" = ${programQuestionNameIdsLVV[0].id};`);
    }
    const programCustomAttributeNameIdsPV = await queryRunner.query(`
      select
        id, name
      from
        "121-service".program_custom_attribute
      where
        "programId" = 2;`);
    for (const programCustomAttribute of programCustomAttributeNameIdsPV) {
      const programCustomAttributeNameIdsLVV = await queryRunner.query(`
          select
            id
          from
            "121-service".program_custom_attribute
          where
            "programId" = 1 and name = '${programCustomAttribute.name}';`);
      await queryRunner.query(`
          update
            "121-service".registration_data
          set
            "programCustomAttributeId" = ${programCustomAttribute.id}
          where
            "programCustomAttributeId" = ${programCustomAttributeNameIdsLVV[0].id};`);
    }
  }

  private async updateRegistrationProgramId(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Get the maximum registrationProgramId from program 2
    const maxIdResult = await queryRunner.query(`
      SELECT MAX("registrationProgramId") as max_id
      FROM "121-service".registration
      WHERE "programId" = 2
    `);

    const maxId = maxIdResult[0].max_id;

    // Increment the registrationProgramId for each row in program 1
    await queryRunner.query(`
      UPDATE "121-service".registration
      SET "registrationProgramId" = "registrationProgramId" + ${maxId}
      WHERE "programId" = 1
    `);
  }

  private async mergeNameFirstLast(queryRunner: QueryRunner): Promise<void> {
    await this.mergeNameFirstLastRegData(queryRunner);
    await this.convertFirstNameToFullnameQuestion(queryRunner);
  }
  private async mergeNameFirstLastRegData(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // merge first and last name data
    const firsNameQuestionIdResult = await queryRunner.query(`
      SELECT id
      FROM "121-service".program_question
      WHERE name = 'nameFirst' and "programId" = 2

    `);
    const firstNameQuestionId = firsNameQuestionIdResult[0].id;
    const lastNameQuestionIdResult = await queryRunner.query(`
      SELECT id
      FROM "121-service".program_question
      WHERE name = 'nameLast' and "programId" = 2
    `);
    const lastNameQuestionId = lastNameQuestionIdResult[0].id;
    await queryRunner.query(`
      UPDATE "121-service".registration_data rd1
      SET value = value || ' ' || (
        SELECT value
        FROM "121-service".registration_data rd2
        WHERE "programQuestionId" = ${lastNameQuestionId}
          AND "rd2"."registrationId" = "rd1"."registrationId"
      )
      WHERE "programQuestionId" = ${firstNameQuestionId}
    `);
    // remove last name question en registration data

    await queryRunner.query(`
      DELETE FROM "121-service".registration_data
      WHERE "programQuestionId" = ${lastNameQuestionId}
    `);
    await queryRunner.query(`
    DELETE FROM "121-service".program_question
    WHERE id = ${lastNameQuestionId}
  `);
  }

  private async convertFirstNameToFullnameQuestion(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const firsNameQuestionIdResult = await queryRunner.query(`
      SELECT id
      FROM "121-service".program_question
      WHERE name = 'nameFirst' and "programId" = 2

    `);
    const firstNameQuestionId = firsNameQuestionIdResult[0].id;

    // // update first name question to full name
    // const fs = require('fs');
    const programPv = fs.readFileSync(
      'seed-data/program/program-nlrc-pv.json',
      'utf8',
    );
    const programPvJson = JSON.parse(programPv);
    const fullNameQuestion = programPvJson.programQuestions.find(
      (pq) => pq.name === 'fullName',
    );
    await queryRunner.query(`
      UPDATE "121-service".program_question
      SET name = 'fullName', label = '${JSON.stringify(
        fullNameQuestion.label,
      )}',
      "shortLabel" = '${JSON.stringify(fullNameQuestion.shortLabel)}'
      WHERE id = ${firstNameQuestionId}
    `);

    // Update program fullNameNamingConvention
    await queryRunner.query(`
      UPDATE "121-service"."program"
      SET "fullnameNamingConvention" = '${JSON.stringify(
        programPvJson.fullnameNamingConvention,
      )}'
      WHERE id = 2
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
