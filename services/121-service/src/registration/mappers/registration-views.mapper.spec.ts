import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';

// TODO: Add more unit tests for this mapper class
describe('RegistrationViewsMapper', () => {
  describe('replaceDropdownValuesWithEnglishLabel', () => {
    it('should replace dropdown values with English label', () => {
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

      const result =
        RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
          rows,
          attributes,
        });

      expect(result[0][colorAttrName]).toBe(redLabel);
      expect(result[1][colorAttrName]).toBe(blueLabel);
    });

    it('should handle empty attributes array', () => {
      const fooAttrName = 'foo';
      const fooValue = 'bar';
      const rows = [{ [fooAttrName]: fooValue }];
      const result =
        RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
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

      const result =
        RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
          rows,
          attributes,
        });

      expect(result[0][statusAttrName]).toBe(maybeOption);
      expect(result[1][statusAttrName]).toBe(yesOption);
      expect(result[2][statusAttrName]).toBe(noLabel);
    });
  });
});
