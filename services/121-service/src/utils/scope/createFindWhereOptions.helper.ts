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
  const reversedRelationArrayToRegistration = [
    ...relationArrayToRegistration,
  ].reverse();
  for (const relation of reversedRelationArrayToRegistration) {
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

  const whereQueryScope = getWhereQueryWithScope(
    baseOptions,
    relationArrayToRegistration,
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
