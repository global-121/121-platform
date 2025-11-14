import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-logo',
  imports: [RouterLink, TranslatableStringPipe],
  templateUrl: './logo.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  private programApiService = inject(ProgramApiService);

  readonly programId = input<string>();
  readonly programTitle = computed(() => this.program.data()?.titlePortal);

  public program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );
}
