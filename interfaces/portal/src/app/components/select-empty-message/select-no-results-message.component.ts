import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-select-no-results-message',
  templateUrl: './select-no-results-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectNoResultsMessageComponent {
  readonly title = input($localize`No results found`);
  readonly message = input(
    $localize`Please adjust your search or filter to find results.`,
  );
}
