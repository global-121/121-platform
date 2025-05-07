import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { FocusTrapModule } from 'primeng/focustrap';

import { FormComponent } from '~/components/form/form.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-form-sidebar',
  imports: [
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
  readonly rtlHelper = inject(RtlHelperService);

  readonly visible = model<boolean>(false);
  readonly formTitle = input.required<string>();
  readonly modal = model<boolean>(true);
  readonly sideBarForm =
    viewChild.required<ElementRef<HTMLFormElement>>('sideBarForm');

  triggerElement: HTMLElement | null = null;

  rememberTrigger() {
    this.triggerElement = document.activeElement as HTMLElement;
  }
  restoreFocusToTrigger() {
    this.triggerElement?.focus();
  }

  onShow() {
    this.rememberTrigger();
    const firstInput = this.sideBarForm().nativeElement
      .elements[0] as HTMLElement;
    firstInput.focus();
  }

  onHide() {
    this.formGroup().reset();
    this.restoreFocusToTrigger();
  }
}
