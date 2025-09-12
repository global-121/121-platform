import { HttpException } from '@nestjs/common';
import { FindOperatorType } from 'typeorm';

import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationViewRepositoryHelper } from '@121-service/src/registration/repositories/helpers/registration-view.repository.helper';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';

describe('RegistrationViewRepositoryHelper', () => {
  let andWhereMock: jest.Mock;
  let queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;

  beforeEach(() => {
    andWhereMock = jest.fn().mockReturnThis();
    queryBuilder = {
      andWhere: andWhereMock,
    } as unknown as ScopedQueryBuilder<RegistrationViewEntity>;
  });

  it('should handle "equal" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'equal',
      value: 'foo',
      uniqueJoinId: 'abc',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith('abc.value = :valueabc', {
      valueabc: 'foo',
    });
  });

  it('should handle "in" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'in',
      value: [1, 2, 3],
      uniqueJoinId: 'xyz',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith('xyz.value IN (:...valuexyz)', {
      valuexyz: [1, 2, 3],
    });
  });

  it('should handle "ilike" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'ilike',
      value: 'bar',
      uniqueJoinId: 'def',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith('def.value ILIKE :valuedef', {
      valuedef: '%bar%',
    });
  });

  it('should handle "isNull" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'isNull',
      value: null,
      uniqueJoinId: 'ghi',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith('ghi.value IS NULL', {});
  });

  it('should handle "moreThan" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'moreThan',
      value: 10,
      uniqueJoinId: 'jkl',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith(
      'jkl.value::numeric > :valuejkl',
      { valuejkl: 10 },
    );
  });

  it('should handle "lessThan" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'lessThan',
      value: 5,
      uniqueJoinId: 'mno',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith(
      'mno.value::numeric < :valuemno',
      { valuemno: 5 },
    );
  });

  it('should handle "between" operator', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'between',
      value: [1, 2],
      uniqueJoinId: 'pqr',
      notFilter: false,
    });

    expect(andWhereMock).toHaveBeenCalledWith(
      'pqr.value::numeric BETWEEN :valuepqr1 AND :valuepqr2',
      { valuepqr1: 1, valuepqr2: 2 },
    );
  });

  it('should throw for unsupported operator', () => {
    expect(() =>
      RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
        queryBuilder,
        findOperatorType: 'unsupported' as FindOperatorType,
        value: 'foo',
        uniqueJoinId: 'stu',
        notFilter: false,
      }),
    ).toThrow(HttpException);
  });

  it('should wrap condition with NOT for notFilter', () => {
    RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
      queryBuilder,
      findOperatorType: 'equal',
      value: 'foo',
      uniqueJoinId: 'abc',
      notFilter: true,
    });

    expect(andWhereMock).toHaveBeenCalledWith(
      '(NOT (abc.value = :valueabc) OR abc.value IS NULL)',
      { valueabc: 'foo' },
    );
  });

  it('should throw for $not:$null', () => {
    expect(() =>
      RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
        queryBuilder,
        findOperatorType: 'isNull',
        value: null,
        uniqueJoinId: 'zzz',
        notFilter: true,
      }),
    ).toThrow(HttpException);
  });
});
