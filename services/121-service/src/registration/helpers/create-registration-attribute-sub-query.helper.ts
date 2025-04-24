import { SelectQueryBuilder } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationDataRelation } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';

// TODO: Add unit test for this helper function
export function createRegistrationAttributeSubQuery(
  subQuery: SelectQueryBuilder<any>,
  relation?: RegistrationDataRelation,
): SelectQueryBuilder<TransactionEntity> {
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
