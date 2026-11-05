import { CreateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

// Dropdown attributes used as access group levels, from the broadest level down
export const accessGroupLevelAttributes: CreateProgramRegistrationAttributeDto[] =
  [
    {
      options: [
        { option: 'amsterdam', label: { en: 'Amsterdam' } },
        { option: 'utrecht', label: { en: 'Utrecht' } },
        { option: 'rotterdam', label: { en: 'Rotterdam' } },
        { option: 'denhaag', label: { en: 'Den Haag' } },
        { option: 'haarlem', label: { en: 'Haarlem' } },
        { option: 'groningnen', label: { en: 'Groningnen' } },
      ],
      showInPeopleAffectedTable: true,
      editableInPortal: true,
      includeInTransactionExport: true,
      duplicateCheck: false,
      name: 'city',
      label: {
        en: 'City',
      },
      type: RegistrationAttributeTypes.dropdown,
      isRequired: false,
    },
    {
      options: [
        { option: 'west', label: { en: 'West' } },
        { option: 'oost', label: { en: 'Oost' } },
        { option: 'noord', label: { en: 'Noord' } },
        { option: 'zuid', label: { en: 'Zuid' } },
      ],
      showInPeopleAffectedTable: true,
      editableInPortal: true,
      includeInTransactionExport: true,
      duplicateCheck: false,
      name: 'neighborhood',
      label: {
        en: 'Neighborhood',
      },
      type: RegistrationAttributeTypes.dropdown,
      isRequired: false,
    },
    {
      options: [
        { option: 'damrak', label: { en: 'Damrak' } },
        { option: 'haarlemmerstraat', label: { en: 'Haarlemmerstraat' } },
        { option: 'postjesweg', label: { en: 'Postjesweg' } },
      ],
      showInPeopleAffectedTable: true,
      editableInPortal: true,
      includeInTransactionExport: true,
      duplicateCheck: false,
      name: 'street',
      label: {
        en: 'Street',
      },
      type: RegistrationAttributeTypes.dropdown,
      isRequired: false,
    },
  ];

export const accessGroupLevelAttributeNames = accessGroupLevelAttributes.map(
  ({ name }) => name,
);
