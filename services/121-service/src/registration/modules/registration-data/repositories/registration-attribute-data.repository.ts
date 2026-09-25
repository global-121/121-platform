import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';

// Unscoped on purpose: checking whether an option value is in use must look across the whole
// program, regardless of the calling user's own assigned scope.
export class RegistrationAttributeDataRepository extends Repository<RegistrationAttributeDataEntity> {
  constructor(
    @InjectRepository(RegistrationAttributeDataEntity)
    private readonly baseRepository: Repository<RegistrationAttributeDataEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getValuesInUse({
    programRegistrationAttributeId,
    optionValues,
  }: {
    programRegistrationAttributeId: number;
    optionValues: string[];
  }): Promise<Set<string>> {
    const registrationAttributeData = await this.baseRepository.find({
      where: {
        programRegistrationAttributeId: Equal(programRegistrationAttributeId),
        value: In(optionValues),
      },
      select: { value: true },
    });

    return new Set(registrationAttributeData.map(({ value }) => value));
  }
}
