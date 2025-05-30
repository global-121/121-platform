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
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
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
    return await this.getWithRelationsByReferenceIdAndProgramId({
      referenceId,
      relations,
    });
  }

  public async getByReferenceIdAndProgramId({
    referenceId,
    programId,
  }: {
    referenceId: string;
    programId: number;
  }) {
    return await this.getWithRelationsByReferenceIdAndProgramId({
      referenceId,
      programId,
    });
  }

  public async getByReferenceId({ referenceId }: { referenceId: string }) {
    return await this.getWithRelationsByReferenceIdAndProgramId({
      referenceId,
    });
  }

  public async getWithRelationsByReferenceIdAndProgramId({
    referenceId,
    programId,
    relations = [],
  }: {
    referenceId: string;
    programId?: number;
    relations?: string[];
  }) {
    return await this.repository.findOne({
      where: {
        referenceId: Equal(referenceId),
        ...(programId != undefined ? { programId: Equal(programId) } : {}),
      },
      relations,
    });
  }

  public async getDuplicates({
    registrationId,
    programId,
  }: {
    registrationId: number;
    programId: number;
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
        `"attributeData1"."programRegistrationAttributeId" = "attributeData2"."programRegistrationAttributeId"
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
        ProgramRegistrationAttributeEntity,
        'attribute',
        '"attributeData1"."programRegistrationAttributeId" = attribute.id',
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
      .andWhere('duplicate."programId" = :programId', { programId })
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
        'duplicate.registrationProgramId as "registrationProgramId"',
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
        `"attributeData1"."programRegistrationAttributeId" = "attributeData2"."programRegistrationAttributeId"
     AND "attributeData1".value = "attributeData2".value
     AND "attributeData1"."registrationId" != "attributeData2"."registrationId"`,
      )
      .leftJoin(
        RegistrationEntity,
        'duplicate',
        `"attributeData2"."registrationId" = duplicate.id`,
      )
      .leftJoin(
        ProgramRegistrationAttributeEntity,
        'attribute',
        '"attributeData1"."programRegistrationAttributeId" = attribute.id',
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
        registrationProgramId,
        scope,
        attributeName,
      } = duplicate;

      if (!duplicatesMap[registrationId]) {
        duplicatesMap[registrationId] = {
          registrationId,
          referenceId,
          registrationProgramId,
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
    programId: number,
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
        `registration."registrationProgramId" as "paId"`,
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
      .andWhere('registration."programId" = :programId', { programId })
      .orderBy({
        'registration."registrationProgramId"': 'ASC', // Do not change this order by as it is used to determine if something is the lasest wallet
        '"intersolveVisaChildWallets"."created"': 'DESC',
      })
      .getRawMany();
    return wallets;
  }

  public async getFullNamesByRegistrationIds({
    registrationIds,
    fullNameNamingConvention,
    programId,
  }: {
    registrationIds: number[];
    fullNameNamingConvention: string[];
    programId: number;
  }): Promise<{ registrationId: number; name: string }[]> {
    if (
      !fullNameNamingConvention ||
      fullNameNamingConvention.length === 0 ||
      registrationIds.length === 0
    ) {
      return registrationIds.map((id) => ({
        registrationId: id,
        name: '',
      }));
    }

    // Create a map to store name parts by registration ID
    const namePartsMap = new Map<number, Record<string, string>>();

    // For each naming convention part, fetch the corresponding name data
    for (const attributeName of fullNameNamingConvention) {
      const nameData = await this.getAttributeValues({
        registrationIds,
        attributeName,
        programId,
      });

      // Store the name data by registration ID
      for (const item of nameData) {
        if (!namePartsMap.has(item.registrationId)) {
          namePartsMap.set(item.registrationId, {});
        }
        namePartsMap.get(item.registrationId)![attributeName] = item.value;
      }
    }

    // Combine the data for each registration ID
    return registrationIds.map((registrationId) => {
      // Get name parts for this registration
      const nameParts = namePartsMap.get(registrationId) || {};

      // Build the full name
      const name = fullNameNamingConvention
        .map((part) => nameParts[part] || '')
        .filter(Boolean)
        .join(' ');

      return {
        registrationId,
        name: name || '',
      };
    });
  }

  private async getAttributeValues({
    registrationIds,
    attributeName,
    programId,
  }: {
    registrationIds: number[];
    attributeName: string;
    programId: number;
  }): Promise<{ registrationId: number; value: string }[]> {
    const chunkSize = 30000;

    return this.getDataInChunks(registrationIds, chunkSize, async (chunk) => {
      return this.createQueryBuilder('registration')
        .select('registration.id', 'registrationId')
        .addSelect('rad.value', 'value')
        .innerJoin(
          'registration_attribute_data',
          'rad',
          'rad.registrationId = registration.id',
        )
        .innerJoin(
          'program_registration_attribute',
          'pra',
          'pra.id = rad.programRegistrationAttributeId AND pra.name = :attributeName',
          { attributeName },
        )
        .andWhere('registration.id IN (:...ids)', { ids: chunk })
        .andWhere('registration."programId" = :programId', { programId })
        .getRawMany();
    });
  }

  private async getDataInChunks<T>(
    ids: number[],
    chunkSize: number,
    queryFn: (chunk: number[]) => Promise<T[]>,
  ): Promise<T[]> {
    const results: T[] = [];

    // Process empty array case
    if (ids.length === 0) {
      return [];
    }

    // Process ids in chunks
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const chunkResults = await queryFn(chunk);
      results.push(...chunkResults);
    }

    return results;
  }
}
