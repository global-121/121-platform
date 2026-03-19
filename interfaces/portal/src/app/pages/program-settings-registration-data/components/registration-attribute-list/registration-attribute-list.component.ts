import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { RegistrationAttributeCardComponent } from '~/pages/program-settings-registration-data/components/registration-attribute-card/registration-attribute-card.component';

@Component({
  selector: 'app-registration-attribute-list',
  imports: [CardModule, SkeletonModule, RegistrationAttributeCardComponent],
  templateUrl: './registration-attribute-list.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationAttributeListComponent {
  readonly programId = input.required<string>();

  readonly programApiService = inject(ProgramApiService);

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );
}
