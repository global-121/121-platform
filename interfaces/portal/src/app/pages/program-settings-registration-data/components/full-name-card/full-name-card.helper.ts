export const getNameFieldsInConventionOrder = <T extends { name: string }>({
  textAttributes,
  fullnameNamingConvention,
}: {
  textAttributes: T[];
  fullnameNamingConvention: string[];
}): T[] => {
  const textAttributesByName = new Map(
    textAttributes.map((attribute) => [attribute.name, attribute]),
  );

  const nameFields: T[] = [];
  for (const name of fullnameNamingConvention) {
    const attribute = textAttributesByName.get(name);
    if (attribute) {
      nameFields.push(attribute);
    }
  }

  return nameFields;
};
