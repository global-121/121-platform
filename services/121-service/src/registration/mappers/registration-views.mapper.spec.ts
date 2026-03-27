import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';

// TODO: Add more unit tests for this mapper class
describe('RegistrationViewsMapper', () => {
  describe('replaceDropdownValuesWithLabel', () => {
    it('should replace dropdown values with English label by default', () => {
      const colorAttrName = 'color';
      const redOption = 'red';
      const blueOption = 'blue';
      const redLabel = 'Red';
      const blueLabel = 'Blue';
      const nlRedLabel = 'Rood';
      const nlBlueLabel = 'Blauw';

      const attributes: ProgramRegistrationAttributeEntity[] = [
        {
          name: colorAttrName,
          options: [
            { option: redOption, label: { en: redLabel, nl: nlRedLabel } },
            { option: blueOption, label: { en: blueLabel, nl: nlBlueLabel } },
          ],
        } as any,
      ];
      const rows = [
        { [colorAttrName]: redOption, other: 1 },
        { [colorAttrName]: blueOption, other: 2 },
      ];

      const result = RegistrationViewsMapper.replaceDropdownValuesWithLabel({
        rows,
        attributes,
      });

      expect(result[0][colorAttrName]).toBe(redLabel);
      expect(result[1][colorAttrName]).toBe(blueLabel);
    });

    it('should replace dropdown values with requested language label', () => {
      const colorAttrName = 'color';
      const redOption = 'red';
      const blueOption = 'blue';
      const nlRedLabel = 'Rood';
      const nlBlueLabel = 'Blauw';

      const attributes: ProgramRegistrationAttributeEntity[] = [
        {
          name: colorAttrName,
          options: [
            { option: redOption, label: { en: 'Red', nl: nlRedLabel } },
            { option: blueOption, label: { en: 'Blue', nl: nlBlueLabel } },
          ],
        } as any,
      ];
      const rows = [
        { [colorAttrName]: redOption, other: 1 },
        { [colorAttrName]: blueOption, other: 2 },
      ];

      const result = RegistrationViewsMapper.replaceDropdownValuesWithLabel({
        rows,
        attributes,
        language: 'nl',
      });

      expect(result[0][colorAttrName]).toBe(nlRedLabel);
      expect(result[1][colorAttrName]).toBe(nlBlueLabel);
    });

    it('should fall back to English when requested language is not available', () => {
      const colorAttrName = 'color';
      const redOption = 'red';
      const redLabel = 'Red';

      const attributes: ProgramRegistrationAttributeEntity[] = [
        {
          name: colorAttrName,
          options: [{ option: redOption, label: { en: redLabel } }],
        } as any,
      ];
      const rows = [{ [colorAttrName]: redOption }];

      const result = RegistrationViewsMapper.replaceDropdownValuesWithLabel({
        rows,
        attributes,
        language: 'fr',
      });

      expect(result[0][colorAttrName]).toBe(redLabel);
    });

    it('should handle empty attributes array', () => {
      const fooAttrName = 'foo';
      const fooValue = 'bar';
      const rows = [{ [fooAttrName]: fooValue }];
      const result = RegistrationViewsMapper.replaceDropdownValuesWithLabel({
        rows,
        attributes: [],
      });
      expect(result).toEqual(rows);
    });

    it('should return value if no matching option or no English label', () => {
      const statusAttrName = 'status';
      const maybeOption = 'maybe';
      const noOption = 'no';
      const yesOption = 'yes';
      const nlMaybeLabel = 'Misschien';
      const noLabel = 'No';

      const attributes: ProgramRegistrationAttributeEntity[] = [
        {
          name: statusAttrName,
          options: [
            { option: maybeOption, label: { nl: nlMaybeLabel } },
            { option: noOption, label: { en: noLabel } },
          ],
        } as any,
      ];
      const rows = [
        { [statusAttrName]: maybeOption }, // no English label
        { [statusAttrName]: yesOption }, // not in options
        { [statusAttrName]: noOption }, // has English label
      ];

      const result = RegistrationViewsMapper.replaceDropdownValuesWithLabel({
        rows,
        attributes,
      });

      expect(result[0][statusAttrName]).toBe(maybeOption);
      expect(result[1][statusAttrName]).toBe(yesOption);
      expect(result[2][statusAttrName]).toBe(noLabel);
    });

    it('should use requested language even when no English label exists', () => {
      const statusAttrName = 'status';
      const maybeOption = 'maybe';
      const nlMaybeLabel = 'Misschien';

      const attributes: ProgramRegistrationAttributeEntity[] = [
        {
          name: statusAttrName,
          options: [{ option: maybeOption, label: { nl: nlMaybeLabel } }],
        } as any,
      ];
      const rows = [{ [statusAttrName]: maybeOption }];

      const result = RegistrationViewsMapper.replaceDropdownValuesWithLabel({
        rows,
        attributes,
        language: 'nl',
      });

      expect(result[0][statusAttrName]).toBe(nlMaybeLabel);
    });
  });
});
