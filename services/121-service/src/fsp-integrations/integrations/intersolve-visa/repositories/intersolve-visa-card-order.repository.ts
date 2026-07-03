import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';

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
  }: {
    programId: number;
  }): Promise<VisaCardOrderEntity[]> {
    const alias = 'cardOrder';

    return await this.baseRepository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.user`, 'user')
      .andWhere(`${alias}.programId = :programId`, { programId })
      .orderBy(`${alias}.created`, 'DESC')
      .getMany();
  }

  public async updateProgress({
    orderId,
    noOfCardsOrdered,
  }: {
    orderId: number;
    noOfCardsOrdered: number;
  }): Promise<void> {
    await this.baseRepository.update(orderId, { noOfCardsOrdered });
  }

  public async updateStatus({
    orderId,
    status,
  }: {
    orderId: number;
    status: VisaCardOrderStatus;
  }): Promise<void> {
    await this.baseRepository.update(orderId, { status });
  }
}
