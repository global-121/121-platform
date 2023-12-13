import { cloneDeep, merge } from 'lodash';
import { FindManyOptions, FindOneOptions, Like } from 'typeorm';

export type FindOptionsCombined<T> = FindOneOptions<T> & FindManyOptions<T>;

function getWhereQueryScope<T>(
  options: FindOptionsCombined<T>,
  whereQueryScopeRelated: Record<string, any>,
  relationArrayToRegistration: string[],
): FindOptionsCombined<T> {
  const optionsCopy = options ? cloneDeep(options) : {};
  for (const relation of [...relationArrayToRegistration.reverse()]) {
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
): FindOptionsCombined<T> {
  const whereQueryScope = { scope: Like(`${requestScope}%`) };
  return getWhereQueryScope(
    options,
    whereQueryScope,
    relationArrayToRegistration,
  );
}

function getWhereQueryWithScopeEnabled<T>(
  options: FindOptionsCombined<T>,
  relationArrayToRegistration: string[],
): FindOptionsCombined<T> {
  const whereQueryScopeEnabled = { program: { enableScope: false } };
  return getWhereQueryScope(
    options,
    whereQueryScopeEnabled,
    relationArrayToRegistration,
  );
}

export function convertToScopedOptions<T>(
  options: FindOptionsCombined<T>,
  relationArrayToRegistration: string[],
  requestScope: string,
): FindOptionsCombined<T> {
  const whereQueryScope = getWhereQueryWithScope(
    options,
    relationArrayToRegistration,
    requestScope,
  );
  const whereQueryScopeEnabled = getWhereQueryWithScopeEnabled(
    options,
    relationArrayToRegistration,
  );

  const scopedOptions = {
    ...options,
    where: [whereQueryScope, whereQueryScopeEnabled],
  };
  return scopedOptions as FindOptionsCombined<T>;
}
