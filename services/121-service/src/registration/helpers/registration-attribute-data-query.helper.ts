import { HttpException, HttpStatus } from '@nestjs/common';
import { FindOperatorType } from 'typeorm';

import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';

export class RegistrationFilterQueryHelpers {
  static applyFilterConditionAttributes({
    queryBuilder,
    findOperatorType,
    value,
    uniqueJoinId,
    notFilter,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    findOperatorType: FindOperatorType;
    value: unknown;
    uniqueJoinId: string;
    notFilter: boolean;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    const columnName = 'value';
    let condition: string;
    let parameters: Record<string, unknown> = {};

    switch (findOperatorType) {
      case 'equal':
        condition = `${uniqueJoinId}.${columnName} = :value${uniqueJoinId}`;
        parameters = { [`value${uniqueJoinId}`]: value };
        break;
      case 'in':
        condition = `${uniqueJoinId}.${columnName} IN (:...value${uniqueJoinId})`;
        parameters = { [`value${uniqueJoinId}`]: value };
        break;
      case 'ilike':
        condition = `${uniqueJoinId}.${columnName} ILIKE :value${uniqueJoinId}`;
        parameters = { [`value${uniqueJoinId}`]: `%${value}%` };
        break;
      case 'isNull':
        condition = `${uniqueJoinId}.${columnName} IS NULL`;
        break;
      case 'moreThan':
        condition = `${uniqueJoinId}.${columnName}::numeric > :value${uniqueJoinId}`;
        parameters = { [`value${uniqueJoinId}`]: value };
        break;
      case 'lessThan':
        condition = `${uniqueJoinId}.${columnName}::numeric < :value${uniqueJoinId}`;
        parameters = { [`value${uniqueJoinId}`]: value };
        break;
      case 'between':
        condition = `${uniqueJoinId}.${columnName}::numeric BETWEEN :value${uniqueJoinId}1 AND :value${uniqueJoinId}2`;
        parameters = {
          [`value${uniqueJoinId}1`]: (value as [unknown, unknown])[0],
          [`value${uniqueJoinId}2`]: (value as [unknown, unknown])[1],
        };
        break;
      default:
        throw new HttpException(
          `Find operator type ${findOperatorType} is not supported`,
          HttpStatus.BAD_REQUEST,
        );
    }
    if (notFilter) {
      // If notFilter is true, we need to wrap the condition in a NOT clause
      condition = this.wrapNotOrThrow({
        findOperatorType,
        condition,
        uniqueJoinId,
        columnName,
      });
    }

    return queryBuilder.andWhere(condition, parameters);
  }

  private static wrapNotOrThrow({
    condition,
    uniqueJoinId,
    columnName,
    findOperatorType,
  }: {
    condition: string;
    uniqueJoinId: string;
    columnName: string;
    findOperatorType: FindOperatorType;
  }): string {
    const nullFindOperators: FindOperatorType = 'isNull';
    // Special case for $not:$null
    // We do not support this for registration attribute data filters because some registration attribute data is now stored as empty string
    // and not as null. Those would be filtered out if we would use $not:$null. Since this functionality is not used in the frontend we can throw an error here.
    if (findOperatorType === nullFindOperators) {
      throw new HttpException(
        'Using $not:$null is not supported for registration attribute data filters.',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Default for all other $not filters
    return `(NOT (${condition}) OR ${uniqueJoinId}.${columnName} IS NULL)`;
  }
}
