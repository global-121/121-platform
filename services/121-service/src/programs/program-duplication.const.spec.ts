import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  programRelationsNotToDuplicate,
  programRelationsToDuplicate,
} from '@121-service/src/programs/program-duplication.const';

// We read the relation property names directly from the entity source instead
// of importing `ProgramEntity`. Importing the entity would pull in the whole
// app/env chain (env validation), which is intentionally avoided in unit tests.
// All relations on `ProgramEntity` are typed as `Relation<...>`, so we can
// reliably extract their property names from the declaration.
function getDeclaredProgramRelationNames(): string[] {
  const entityPath = path.join(__dirname, 'entities', 'program.entity.ts');
  const source = fs.readFileSync(entityPath, 'utf8');
  const relationPropertyRegex = /public\s+(\w+)\??\s*:\s*Relation</g;

  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = relationPropertyRegex.exec(source)) !== null) {
    names.push(match[1]);
  }
  return names;
}

describe('Program relation duplication classification', () => {
  it('classifies every relation declared on ProgramEntity', () => {
    const classified = new Set<string>([
      ...programRelationsToDuplicate,
      ...programRelationsNotToDuplicate,
    ]);

    const unclassified = getDeclaredProgramRelationNames().filter(
      (relation) => !classified.has(relation),
    );

    // If this fails, a new relation was added to ProgramEntity. Decide whether
    // it should be copied on duplication and add it to the matching list in
    // program-duplication.const.ts (and to ProgramService.duplicateProgram if
    // it should be copied).
    expect(unclassified).toEqual([]);
  });

  it('only classifies relations that actually exist on ProgramEntity', () => {
    const declaredRelations = new Set(getDeclaredProgramRelationNames());

    const nonExistent = [
      ...programRelationsToDuplicate,
      ...programRelationsNotToDuplicate,
    ].filter((relation) => !declaredRelations.has(relation));

    expect(nonExistent).toEqual([]);
  });

  it('classifies each relation exactly once', () => {
    const notToDuplicate = new Set<string>(programRelationsNotToDuplicate);

    const classifiedTwice = programRelationsToDuplicate.filter((relation) =>
      notToDuplicate.has(relation),
    );

    expect(classifiedTwice).toEqual([]);
  });
});
