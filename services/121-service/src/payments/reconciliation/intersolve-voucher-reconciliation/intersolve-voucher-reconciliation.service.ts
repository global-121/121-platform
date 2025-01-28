import { Inject, Injectable } from '@nestjs/common';

import { IntersolveVoucherJobName } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/job-details.dto';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class IntersolveVoucherReconciliationService {
  public constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly programRepository: ProgramRepository,
    private readonly programFspConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepository: ScopedRepository<IntersolveVoucherEntity>,
  ) {}

  public async getAndUpdateBalancesForProgram(
    programId: number,
    jobName: IntersolveVoucherJobName,
  ): Promise<void> {
    if (jobName === IntersolveVoucherJobName.getLastestVoucherBalance) {
      const maxId = (
        await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .select('MAX(voucher.id)', 'max')
          .leftJoin('voucher.image', 'image')
          .leftJoin('image.registration', 'registration')
          .andWhere('registration.programId = :programId', {
            programId,
          })
          .getRawOne()
      )?.max;

      // Run this in batches of 1,000 as it is performance-heavy
      let id = 1;
      while (id <= maxId) {
        // Query gets all vouher that need to be checked these can be:
        // 1) Vouchers  with null (which have never been checked)
        // 2) Voucher with a balance of not 0 (which could have been used more in the meantime)
        const q = await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .leftJoinAndSelect('voucher.image', 'image')
          .leftJoinAndSelect('image.registration', 'registration')
          .andWhere('voucher.lastRequestedBalance IS DISTINCT from 0')
          .andWhere(`voucher.id BETWEEN :id AND (:id + 1000 - 1)`, {
            id,
          })
          .andWhere('registration.programId = :programId', {
            programId,
          });

        const vouchersToUpdate = await q.getMany();
        const credentials =
          await this.programFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
            vouchersToUpdate[0].id,
          );
        for await (const voucher of vouchersToUpdate) {
          await this.intersolveVoucherService.getAndUpdateBalance(
            voucher,
            programId,
            credentials,
          );
        }
        id += 1000;
      }
    }
  }

  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    const programs = await this.programRepository.find();
    for (const program of programs) {
      await this.retrieveAndUpdateUnusedVouchersForProgram(program.id);
    }
  }

  public async retrieveAndUpdateUnusedVouchersForProgram(
    programId: number,
  ): Promise<void> {
    const maxId = (
      await this.intersolveVoucherScopedRepository
        .createQueryBuilder('voucher')
        .select('MAX(voucher.id)', 'max')
        .leftJoin('voucher.image', 'image')
        .leftJoin('image.registration', 'registration')
        .andWhere('registration.programId = :programId', {
          programId,
        })
        .getRawOne()
    )?.max;
    if (!maxId) {
      // No vouchers found yet
      return;
    }

    let id = 1;
    // Run this in batches of 1,000 as it is performance-heavy
    while (id <= maxId) {
      const previouslyUnusedVouchers =
        await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .leftJoinAndSelect('voucher.image', 'image')
          .leftJoinAndSelect('image.registration', 'registration')
          .andWhere('voucher.balanceUsed = false')
          .andWhere(`voucher.id BETWEEN :id AND (:id + 1000 - 1)`, {
            id,
          })
          .andWhere('registration.programId = :programId', {
            programId,
          })
          .getMany();
      const credentials =
        await this.programFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
          previouslyUnusedVouchers[0].id,
        );
      for await (const voucher of previouslyUnusedVouchers) {
        await this.intersolveVoucherService.getAndUpdateBalance(
          voucher,
          programId,
          credentials,
        );
      }
      id += 1000;
    }
  }
}
