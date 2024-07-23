import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [],
  templateUrl: './form-error.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorComponent {
  visible = input.required<boolean>();
  error = input<Error | null | string>();

  visibilityClass = computed(() => {
    return this.visible() && this.error() !== null ? 'block' : 'hidden';
  });
}
