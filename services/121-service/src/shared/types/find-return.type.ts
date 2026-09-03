import { FindManyOptions, FindOneOptions, ObjectLiteral } from 'typeorm'; // stock typeorm types, used as-is
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations'; // stock typeorm type, used as-is
import { FindOptionsSelect } from 'typeorm/find-options/FindOptionsSelect'; // stock typeorm type, used as-is

// Strong return typing for `find*` results, derived from the `select` / `relations` options.
//
// Stock typeorm has NO equivalent of this: its `find*` methods just return `Entity`. This type is
// vendored from the upstream typeorm proposal https://github.com/typeorm/typeorm/pull/10082
// ("feat: find APIs more accurate return types"), which was closed and never merged into stock
// typeorm. It builds on these stock typeorm pieces:
//   - FindOptionsSelect / FindOptionsRelations / ObjectLiteral — imported above, used as-is.
//   - FindOptionsSelectByString / FindOptionsRelationByString (deprecated in stock) — inlined as
//     `(keyof Entity)[]` / `string[]`, their exact stock definitions; marked `[stock]` below.
//
// It looks more verbose than PR #10082 only cosmetically: the `R & keyof …` intersections satisfy our
// stricter tsconfig index-access checks, plus the inlined `[stock]` aliases and Prettier wrapping — the type logic is identical.
//
// Applied globally below via TypeScript declaration merging (see the `declare module 'typeorm'`
// block at the bottom of this file) instead of a custom Repository subclass, so EVERY
// `Repository<Entity>` in the codebase gets this narrowing automatically, with zero call-site
// changes and zero runtime footprint (purely a compile-time type, erased on build).

// Keys of a select/relations map that are actually turned on: value is `true` or a nested map.
type TruthyKeys<T> = {
  [K in keyof T]: true extends T[K] ? K : T[K] extends object ? K : never;
}[keyof T];

// Isolates just the null/undefined part of a union, dropping every non-nil member.
type ExtractNil<T> = Exclude<T, Exclude<T, undefined | null>>;

type ArrayType<I, E> = I[] | ExtractNil<E>; // [ours] cosmetic: `T[]` instead of `Array<I>`

// The resolved type of Entity key R when selected via object notation (e.g. `{ id: true }`).
// Recurses into FindReturnType when Select narrows a nested object, or an array of them.
type SelectValueAt<
  Entity extends ObjectLiteral,
  R extends keyof Entity,
  Select extends FindOptionsSelect<Entity>,
> =
  Exclude<Entity[R], undefined | null> extends (infer U)[]
    ? U extends object
      ? Select[R] extends FindOptionsSelect<U>
        ? ArrayType<FindReturnType<U, Select[R], undefined>, Entity[R]>
        : ArrayType<U, Entity[R]>
      : ArrayType<U, Entity[R]>
    : Entity[R] extends object
      ? Select[R] extends FindOptionsSelect<Entity[R]>
        ? FindReturnType<Entity[R], Select[R], undefined>
        : Entity[R]
      : Entity[R];

// Resolves the shape produced by a `select` option, covering both array and object notation.
type PickSelect<
  Entity extends ObjectLiteral,
  Select extends FindOptionsSelect<Entity> | (keyof Entity)[] | undefined, // [stock] (keyof Entity)[] is the inlined stock FindOptionsSelectByString<Entity>
> = Select extends (keyof Entity)[]
  ? {
      [
        R in Select extends (keyof Entity)[] ? Select[number] : never
      ]: Entity[R & keyof Entity]; // [ours] index-access widening (`& keyof Entity`) for our tsconfig
    }
  : {
      [
        R in Select extends (keyof Entity)[] ? never : TruthyKeys<Select>
      ]: SelectValueAt<
        Entity,
        R & keyof Entity,
        Select & FindOptionsSelect<Entity>
      >;
    };

// The resolved type of Entity key R when eagerly loaded via `relations` object notation.
// Recurses into FindReturnType when Relation narrows a nested object, or an array of them.
type RelationValueAt<
  Entity extends ObjectLiteral,
  R extends keyof Entity,
  Relation extends FindOptionsRelations<Entity>,
> =
  Exclude<Entity[R], undefined | null> extends (infer U)[]
    ? U extends object
      ? Relation[R] extends FindOptionsRelations<U>
        ? ArrayType<FindReturnType<U, undefined, Relation[R]>, Entity[R]>
        : ArrayType<U, Entity[R]>
      : ArrayType<U, Entity[R]>
    : Entity[R] extends object
      ? Relation[R] extends FindOptionsRelations<Entity[R]>
        ? FindReturnType<Entity[R], undefined, Relation[R]>
        : Entity[R]
      : Entity[R];

// Resolves the shape produced by a `relations` option's object notation (eagerly loaded relations).
type PickRelations<
  Entity extends ObjectLiteral,
  Relation extends FindOptionsRelations<Entity> | string[] | undefined, // [stock] string[] is the inlined stock FindOptionsRelationByString
> = {
  [
    R in Relation extends string[] ? never : TruthyKeys<Relation>
  ]: RelationValueAt<
    Entity,
    R & keyof Entity,
    Relation & FindOptionsRelations<Entity>
  >;
};

// Public entry point: narrows Entity down to only the fields covered by Select and/or Relation.
export type FindReturnType<
  Entity extends ObjectLiteral,
  Select extends FindOptionsSelect<Entity> | (keyof Entity)[] | undefined,
  Relation extends FindOptionsRelations<Entity> | string[] | undefined,
> = keyof Select extends never
  ? keyof Relation extends never
    ? Entity
    : Entity & PickRelations<Entity, Relation>
  : keyof Relation extends never
    ? PickSelect<Entity, Select>
    : PickSelect<Entity, Select> & PickRelations<Entity, Relation>;

// Global augmentation: re-declares typeorm's own `Repository<Entity>` interface (TypeScript merges
// a class declaration with a same-named `interface` in a `declare module` block) so every existing
// `Repository<Entity>` instance in the codebase — services, scoped repos, everything — gets this
// narrowing automatically. No subclass, no DI changes, no call-site changes required anywhere.
declare module 'typeorm' {
  interface Repository<Entity extends ObjectLiteral> {
    /* eslint-disable @typescript-eslint/method-signature-style -- property syntax can't be merged as overloads onto Repository's real class methods, only method syntax can */
    find<Options extends FindManyOptions<Entity>>(
      options?: Options,
    ): Promise<
      FindReturnType<Entity, Options['select'], Options['relations']>[]
    >;

    findAndCount<Options extends FindManyOptions<Entity>>(
      options?: Options,
    ): Promise<
      [
        FindReturnType<Entity, Options['select'], Options['relations']>[],
        number,
      ]
    >;

    findOne<Options extends FindOneOptions<Entity>>(
      options: Options,
    ): Promise<FindReturnType<
      Entity,
      Options['select'],
      Options['relations']
    > | null>;

    findOneOrFail<Options extends FindOneOptions<Entity>>(
      options: Options,
    ): Promise<FindReturnType<Entity, Options['select'], Options['relations']>>;
    /* eslint-enable @typescript-eslint/method-signature-style -- re-enable for the rest of the file */
  }
}
