import { Inject, Injectable } from '@nestjs/common';

import { IntersolveVoucherJobName } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/dto/job-details.dto';
import { IntersolveVoucherEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/entities/intersolve-voucher.entity';
import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/services/intersolve-voucher.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class IntersolveVoucherReconciliationService {
  public constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly programRepository: ProgramRepository,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepository: ScopedRepository<IntersolveVoucherEntity>,
  ) {}

  private async updateVouchersWithErrorHandling({
    vouchers,
    programId,
    credentials,
    operationContext: activityDescription,
  }: {
    vouchers: IntersolveVoucherEntity[];
    programId: number;
    credentials: any;
    operationContext: string;
  }): Promise<number> {
    let updatedCount = 0;
    const errorVoucherIds: number[] = [];
    const errorCountToThrowOn = 10;
    for (const voucher of vouchers) {
      updatedCount++;
      try {
        await this.intersolveVoucherService.getAndUpdateBalance(
          voucher,
          programId,
          credentials,
        );
      } catch (error) {
        errorVoucherIds.push(voucher.id);
        if (errorVoucherIds.length >= errorCountToThrowOn) {
          throw new Error(
            `${errorVoucherIds.length} errors occurred while updating all balances ${activityDescription} for vouchers: ${errorVoucherIds.join(', ')}. Failing job to prevent excessive API calls.`,
          );
        }
      }
    }
    return updatedCount;
  }

  public async getAndUpdateBalancesForProgram(
    programId: number,
    jobName: IntersolveVoucherJobName,
  ): Promise<void> {
    if (jobName !== IntersolveVoucherJobName.getLatestVoucherBalance) {
      return;
    }

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
      // Query gets all vouchers that need to be checked these can be:
      // 1) Vouchers with null (which have never been checked)
      // 2) Voucher with a balance of not 0 (which could have been used more in the meantime)
      const query = this.intersolveVoucherScopedRepository
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

      const vouchersToUpdate = await query.getMany();
      if (vouchersToUpdate.length > 0) {
        const credentials =
          await this.programFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
            vouchersToUpdate[0].id,
          );
        await this.updateVouchersWithErrorHandling({
          vouchers: vouchersToUpdate,
          programId,
          credentials,
          operationContext: 'via endpoint',
        });
      }
      id += 1000;
    }
  }

  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<number> {
    const programs = await this.programRepository.find();
    let totalVouchersUpdated = 0;
    for (const program of programs) {
      const voucherPerProgram =
        await this.retrieveAndUpdateUnusedVouchersForProgram(program.id);
      totalVouchersUpdated += voucherPerProgram;
    }
    return totalVouchersUpdated;
  }

  public async retrieveAndUpdateUnusedVouchersForProgram(
    programId: number,
  ): Promise<number> {
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
      return 0;
    }
    let totalVouchersUpdated = 0;

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
      if (previouslyUnusedVouchers.length) {
        const credentials =
          await this.programFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
            previouslyUnusedVouchers[0].id,
          );
        totalVouchersUpdated += await this.updateVouchersWithErrorHandling({
          vouchers: previouslyUnusedVouchers,
          programId,
          credentials,
          operationContext: 'via cronjob',
        });
      }
      id += 1000;
    }
    return totalVouchersUpdated;
  }
}
