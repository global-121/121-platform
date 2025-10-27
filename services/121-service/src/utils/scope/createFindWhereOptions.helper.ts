import { cloneDeep, merge } from 'lodash';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Like,
} from 'typeorm';

export type FindOptionsCombined<T> = FindOneOptions<T> & FindManyOptions<T>;

function getWhereQueryScope<T>(
  options: FindOptionsCombined<T>,
  whereQueryScopeRelated: Record<string, any>,
  relationArrayToRegistration: string[],
): FindOptionsWhere<T> {
  const optionsCopy = options ? cloneDeep(options) : {};
  for (const relation of [...relationArrayToRegistration]) {
    whereQueryScopeRelated = {
      [relation]: whereQueryScopeRelated,
    };
  }
  return merge(optionsCopy?.where || {}, whereQueryScopeRelated);
}

function getWhereQueryWithScope<T>(
  options: FindOptionsCombined<T>,
  relationArrayToRegistration: string[],
  requestScope: string,
): FindOptionsWhere<T> {
  const whereQueryScope = { scope: Like(`${requestScope}%`) };
  return getWhereQueryScope(
    options,
    whereQueryScope,
    relationArrayToRegistration,
  );
}

function getWhereQueryToCheckIfScopeEnabled<T>(
  options: FindOptionsCombined<T>,
  relationArrayToRegistration: string[],
): FindOptionsWhere<T> {
  const whereQueryScopeEnabled = { program: { enableScope: false } };
  return getWhereQueryScope(
    options,
    whereQueryScopeEnabled,
    relationArrayToRegistration,
  );
}

export function convertToScopedOptions<T, Options extends FindManyOptions<T>>(
  options: Options | undefined,
  relationArrayToRegistration: string[],
  requestScope: string,
): Options {
  // Create default options if undefined
  const baseOptions: FindOptionsCombined<T> = options || {};

  // For scope filtering, we reverse the relation array so nesting starts from the innermost registration outward.
  // This matches the actual path needed to reach the 'scope' property for filtering.
  // For the enableScope check, we use the original order, nesting from the entity outward to 'program',
  // since 'enableScope' is checked directly on the program relation.
  const whereQueryScope = getWhereQueryWithScope(
    baseOptions,
    [...relationArrayToRegistration.reverse()],
    requestScope,
  );
  const whereQueryScopeEnabled = getWhereQueryToCheckIfScopeEnabled(
    baseOptions,
    relationArrayToRegistration,
  );

  const scopedOptions = {
    ...baseOptions,
    where: [whereQueryScope, whereQueryScopeEnabled],
  };

  return scopedOptions as Options; // Ensure the return type matches Options
}
