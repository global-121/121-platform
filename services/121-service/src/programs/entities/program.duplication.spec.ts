import * as fs from 'node:fs';
import * as path from 'node:path';

// Guard test: every relation declared on `ProgramEntity` must be a conscious
// decision when a program is duplicated. A relation is either annotated with
// `@DuplicateRelation()` (so the generic duplication engine copies it) or listed
// below as intentionally not duplicated. When a new relation is added to
// `ProgramEntity` without being classified, this test fails.
//
// This reads the entity source as text on purpose: importing the entity would
// trigger the env validation in `src/env.ts` and fail in a unit-test context.

const relationsIntentionallyNotDuplicated = new Set<string>([
  'programRegistrationAttributes',
  'registrations',
  'payments',
  'programFspConfigurations',
  'messageTemplates',
  'attachments',
  'kobo',
]);

const expectedDuplicatedRelations = new Set<string>(['aidworkerAssignments']);

describe('Program relation duplication classification', () => {
  const entityPath = path.join(__dirname, 'program.entity.ts');
  const source = fs.readFileSync(entityPath, 'utf8');

  const relationPropertyRegex = /public\s+(\w+)\??\s*:\s*Relation</g;
  const relations: { name: string; isDuplicated: boolean }[] = [];
  let previousIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = relationPropertyRegex.exec(source)) !== null) {
    const precedingBlock = source.slice(previousIndex, match.index);
    relations.push({
      name: match[1],
      isDuplicated: precedingBlock.includes('@DuplicateRelation('),
    });
    previousIndex = match.index;
  }

  it('finds at least one relation on ProgramEntity', () => {
    expect(relations.length).toBeGreaterThan(0);
  });

  it('classifies every relation as either duplicated or intentionally not duplicated', () => {
    for (const relation of relations) {
      const isClassified =
        relation.isDuplicated ||
        relationsIntentionallyNotDuplicated.has(relation.name);
      expect({ relation: relation.name, isClassified }).toEqual({
        relation: relation.name,
        isClassified: true,
      });
    }
  });

  it('annotates exactly the expected relations with @DuplicateRelation()', () => {
    const duplicated = new Set(
      relations.filter((relation) => relation.isDuplicated).map((r) => r.name),
    );
    expect(duplicated).toEqual(expectedDuplicatedRelations);
  });
});
