import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';

export class IntersolveVisaCardOrderRepository extends Repository<VisaCardOrderEntity> {
  public constructor(
    @InjectRepository(VisaCardOrderEntity)
    private readonly baseRepository: Repository<VisaCardOrderEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async getForProgram({
    programId,
    sortBy,
    sortOrder,
  }: {
    programId: number;
    sortBy: 'noOfCardsOrdered' | 'created' | 'orderedByUsername';
    sortOrder: 'ASC' | 'DESC';
  }): Promise<VisaCardOrderEntity[]> {
    const alias = 'cardOrder';
    const sortColumn =
      sortBy === 'orderedByUsername' ? 'user.username' : `${alias}.${sortBy}`;

    const queryBuilder = this.baseRepository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.user`, 'user')
      .andWhere(`${alias}.programId = :programId`, { programId })
      .orderBy(sortColumn, sortOrder);

    if (sortColumn !== `${alias}.created`) {
      queryBuilder.addOrderBy(`${alias}.created`, 'DESC');
    }

    return await queryBuilder.getMany();
  }
}