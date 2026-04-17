import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

export class RegistrationRepository extends Repository<RegistrationEntity> {
  constructor(
    @InjectRepository(RegistrationEntity)
    private baseRepository: Repository<RegistrationEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async findForInstanceReporting(): Promise<RegistrationEntity[]> {
    return this.baseRepository
      .createQueryBuilder('registration')
      .select([
        'registration.id',
        'registration.registrationStatus',
        'program.id',
        'program.titlePortal',
      ])
      .innerJoin('registration.program', 'program')
      .getMany();
  }
}
