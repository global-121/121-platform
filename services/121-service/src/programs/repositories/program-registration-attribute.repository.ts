import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export class ProgramRegistrationAttributeRepository extends Repository<ProgramRegistrationAttributeEntity> {
  constructor(
    @InjectRepository(ProgramRegistrationAttributeEntity)
    private repository: Repository<ProgramRegistrationAttributeEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async getDropdownAttributes({
    programId,
    select,
  }: {
    programId: number;
    select?: string[];
  }) {
    const where: Record<string, unknown> = {
      type: Equal(RegistrationAttributeTypes.dropdown),
      program: { id: Equal(programId) },
    };
    if (select && select.length > 0) {
      where['name'] = In(select);
    }
    return await this.repository.find({
      where,
    });
  }
}
