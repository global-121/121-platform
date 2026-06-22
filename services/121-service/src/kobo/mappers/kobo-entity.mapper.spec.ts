import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboEntityMapper } from '@121-service/src/kobo/mappers/kobo-entity.mapper';

describe('KoboEntityMapper', () => {
  const createFormDefinition = (
    overrides: Partial<KoboFormDefinition> = {},
  ): KoboFormDefinition => {
    return {
      name: 'Test Form',
      survey: [],
      languages: [],
      dateDeployed: new Date('2025-01-01'),
      versionId: 'v1',
      ...overrides,
    };
  };

  describe('map entity to dto', () => {
    it('should map entity fields to dto including updated', () => {
      // Arrange
      const updatedDate = new Date('2026-01-15T12:00:00Z');
      const entity = {
        id: 1,
        created: new Date('2026-01-01T00:00:00Z'),
        updated: updatedDate,
        assetUid: 'test-asset-uid',
        versionId: 'v2.3.1',
        dateDeployed: new Date('2026-01-10T00:00:00Z'),
        url: 'https://kobo.example.com',
        programId: 42,
        name: 'Test Form',
        token: 'secret-token',
        webhookAuthUsername: 'user',
        webhookAuthPassword: 'pass',
        program: null,
      } as unknown as KoboEntity;

      // Act
      const result = KoboEntityMapper.mapEntityToDto(entity);

      // Assert
      expect(result).toEqual({
        assetUid: entity.assetUid,
        versionId: entity.versionId,
        updated: updatedDate,
        dateDeployed: entity.dateDeployed,
        url: entity.url,
        programId: entity.programId,
        name: entity.name,
      });
    });
  });

  describe('form definition to entity', () => {
    it('should map form definition and parameters to entity data', () => {
      // Arrange
      const deployDate = new Date('2025-06-15T10:30:00Z');
      const formDefinition = createFormDefinition({
        dateDeployed: deployDate,
        versionId: 'v2.3.1',
      });
      const programId = 123;
      const assetUid = 'test-asset-uid';
      const token = 'test-token';
      const url = 'https://kobo.example.com';
      const name = '25042025 Prototype Sprint';
      const webhookAuthUsername = 'test-webhook-user';
      const webhookAuthPassword = 'test-webhook-pass';

      // Act
      const result = KoboEntityMapper.formDefinitionToEntity({
        formDefinition,
        programId,
        assetUid,
        token,
        url,
        name,
        webhookAuthUsername,
        webhookAuthPassword,
      });

      // Assert
      expect(result).toEqual({
        programId,
        assetUid,
        token,
        url,
        dateDeployed: deployDate,
        versionId: formDefinition.versionId,
        name,
        webhookAuthUsername,
        webhookAuthPassword,
      });
    });
  });
});
