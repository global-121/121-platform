import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InstanceReportingRegistrationRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-registration-raw.interface';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

// Unscoped version of registration repository
// We need to get data across programs without scope with good performance
// So the extra join that happens in the scoped version of the repository is not needed and would decrease performance
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

  public async findForInstanceReporting(): Promise<
    InstanceReportingRegistrationRaw[]
  > {
    return this.baseRepository
      .createQueryBuilder('registration')
      .select([
        'registration.id',
        'registration.referenceId',
        'registration.registrationStatus',
        'program.id',
        'program.titlePortal',
      ])
      .innerJoin('registration.program', 'program')
      .innerJoin(
        'registration.transactions',
        'transaction',
        'transaction.status = :status',
        { status: TransactionStatusEnum.success },
      )
      .orderBy('program.id', 'ASC')
      .addOrderBy('registration.created', 'ASC')
      .getMany();
  }
}
