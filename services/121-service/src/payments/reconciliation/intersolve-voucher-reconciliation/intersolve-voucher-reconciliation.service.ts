import { Inject, Injectable } from '@nestjs/common';

import { IntersolveVoucherJobName } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/job-details.dto';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectRepository } from '@121-service/src/projects/repositories/project.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class IntersolveVoucherReconciliationService {
  public constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly projectRepository: ProjectRepository,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepository: ScopedRepository<IntersolveVoucherEntity>,
  ) {}

  public async getAndUpdateBalancesForProject(
    projectId: number,
    jobName: IntersolveVoucherJobName,
  ): Promise<void> {
    if (jobName === IntersolveVoucherJobName.getLastestVoucherBalance) {
      const maxId = (
        await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .select('MAX(voucher.id)', 'max')
          .leftJoin('voucher.image', 'image')
          .leftJoin('image.registration', 'registration')
          .andWhere('registration.projectId = :projectId', {
            projectId,
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
          .andWhere('registration.projectId = :projectId', {
            projectId,
          });

        const vouchersToUpdate = await q.getMany();
        if (vouchersToUpdate.length > 0) {
          const credentials =
            await this.projectFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
              vouchersToUpdate[0].id,
            );
          for await (const voucher of vouchersToUpdate) {
            await this.intersolveVoucherService.getAndUpdateBalance(
              voucher,
              projectId,
              credentials,
            );
          }
        }
        id += 1000;
      }
    }
  }

  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<number> {
    const projects = await this.projectRepository.find();
    let totalVouchersUpdated = 0;
    for (const project of projects) {
      const voucherPerProject =
        await this.retrieveAndUpdateUnusedVouchersForProject(project.id);
      totalVouchersUpdated += voucherPerProject;
    }
    return totalVouchersUpdated;
  }

  public async retrieveAndUpdateUnusedVouchersForProject(
    projectId: number,
  ): Promise<number> {
    const maxId = (
      await this.intersolveVoucherScopedRepository
        .createQueryBuilder('voucher')
        .select('MAX(voucher.id)', 'max')
        .leftJoin('voucher.image', 'image')
        .leftJoin('image.registration', 'registration')
        .andWhere('registration.projectId = :projectId', {
          projectId,
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
          .andWhere('registration.projectId = :projectId', {
            projectId,
          })
          .getMany();
      if (previouslyUnusedVouchers.length) {
        const credentials =
          await this.projectFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
            previouslyUnusedVouchers[0].id,
          );

        for await (const voucher of previouslyUnusedVouchers) {
          totalVouchersUpdated++;
          await this.intersolveVoucherService.getAndUpdateBalance(
            voucher,
            projectId,
            credentials,
          );
        }
      }
      id += 1000;
    }
    return totalVouchersUpdated;
  }
}
