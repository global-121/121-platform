import { inject, isSignal, Signal } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { UnsavedChangesService } from '~/services/unsaved-changes.service';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Signal<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (
  component: ComponentCanDeactivate,
) => {
  const canDeactivateResult = component.canDeactivate();
  const canDeactivate = isSignal(canDeactivateResult)
    ? canDeactivateResult()
    : canDeactivateResult;

  if (canDeactivate) {
    return true;
  }

  const dialogService = inject(UnsavedChangesService);
  return dialogService.confirm();
};
