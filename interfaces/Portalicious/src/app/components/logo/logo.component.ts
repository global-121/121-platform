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
import { ApiEndpoints, ApiService } from '~/services/api.service';

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

  public project = injectQuery(() => ({
    queryKey: [ApiEndpoints.projects, this.projectId()],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    queryFn: () => this.apiService.getProjectById(this.projectId()!),
    enabled: !!this.projectId(),
  }));
}
