import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  DataSource,
  DeleteResult,
  Equal,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
  RemoveOptions,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { ExportVisaCardDetailsRawData } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details-raw-data.interface';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { GetDuplicatesResult } from '@121-service/src/registration/interfaces/get-duplicates-result.interface';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationScopedBaseRepository } from '@121-service/src/registration/repositories/registration-scoped-base.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationScopedRepository extends RegistrationScopedBaseRepository<RegistrationEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public override request: ScopedUserRequest,
  ) {
    super(RegistrationEntity, dataSource);
  }

  ///////////////////////////////////////////////////////////////
  // COPIED IMPLEMENTATION OF REPOSITORY METHODS ////////////////
  //////////////////////////////////////////////////////////////
  public async save(
    entity: RegistrationEntity,
    options: SaveOptions & { reload: false },
  ): Promise<RegistrationEntity>;
  public async save(
    entity: RegistrationEntity,
    options?: SaveOptions,
  ): Promise<RegistrationEntity>;
  public async save(
    entities: RegistrationEntity[],
    options: SaveOptions & { reload: false },
  ): Promise<RegistrationEntity[]>;
  public async save(
    entities: RegistrationEntity[],
    options?: SaveOptions,
  ): Promise<RegistrationEntity[]>;
  public async save(
    entityOrEntities: RegistrationEntity | RegistrationEntity[],
    options?: SaveOptions,
  ): Promise<RegistrationEntity | RegistrationEntity[]> {
    return this.repository.save(entityOrEntities as any, options);
  }

  public async insert(
    entityOrEntities:
      | QueryDeepPartialEntity<RegistrationEntity>
      | QueryDeepPartialEntity<RegistrationEntity>[],
  ): Promise<InsertResult> {
    return this.repository.insert(entityOrEntities as any);
  }

  public async remove(
    entity: RegistrationEntity,
    options?: RemoveOptions,
  ): Promise<RegistrationEntity>;
  public async remove(
    entities: RegistrationEntity[],
    options?: RemoveOptions,
  ): Promise<RegistrationEntity[]>;
  public async remove(
    entityOrEntities: RegistrationEntity | RegistrationEntity[],
    options?: RemoveOptions,
  ): Promise<RegistrationEntity | RegistrationEntity[]> {
    return this.repository.remove(entityOrEntities as any, options);
  }

  public async deleteUnscoped(
    criteria:
      | FindOptionsWhere<RegistrationEntity>
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[],
  ): Promise<DeleteResult> {
    // TODO: This is not scoped yet, for now is doesn't matter as
    // we don't use update anywhere yet in a way where it should be scoped
    // This is as risk though that someone uses this expecting it to be scoped
    return this.repository.delete(criteria);
  }

  public async updateUnscoped(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<RegistrationEntity>,
    partialEntity: QueryDeepPartialEntity<RegistrationEntity>,
  ): Promise<UpdateResult> {
    // TODO: This is not scoped yet, for now is doesn't matter as
    // we don't use update anywhere yet in a way where it should be scoped
    // This is as risk though that someone uses this expecting it to be scoped
    return this.repository.update(criteria, partialEntity);
  }

  public async getWithRelationsByReferenceId({
    referenceId,
    relations = [],
  }: {
    referenceId: string;
    relations: string[];
  }) {
    return await this.getWithRelationsByReferenceIdAndProjectId({
      referenceId,
      relations,
    });
  }

  public async getByReferenceIdAndProjectId({
    referenceId,
    projectId,
  }: {
    referenceId: string;
    projectId: number;
  }) {
    return await this.getWithRelationsByReferenceIdAndProjectId({
      referenceId,
      projectId,
    });
  }

  public async getByReferenceId({ referenceId }: { referenceId: string }) {
    return await this.getWithRelationsByReferenceIdAndProjectId({
      referenceId,
    });
  }

  public async getWithRelationsByReferenceIdAndProjectId({
    referenceId,
    projectId,
    relations = [],
  }: {
    referenceId: string;
    projectId?: number;
    relations?: string[];
  }) {
    return await this.repository.findOne({
      where: {
        referenceId: Equal(referenceId),
        ...(projectId != undefined ? { projectId: Equal(projectId) } : {}),
      },
      relations,
    });
  }

  public async getDuplicates({
    registrationId,
    projectId,
  }: {
    registrationId: number;
    projectId: number;
  }): Promise<GetDuplicatesResult[]> {
    // Added a limit to the number of duplicates to prevent a large amount of duplicates from being returned which could cause performance issues
    // If there are more than this amount of duplicates a user misconfiguration is likely
    const maxDuplicates = 9;

    // First, get the distinct duplicate registration IDs with a limit
    const uniqueRegistrationIds = await this.createQueryBuilder('registration')
      .select('DISTINCT duplicate.id', 'registrationId')
      .leftJoin(
        RegistrationAttributeDataEntity,
        'attributeData1',
        '"attributeData1"."registrationId" = registration.id',
      )
      .innerJoin(
        RegistrationAttributeDataEntity,
        'attributeData2',
        `"attributeData1"."projectRegistrationAttributeId" = "attributeData2"."projectRegistrationAttributeId"
     AND "attributeData1".value = "attributeData2".value
     AND "attributeData1"."registrationId" != "attributeData2"."registrationId"`,
      )
      .leftJoin(
        RegistrationEntity,
        'duplicate',
        `"attributeData2"."registrationId" = duplicate.id AND duplicate."registrationStatus" != :declinedStatusDuplicate`,
        {
          declinedStatusDuplicate: RegistrationStatusEnum.declined,
        },
      )
      .leftJoin(
        ProjectRegistrationAttributeEntity,
        'attribute',
        '"attributeData1"."projectRegistrationAttributeId" = attribute.id',
      )
      .andWhere('"attributeData1"."registrationId" = :registrationId', {
        registrationId,
      })
      .andWhere(
        'registration."registrationStatus" != :declinedStatusRegistration',
        {
          declinedStatusRegistration: RegistrationStatusEnum.declined,
        },
      )
      .andWhere('attribute."duplicateCheck" = true')
      .andWhere('duplicate."projectId" = :projectId', { projectId })
      .andWhere(`"attributeData1"."value" != ''`)
      .andWhere(
        'NOT EXISTS (' +
          'SELECT 1 ' +
          'FROM "121-service".unique_registration_pair rup ' +
          'WHERE rup."smallerRegistrationId" = LEAST("attributeData1"."registrationId", "attributeData2"."registrationId") ' +
          'AND rup."largerRegistrationId" = GREATEST("attributeData1"."registrationId", "attributeData2"."registrationId")' +
          ')',
      )
      .orderBy('duplicate."id"', 'ASC')
      .limit(maxDuplicates)
      .getRawMany();

    if (uniqueRegistrationIds.length === 0) {
      return [];
    }

    // Then, get all attributes for those specific registration IDs
    const duplicateIds = uniqueRegistrationIds.map(
      (item) => item.registrationId,
    );

    const rawDuplicates = await this.createQueryBuilder('registration')
      .select([
        'duplicate.id as "registrationId"',
        'duplicate.registrationProjectId as "registrationProjectId"',
        'duplicate.referenceId as "referenceId"',
        'duplicate.scope as "scope"',
        'attribute.name as "attributeName"',
      ])
      .leftJoin(
        RegistrationAttributeDataEntity,
        'attributeData1',
        '"attributeData1"."registrationId" = registration.id',
      )
      .innerJoin(
        RegistrationAttributeDataEntity,
        'attributeData2',
        `"attributeData1"."projectRegistrationAttributeId" = "attributeData2"."projectRegistrationAttributeId"
     AND "attributeData1".value = "attributeData2".value
     AND "attributeData1"."registrationId" != "attributeData2"."registrationId"`,
      )
      .leftJoin(
        RegistrationEntity,
        'duplicate',
        `"attributeData2"."registrationId" = duplicate.id`,
      )
      .leftJoin(
        ProjectRegistrationAttributeEntity,
        'attribute',
        '"attributeData1"."projectRegistrationAttributeId" = attribute.id',
      )
      .andWhere('"attributeData1"."registrationId" = :registrationId', {
        registrationId,
      })
      .andWhere('duplicate.id IN (:...duplicateIds)', { duplicateIds })
      .andWhere('attribute."duplicateCheck" = true')
      .getRawMany();

    // Group the found duplicate pairs of attribute name and value by registrationId
    const duplicatesMap: Record<number, GetDuplicatesResult> = {};

    for (const duplicate of rawDuplicates) {
      const {
        registrationId,
        referenceId,
        registrationProjectId,
        scope,
        attributeName,
      } = duplicate;

      if (!duplicatesMap[registrationId]) {
        duplicatesMap[registrationId] = {
          registrationId,
          referenceId,
          registrationProjectId,
          scope,
          attributeNames: [],
        };
      }
      duplicatesMap[registrationId].attributeNames.push(attributeName);
    }

    return Object.values(duplicatesMap);
  }

  // This is put in the registration repository as this function queries both registration an intersolve visa entities
  // The intersolve visa entity should not manage the registration entity
  public async getDebitCardsDetailsForExport(
    projectId: number,
  ): Promise<ExportVisaCardDetailsRawData[]> {
    const wallets = await this.repository
      .createQueryBuilder('registration')
      .leftJoin('registration.intersolveVisaCustomer', 'customer')
      .leftJoin(
        'customer.intersolveVisaParentWallet',
        'intersolveVisaParentWallet',
      )
      .leftJoin(
        'intersolveVisaParentWallet.intersolveVisaChildWallets',
        'intersolveVisaChildWallets',
      )
      .select([
        `registration."referenceId" as "referenceId"`,
        `registration."registrationProjectId" as "paId"`,
        `registration."registrationStatus" as "registrationStatus"`,
        '"intersolveVisaChildWallets"."tokenCode" as "cardNumber"',
        '"intersolveVisaChildWallets".created as "issuedDate"',
        '"intersolveVisaParentWallet"."lastUsedDate" as "lastUsedDate"',
        '"intersolveVisaParentWallet".balance as balance',
        '"intersolveVisaChildWallets"."lastExternalUpdate" as "lastExternalUpdate"',
        '"intersolveVisaParentWallet"."spentThisMonth" as "spentThisMonth"',
        '"intersolveVisaChildWallets"."cardStatus" as "cardStatus"',
        '"intersolveVisaChildWallets"."walletStatus" as "walletStatus"',
        '"intersolveVisaChildWallets"."isTokenBlocked" as "isTokenBlocked"',
      ])
      .andWhere(`"intersolveVisaChildWallets".id IS NOT NULL`)
      .andWhere('registration."projectId" = :projectId', { projectId })
      .orderBy({
        'registration."registrationProjectId"': 'ASC', // Do not change this order by as it is used to determine if something is the lasest wallet
        '"intersolveVisaChildWallets"."created"': 'DESC',
      })
      .getRawMany();
    return wallets;
  }
}
