/**
 * Checks if a given `value` is a valid value of a string enum.
 *
 * @template EnumObject - The type of the string enum.
 * @param enumObject - The string enum object.
 * @param value - The `value` to check.
 * @returns `true` if the `value` is a valid value of the string enum, `false` otherwise.
 */
export const isStringEnumValue = <
  EnumObject extends { [Key in keyof EnumObject]: string },
>(
  enumObject: EnumObject,
  value?: string,
): value is EnumObject[keyof EnumObject] => {
  const enumValues: unknown[] = Object.values(enumObject);

  return enumValues.some((enumValue) => enumValue === value);
};
