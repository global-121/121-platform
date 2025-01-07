import { CanDeactivateFn } from '@angular/router';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (
  component: ComponentCanDeactivate,
) => {
  // if there are no pending changes, just allow deactivation; else confirm first
  return component.canDeactivate()
    ? true
    : // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
      // when navigating away from your angular app, the browser will show a generic warning message
      // see http://stackoverflow.com/a/42207299/7307355
      confirm(
        $localize`Changes that you made may not be saved. Are you sure you wish to proceed?`,
      );
};
