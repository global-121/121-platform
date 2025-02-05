import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { FocusTrapModule } from 'primeng/focustrap';

import { FormComponent } from '~/components/form/form.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';

@Component({
  selector: 'app-form-sidebar',
  imports: [
    AutoFocusModule,
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    DrawerModule,
    FocusTrapModule,
  ],
  templateUrl: './form-sidebar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSidebarComponent<
  T extends FormGroup,
> extends FormComponent<T> {
  readonly visible = model<boolean>(false);
  readonly formTitle = input.required<string>();
  readonly modal = model<boolean>(true);

  triggerElement: HTMLElement | null = null;

  rememberTrigger() {
    this.triggerElement = document.activeElement as HTMLElement;
  }
  restoreFocusToTrigger() {
    this.triggerElement?.focus();
  }

  onShow() {
    this.rememberTrigger();
  }

  onHide() {
    this.formGroup().reset();
    this.restoreFocusToTrigger();
  }
}
