import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { UnsavedChangesService } from '~/services/unsaved-changes.service';

describe('UnsavedChangesService', () => {
  let service: UnsavedChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnsavedChangesService);
  });

  it('returns the same pending confirmation promise for re-entrant confirm calls', () => {
    const firstConfirmation = service.confirm();
    const secondConfirmation = service.confirm();

    expect(secondConfirmation).toBe(firstConfirmation);
  });

  it('resolves pending confirmation and creates a new promise for the next confirm call', async () => {
    const firstConfirmation = service.confirm();
    service.resolve(true);

    await expect(firstConfirmation).resolves.toBe(true);

    const secondConfirmation = service.confirm();

    expect(secondConfirmation).not.toBe(firstConfirmation);

    service.resolve(false);
    await expect(secondConfirmation).resolves.toBe(false);
  });

  it('does not throw when resolve is called without a pending confirmation', () => {
    expect(() => {
      service.resolve(false);
    }).not.toThrow();
  });
});
