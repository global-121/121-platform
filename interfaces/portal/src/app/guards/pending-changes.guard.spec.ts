import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ComponentCanDeactivate,
  pendingChangesGuard,
} from '~/guards/pending-changes.guard';
import { UnsavedChangesService } from '~/services/unsaved-changes.service';

describe('pendingChangesGuard', () => {
  const routeSnapshot = {} as ActivatedRouteSnapshot;
  const stateSnapshot = {} as RouterStateSnapshot;

  let dialogServiceMock: Pick<UnsavedChangesService, 'confirm'>;

  const runGuard = async ({
    canDeactivateResult,
  }: {
    canDeactivateResult: boolean | Signal<boolean>;
  }): Promise<boolean> => {
    const component: ComponentCanDeactivate = {
      canDeactivate: () => canDeactivateResult,
    };

    const guardResult = await TestBed.runInInjectionContext(() =>
      pendingChangesGuard(
        component,
        routeSnapshot,
        stateSnapshot,
        stateSnapshot,
      ),
    );

    if (typeof guardResult !== 'boolean') {
      throw new Error('Expected pendingChangesGuard to return a boolean value');
    }

    return guardResult;
  };

  beforeEach(() => {
    dialogServiceMock = {
      confirm: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UnsavedChangesService,
          useValue: dialogServiceMock,
        },
      ],
    });
  });

  it('returns true and does not call confirm when canDeactivate returns true', async () => {
    const confirmSpy = vi
      .mocked(dialogServiceMock.confirm)
      .mockResolvedValue(false);

    const result = await runGuard({ canDeactivateResult: true });

    expect(result).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('calls confirm when canDeactivate returns false', async () => {
    const confirmSpy = vi
      .mocked(dialogServiceMock.confirm)
      .mockResolvedValue(true);

    const result = await runGuard({ canDeactivateResult: false });

    expect(result).toBe(true);
    expect(confirmSpy).toHaveBeenCalledOnce();
  });

  it('returns true and does not call confirm when canDeactivate returns signal(true)', async () => {
    const confirmSpy = vi
      .mocked(dialogServiceMock.confirm)
      .mockResolvedValue(false);

    const result = await runGuard({ canDeactivateResult: signal(true) });

    expect(result).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('calls confirm when canDeactivate returns signal(false)', async () => {
    const confirmSpy = vi
      .mocked(dialogServiceMock.confirm)
      .mockResolvedValue(false);

    const result = await runGuard({ canDeactivateResult: signal(false) });

    expect(result).toBe(false);
    expect(confirmSpy).toHaveBeenCalledOnce();
  });
});
