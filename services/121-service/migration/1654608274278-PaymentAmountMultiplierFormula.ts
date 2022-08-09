import { RegistrationEntity } from './../src/registration/registration.entity';
import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { ProgramEntity } from '../src/programs/program.entity';

export class PaymentAmountMultiplierFormula1654608274278
  implements MigrationInterface {
  name = 'PaymentAmountMultiplierFormula1654608274278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "paymentAmountMultiplierFormula" character varying`,
    );
    await queryRunner.commitTransaction();
    // This is commented out as it was giving errors and we are not supporting Dorcas Ukraine anymore
    // await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "paymentAmountMultiplierFormula"`,
    );
  }

  private async migrateData(connection: Connection): Promise<void> {
  //   const programRepo = connection.getRepository(ProgramEntity);
  //   const programs = await programRepo
  //     .createQueryBuilder('program')
  //     .select('program.id')
  //     .addSelect('program.ngo')
  //     .getMany();
  //   for (const p of programs) {
  //     if (p.ngo === 'Dorcas Ukraine') {
  //       p.paymentAmountMultiplierFormula = '0 + 1 * nrOfHouseHoldMembers';
  //       await programRepo.save(p);
  //     }
  //   }
  //   const registrationRepo = connection.getRepository(RegistrationEntity);
  //   const registrations = await registrationRepo
  //     .createQueryBuilder('registration')
  //     .select('registration.id')
  //     .addSelect('registration.customData')
  //     .addSelect('registration.registrationStatus')
  //     .addSelect('registration.paymentAmountMultiplier')
  //     .getMany();
  //   for (const r of registrations) {
  //     if (
  //       r.customData['nrOfHouseHoldMembers'] &&
  //       !isNaN(r.customData['nrOfHouseHoldMembers']) &&
  //       ['registered', 'included', 'startedRegistration'].includes(
  //         r.registrationStatus,
  //       ) &&
  //       r.paymentAmountMultiplier == null
  //     ) {
  //       r['paymentAmountMultiplier'] = Number(
  //         r.customData['nrOfHouseHoldMembers'],
  //       );
  //       await registrationRepo.save(r);
  //     }
  //   }
  }
}
