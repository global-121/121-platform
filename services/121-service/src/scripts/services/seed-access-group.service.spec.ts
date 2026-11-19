import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AccessGroupLevelEntity } from '@121-service/src/programs/access-group-levels/access-group-level.entity';
import { DebugAccessGroupHierarchy } from '@121-service/src/scripts/enum/debug-access-group-hierarchy.enum';
import { SeedAccessGroupService } from '@121-service/src/scripts/services/seed-access-group.service';

describe('SeedAccessGroupService', () => {
  let service: SeedAccessGroupService;
  let accessGroupLevelRepository: { find: jest.Mock };

  const hierarchy = DebugAccessGroupHierarchy.netherlands;
  const unknownHierarchy = 'unknown' as DebugAccessGroupHierarchy;
  const programId = 1;
  const provinceAttribute = { id: 11, name: 'province' };
  const municipalityAttribute = { id: 12, name: 'municipality' };

  const createAccessGroupLevels = ({
    attributes,
  }: {
    attributes: { id: number; name: string }[];
  }): AccessGroupLevelEntity[] =>
    attributes.map(
      (programRegistrationAttribute, level) =>
        ({
          programId,
          level,
          programRegistrationAttribute,
        }) as AccessGroupLevelEntity,
    );

  beforeEach(async () => {
    accessGroupLevelRepository = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedAccessGroupService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue(accessGroupLevelRepository),
          },
        },
      ],
    }).compile();

    service = module.get<SeedAccessGroupService>(SeedAccessGroupService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registration attribute names of a hierarchy', () => {
    it('should return the attribute names ordered from the highest level down', () => {
      // Act
      const result = service.getRegistrationAttributeNames({ hierarchy });

      // Assert
      expect(result).toEqual(['province', 'municipality']);
    });

    it('should return a copy that does not affect later calls when mutated', () => {
      // Arrange
      service.getRegistrationAttributeNames({ hierarchy }).push('mutated');

      // Act
      const result = service.getRegistrationAttributeNames({ hierarchy });

      // Assert
      expect(result).toEqual(['province', 'municipality']);
    });

    it('should throw for an unknown hierarchy', () => {
      // Act & Assert
      expect(() =>
        service.getRegistrationAttributeNames({ hierarchy: unknownHierarchy }),
      ).toThrow('Unknown debug access group hierarchy "unknown"');
    });
  });

  describe('leaf paths of a hierarchy', () => {
    it('should return only paths at the lowest level', () => {
      // Act
      const result = service.getLeafPaths({ hierarchy });

      // Assert
      expect(result).toHaveLength(20);
      expect(result).toContain('noord-holland/haarlem');
      expect(result.every((path) => path.split('/').length === 2)).toBe(true);
    });

    it('should return a copy that does not affect later calls when mutated', () => {
      // Arrange
      service.getLeafPaths({ hierarchy }).length = 0;

      // Act
      const result = service.getLeafPaths({ hierarchy });

      // Assert
      expect(result).toHaveLength(20);
    });

    it('should throw for an unknown hierarchy', () => {
      // Act & Assert
      expect(() =>
        service.getLeafPaths({ hierarchy: unknownHierarchy }),
      ).toThrow('Unknown debug access group hierarchy "unknown"');
    });
  });

  describe('all paths of a hierarchy', () => {
    it('should return every higher level path once, before the leaf paths', () => {
      // Arrange
      const leafPaths = service.getLeafPaths({ hierarchy });

      // Act
      const result = service.getPaths({ hierarchy });

      // Assert
      expect(result.slice(0, 5)).toEqual([
        'noord-holland',
        'zuid-holland',
        'utrecht',
        'gelderland',
        'noord-brabant',
      ]);
      expect(result.slice(5)).toEqual(leafPaths);
    });

    it('should throw for an unknown hierarchy', () => {
      // Act & Assert
      expect(() => service.getPaths({ hierarchy: unknownHierarchy })).toThrow(
        'Unknown debug access group hierarchy "unknown"',
      );
    });
  });

  describe('access group assignments for a path', () => {
    it('should map each path segment to the attribute of its level', () => {
      // Act
      const result = service.getAccessGroupAssignments({
        hierarchy,
        path: 'utrecht/zeist',
      });

      // Assert
      expect(result).toEqual([
        { programRegistrationAttributeName: 'province', value: 'utrecht' },
        { programRegistrationAttributeName: 'municipality', value: 'zeist' },
      ]);
    });

    it('should only assign the highest level for a higher level path', () => {
      // Act
      const result = service.getAccessGroupAssignments({
        hierarchy,
        path: 'utrecht',
      });

      // Assert
      expect(result).toEqual([
        { programRegistrationAttributeName: 'province', value: 'utrecht' },
      ]);
    });

    it('should throw when the path is deeper than the hierarchy', () => {
      // Act & Assert
      expect(() =>
        service.getAccessGroupAssignments({
          hierarchy,
          path: 'utrecht/zeist/centrum',
        }),
      ).toThrow('Unexpected access group level in "utrecht/zeist/centrum"');
    });
  });

  describe('finding a hierarchy by attribute names', () => {
    it('should return the hierarchy when the attribute names match exactly', () => {
      // Act
      const result = service.findHierarchyByAttributeNames({
        registrationAttributeNames: ['province', 'municipality'],
      });

      // Assert
      expect(result).toBe(DebugAccessGroupHierarchy.netherlands);
    });

    it.each([
      { case: 'in a different order', names: ['municipality', 'province'] },
      { case: 'a subset', names: ['province'] },
      { case: 'a superset', names: ['province', 'municipality', 'ward'] },
      { case: 'empty', names: [] },
      { case: 'joined with a comma', names: ['province,municipality'] },
    ])(
      'should return undefined when the attribute names are $case',
      ({ names }) => {
        // Act
        const result = service.findHierarchyByAttributeNames({
          registrationAttributeNames: names,
        });

        // Assert
        expect(result).toBeUndefined();
      },
    );
  });

  describe('random access group values for new registrations', () => {
    it('should assign every registration a leaf path, keyed by attribute id', async () => {
      // Arrange
      accessGroupLevelRepository.find.mockResolvedValue(
        createAccessGroupLevels({
          attributes: [provinceAttribute, municipalityAttribute],
        }),
      );
      jest.spyOn(Math, 'random').mockReturnValue(0);

      // Act
      const result =
        await service.getRandomAccessGroupValuesByRegistrationId({
          newRegistrationIds: [1, 2],
          programId,
        });

      // Assert
      const expectedValues = new Map([
        [provinceAttribute.id, 'noord-holland'],
        [municipalityAttribute.id, 'haarlem'],
      ]);
      expect(result).toEqual(
        new Map([
          [1, expectedValues],
          [2, expectedValues],
        ]),
      );
    });

    it('should spread registrations over the leaf paths based on randomness', async () => {
      // Arrange
      accessGroupLevelRepository.find.mockResolvedValue(
        createAccessGroupLevels({
          attributes: [provinceAttribute, municipalityAttribute],
        }),
      );
      jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.999);

      // Act
      const result =
        await service.getRandomAccessGroupValuesByRegistrationId({
          newRegistrationIds: [1, 2],
          programId,
        });

      // Assert
      expect(result.get(1)).toEqual(
        new Map([
          [provinceAttribute.id, 'noord-holland'],
          [municipalityAttribute.id, 'haarlem'],
        ]),
      );
      expect(result.get(2)).toEqual(
        new Map([
          [provinceAttribute.id, 'noord-brabant'],
          [municipalityAttribute.id, 's-hertogenbosch'],
        ]),
      );
    });

    it('should return an empty map when the program levels match no hierarchy', async () => {
      // Arrange
      accessGroupLevelRepository.find.mockResolvedValue(
        createAccessGroupLevels({ attributes: [provinceAttribute] }),
      );

      // Act
      const result =
        await service.getRandomAccessGroupValuesByRegistrationId({
          newRegistrationIds: [1, 2],
          programId,
        });

      // Assert
      expect(result).toEqual(new Map());
    });

    it('should return an empty map when the program has no access group levels', async () => {
      // Act
      const result =
        await service.getRandomAccessGroupValuesByRegistrationId({
          newRegistrationIds: [1, 2],
          programId,
        });

      // Assert
      expect(result).toEqual(new Map());
    });
  });
});
