import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { v4 as uuid } from 'uuid';

import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Injectable()
export class RegistrationDataScopedQueryService {
  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
  ) {}

  public async getPaDetails(
    referenceIds: string[],
    relationOptions: RegistrationDataOptions[],
  ): Promise<any> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select([
        `registration.referenceId as "referenceId"`,
        `registration."${GenericRegistrationAttributes.phoneNumber}"`,
        `registration."${GenericRegistrationAttributes.preferredLanguage}"`,
        `coalesce(registration."${GenericRegistrationAttributes.paymentAmountMultiplier}",1) as "paymentAmountMultiplier"`,
      ])
      .andWhere(`registration.referenceId IN (:...referenceIds)`, {
        referenceIds,
      });
    for (const r of relationOptions) {
      query.select((subQuery) => {
        return this.customDataEntrySubQuery(subQuery, r.relation);
      }, r.name);
    }

    return await query.getRawMany();
  }

  public customDataEntrySubQuery(
    subQuery: SelectQueryBuilder<any>,
    relation?: RegistrationDataRelation,
  ): SelectQueryBuilder<any> {
    const uniqueSubQueryId = uuid().replace(/-/g, '').toLowerCase();
    subQuery = subQuery
      .andWhere(`"${uniqueSubQueryId}"."registrationId" = registration.id`)
      .from(RegistrationAttributeDataEntity, uniqueSubQueryId);
    if (relation?.programRegistrationAttributeId) {
      subQuery = subQuery.andWhere(
        `"${uniqueSubQueryId}"."programRegistrationAttributeId" = ${relation.programRegistrationAttributeId}`,
      );
    }

    // Because of string_agg no distinction between multi-select and other is needed
    subQuery.addSelect(
      `string_agg("${uniqueSubQueryId}".value,'|' order by value)`,
    );
    return subQuery;
  }
}
