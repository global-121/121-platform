/**
 * Type guard that filters out `undefined` values.
 *
 * Useful when filtering arrays of nullable values, since the TypeScript compiler
 * does not infer the correct type when using `Boolean` as a predicate.
 *
 * @example
 * ```ts
 * const items: (string | undefined)[] = ["hello", undefined, "world"];
 * const strings = items.filter(isDefined); // string[]
 * ```
 *
 * @param value - The value to check.
 * @returns `true` if the value is not `undefined`.
 */
export const isDefined = <T>(value: T | undefined): value is T =>
  value !== undefined;
