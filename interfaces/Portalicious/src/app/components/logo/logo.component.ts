import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { ApiService } from '~/services/api.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink, TranslatableStringPipe],
  templateUrl: './logo.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  private apiService = inject(ApiService);

  projectId = input<number>();
  projectTitle = computed(() => this.project.data()?.titlePortal);

  public project = injectQuery(this.apiService.getProject(this.projectId));
}
