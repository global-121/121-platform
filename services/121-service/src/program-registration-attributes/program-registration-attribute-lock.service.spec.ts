import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
import { ProgramRegistrationAttributeLockService } from '@121-service/src/program-registration-attributes/program-registration-attribute-lock.service';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';

jest.mock('@121-service/src/env', () => ({
  env: {
    ...jest.requireActual('@121-service/src/env').env,
    TWILIO_MODE: 'MOCK',
  },
}));

const mockEnv = env as unknown as { TWILIO_MODE: string };

describe('ProgramRegistrationAttributeLockService', () => {
  let service: ProgramRegistrationAttributeLockService;

  const programId = 1;

  const createAttributeEntity = (
    overrides: Partial<ProgramRegistrationAttributeEntity> = {},
  ): ProgramRegistrationAttributeEntity => {
    const entity = new ProgramRegistrationAttributeEntity();
    entity.id = 1;
    entity.programId = programId;
    entity.name = 'defaultAttribute';
    entity.type = RegistrationAttributeTypes.dropdown;
    entity.label = { en: 'Default Attribute' };
    entity.options = null;
    entity.scoring = {};
    entity.pattern = null;
    entity.editableInPortal = true;
    entity.includeInTransactionExport = false;
    entity.duplicateCheck = false;
    entity.placeholder = null;
    entity.isRequired = false;
    entity.showInPeopleAffectedTable = false;
    Object.assign(entity, overrides);
    return entity;
  };

  beforeEach(() => {
    service = new ProgramRegistrationAttributeLockService();
  });

  describe('Validating scope registration attribute names', () => {
    it('should return null when attributeNames is null', () => {
      // Act
      const result = service.validateScopeRegistrationAttributeNames({
        programId,
        programRegistrationAttributes: [],
        attributeNames: null,
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when attributeNames is an empty array', () => {
      // Act
      const result = service.validateScopeRegistrationAttributeNames({
        programId,
        programRegistrationAttributes: [],
        attributeNames: [],
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should return the attribute names when all are valid dropdown attributes', () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({ name: 'region' }),
        createAttributeEntity({ name: 'district' }),
      ];

      // Act
      const result = service.validateScopeRegistrationAttributeNames({
        programId,
        programRegistrationAttributes,
        attributeNames: ['region', 'district'],
      });

      // Assert
      expect(result).toEqual(['region', 'district']);
    });

    it('should throw when more than 3 attribute names are provided', async () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({ name: 'region' }),
        createAttributeEntity({ name: 'district' }),
        createAttributeEntity({ name: 'subDistrict' }),
        createAttributeEntity({ name: 'village' }),
      ];

      // Act + Assert
      await expect(
        (async () =>
          service.validateScopeRegistrationAttributeNames({
            programId,
            programRegistrationAttributes,
            attributeNames: [
              'region',
              'district',
              'subDistrict',
              'village',
            ],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an attribute does not exist on the program', async () => {
      // Act + Assert
      await expect(
        (async () =>
          service.validateScopeRegistrationAttributeNames({
            programId,
            programRegistrationAttributes: [],
            attributeNames: ['nonExistentAttribute'],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an attribute is not of type dropdown', async () => {
      // Arrange
      const programRegistrationAttributes = [
        createAttributeEntity({
          name: 'notes',
          type: RegistrationAttributeTypes.text,
        }),
      ];

      // Act + Assert
      await expect(
        (async () =>
          service.validateScopeRegistrationAttributeNames({
            programId,
            programRegistrationAttributes,
            attributeNames: ['notes'],
          }))(),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Validating whether an attribute change is allowed', () => {
    describe('Twilio lock on delete', () => {
      it('should throw when deleting the phoneNumber attribute while Twilio is enabled', async () => {
        // Arrange
        mockEnv.TWILIO_MODE = TwilioMode.mock;
        const attribute = createAttributeEntity({
          name: DefaultRegistrationDataAttributeNames.phoneNumber,
        });

        // Act + Assert
        await expect(
          (async () =>
            service.validateAttributeChangeAllowed({
              scopeRegistrationAttributeNames: null,
              existingAttribute: attribute,
              change: 'delete',
            }))(),
        ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      });

      it('should not throw when deleting the phoneNumber attribute while Twilio is disabled', () => {
        // Arrange
        mockEnv.TWILIO_MODE = TwilioMode.disabled;
        const attribute = createAttributeEntity({
          name: DefaultRegistrationDataAttributeNames.phoneNumber,
        });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: null,
            existingAttribute: attribute,
            change: 'delete',
          }),
        ).not.toThrow();
      });
    });

    describe('Scope lock on delete', () => {
      beforeEach(() => {
        mockEnv.TWILIO_MODE = TwilioMode.disabled;
      });

      it('should throw when deleting an attribute used for scope configuration', async () => {
        // Arrange
        const attribute = createAttributeEntity({ name: 'region' });

        // Act + Assert
        await expect(
          (async () =>
            service.validateAttributeChangeAllowed({
              scopeRegistrationAttributeNames: ['region'],
              existingAttribute: attribute,
              change: 'delete',
            }))(),
        ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      });

      it('should not throw when deleting an attribute that is not used for scope configuration', () => {
        // Arrange
        const attribute = createAttributeEntity({ name: 'notes' });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            change: 'delete',
          }),
        ).not.toThrow();
      });
    });

    describe('Scope lock on type change', () => {
      beforeEach(() => {
        mockEnv.TWILIO_MODE = TwilioMode.disabled;
      });

      it('should throw when changing the type of an attribute used for scope configuration', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          type: RegistrationAttributeTypes.dropdown,
        });

        // Act + Assert
        await expect(
          (async () =>
            service.validateAttributeChangeAllowed({
              scopeRegistrationAttributeNames: ['region'],
              existingAttribute: attribute,
              change: { type: RegistrationAttributeTypes.text },
            }))(),
        ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      });

      it('should not throw when the type stays dropdown for an attribute used for scope configuration', () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          type: RegistrationAttributeTypes.dropdown,
        });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            change: { type: RegistrationAttributeTypes.dropdown },
          }),
        ).not.toThrow();
      });

      it('should not throw when changing the type of an attribute that is not used for scope configuration', () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'notes',
          type: RegistrationAttributeTypes.dropdown,
        });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            change: { type: RegistrationAttributeTypes.text },
          }),
        ).not.toThrow();
      });
    });

    describe('Scope lock on options change', () => {
      beforeEach(() => {
        mockEnv.TWILIO_MODE = TwilioMode.disabled;
      });

      it('should throw when an options update removes an existing option', async () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          options: [
            { option: 'utrecht', label: { en: 'Utrecht' } },
            { option: 'zuidholland', label: { en: 'Zuid-Holland' } },
          ],
        });

        // Act + Assert
        await expect(
          (async () =>
            service.validateAttributeChangeAllowed({
              scopeRegistrationAttributeNames: ['region'],
              existingAttribute: attribute,
              change: {
                options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
              },
            }))(),
        ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      });

      it('should not throw when an options update only relabels an existing option', () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
        });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            change: {
              options: [
                { option: 'utrecht', label: { en: 'Utrecht (updated)' } },
              ],
            },
          }),
        ).not.toThrow();
      });

      it('should not throw when an options update only adds a new option', () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'region',
          options: [{ option: 'utrecht', label: { en: 'Utrecht' } }],
        });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            change: {
              options: [
                { option: 'utrecht', label: { en: 'Utrecht' } },
                { option: 'zuidholland', label: { en: 'Zuid-Holland' } },
              ],
            },
          }),
        ).not.toThrow();
      });

      it('should not throw when an options update happens on an attribute not used for scope configuration', () => {
        // Arrange
        const attribute = createAttributeEntity({
          name: 'notes',
          options: [{ option: 'a', label: { en: 'A' } }],
        });

        // Act + Assert
        expect(() =>
          service.validateAttributeChangeAllowed({
            scopeRegistrationAttributeNames: ['region'],
            existingAttribute: attribute,
            change: { options: [] },
          }),
        ).not.toThrow();
      });
    });
  });
});
