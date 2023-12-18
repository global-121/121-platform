import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { CustomAttributeType } from '../src/programs/dto/create-program-custom-attribute.dto';
import { ProgramEntity } from '../src/programs/program.entity';
import { RegistrationEntity } from '../src/registration/registration.entity';
import { ProgramCustomAttributeEntity } from './../src/programs/program-custom-attribute.entity';

export class removeMigrateNamePartnerOrg1643720490970
  implements MigrationInterface
{
  name = 'removeMigrateNamePartnerOrg1643720490970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.migrateData(queryRunner.manager);
    await queryRunner.commitTransaction();
    await queryRunner.startTransaction();
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "namePartnerOrganization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "FK_73c4bbddef1ccb565239e250b59" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "FK_73c4bbddef1ccb565239e250b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "namePartnerOrganization" character varying`,
    );
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    const programRepository = manager.getRepository(ProgramEntity);
    const registrationRepository = manager.getRepository(RegistrationEntity);
    const programCustomAttributeRepository = manager.getRepository(
      ProgramCustomAttributeEntity,
    );
    const regsWithPartnerOrg = await manager
      .getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .select('registration.*')
      .where('"namePartnerOrganization" is not null')
      .getRawMany();
    for (const r of regsWithPartnerOrg) {
      r.customData['namePartnerOrganization'] = r['namePartnerOrganization'];
      await registrationRepository.save(r);
    }

    const programs = await manager
      .getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect(
        'program.programCustomAttributes',
        'programCustomAttributes',
      )
      .select(['program.id'])
      .getMany();
    for (const program of programs) {
      // Then namePartnerOrganization is part of this programCustomAttributes
      if (regsWithPartnerOrg.length > 0) {
        const attributeReturn = await programCustomAttributeRepository.save({
          name: 'namePartnerOrganization',
          type: CustomAttributeType.text,
          label: JSON.parse(
            JSON.stringify({
              en: 'Partner Organization',
            }),
          ),
        });
        program.programCustomAttributes.push(attributeReturn);
        await programRepository.save(program);
      }
    }
  }
}
