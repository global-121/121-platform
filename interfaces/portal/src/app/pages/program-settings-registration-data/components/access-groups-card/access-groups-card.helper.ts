import { MAX_ACCESS_GROUP_LEVELS } from '@121-service/src/programs/access-group-levels/const/max-access-group-levels.const';

export const getAvailableAccessGroupAttributesByLevel = <
  TAttribute extends { name: string },
>({
  attributes,
  selectedAttributeNames,
}: {
  attributes: TAttribute[];
  selectedAttributeNames: (null | string)[];
}): TAttribute[][] =>
  selectedAttributeNames.map((_, levelIndex) => {
    const selectedNames = new Set(
      selectedAttributeNames.filter(
        (name, selectedIndex) => selectedIndex !== levelIndex && name !== null,
      ),
    );

    return attributes.filter((attribute) => !selectedNames.has(attribute.name));
  });

export const canAddAccessGroupLevel = ({
  levelCount,
}: {
  levelCount: number;
}): boolean => levelCount < MAX_ACCESS_GROUP_LEVELS;

export const getAccessGroupAttributeNamesForSave = ({
  selectedAttributeNames,
}: {
  selectedAttributeNames: (null | string)[];
}): string[] =>
  selectedAttributeNames.filter(
    (attributeName): attributeName is string => attributeName !== null,
  );
