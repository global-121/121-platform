import { ExportVisaCardDetailsRawData } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details-raw-data.interface';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedBaseRepository } from '@121-service/src/registration/repositories/registration-scoped-base.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
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
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationScopedRepository extends RegistrationScopedBaseRepository<RegistrationEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: ScopedUserRequest,
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
      relations: relations,
    });
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
        '"intersolveVisaChildWallets"."lastUsedDate" as "lastUsedDate"',
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
}
