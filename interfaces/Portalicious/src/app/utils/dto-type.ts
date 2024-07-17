/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This file contains a utility to convert a DTO type from a service controller method
 * to a type that can be used in the frontend.
 *
 * It is based on: https://github.com/tamj0rd2/dto/blob/master/src/dto.ts
 *
 * For more info: https://dev.to/tamj0rd2/dto-a-typescript-utility-type-4o3m
 *
 * See the bottom of the file for custom utility types.
 */

type IsOptional<T> = Extract<T, undefined> extends never ? false : true;
export type Func = (...args: any[]) => any;
type IsFunction<T> = T extends Func ? true : false;
type IsValueType<T> = T extends
  | any[]
  | boolean
  | Date
  | Func
  | Map<any, any>
  | null
  | number
  | Set<any>
  | string
  | undefined
  ? true
  : false;

type ReplaceDate<T> = T extends Date ? string : T;
type ReplaceSet<T> = T extends Set<infer X> ? X[] : T;
type ReplaceMap<T> =
  T extends Map<infer K, infer I>
    ? Record<
        K extends number | string | symbol ? K : string,
        IsValueType<I> extends true
          ? I
          : { [K in keyof ExcludeFuncsFromObj<I>]: Dto<I[K]> }
      >
    : T;
type ReplaceArray<T> = T extends (infer X)[] ? Dto<X>[] : T;

type ExcludeFuncsFromObj<T> = Pick<
  T,
  { [K in keyof T]: IsFunction<T[K]> extends true ? never : K }[keyof T]
>;

type Dtoified<T> =
  IsValueType<T> extends true
    ? ReplaceDate<ReplaceMap<ReplaceSet<ReplaceArray<T>>>>
    : { [K in keyof ExcludeFuncsFromObj<T>]: Dto<T[K]> };

export type Dto<T> =
  IsFunction<T> extends true
    ? never
    : IsOptional<T> extends true
      ? Dtoified<Exclude<T, undefined>> | null
      : Dtoified<T>;

export type Serializable<T> = { serialize(): Dto<T> } & T;

/**
 * CUSTOM DTO UTILITY TYPES
 */

// This type is used to convert a DTO type from a service controller method,
// to a type that can be used in the frontend.
// Example:
// import { UserController } from '@121-service/src/user/user.controller';
// import { Dto121Service } from '../shared/utils/dto-type';
// export type User = Dto121Service<UserController['login']>['user'];
export type Dto121Service<
  ServiceControllerMethod extends (...args: any) => any,
> = Dto<Awaited<ReturnType<ServiceControllerMethod>>>;
