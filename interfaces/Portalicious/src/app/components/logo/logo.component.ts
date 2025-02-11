import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-logo',
  imports: [RouterLink, TranslatableStringPipe],
  templateUrl: './logo.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  private projectApiService = inject(ProjectApiService);

  readonly projectId = input<string>();
  readonly projectTitle = computed(() => this.project.data()?.titlePortal);

  public project = injectQuery(
    this.projectApiService.getProject(this.projectId),
  );
}
