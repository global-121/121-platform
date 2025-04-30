import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  HostListener,
  inject,
  input,
  model,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Dialog, DialogModule } from 'primeng/dialog';

import { RtlHelperService } from '~/services/rtl-helper.service';

const queryParamStep = 'step';

@Component({
  selector: 'app-stepper-dialog',
  imports: [DialogModule],
  templateUrl: './stepper-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperDialogComponent {
  rtlHelper = inject(RtlHelperService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  readonly currentStep = input.required<number>();
  readonly proceedLabel = input.required<Record<number, string | undefined>>();
  readonly canProceed =
    input.required<Record<number, (() => boolean) | undefined>>();

  readonly goBack = output();

  readonly steps = contentChildren<TemplateRef<unknown>>('step');
  readonly dialog = viewChild.required<Dialog>('dialog');

  readonly dialogVisible = model(false);

  readonly totalSteps = computed(() => this.steps().length);

  openDialog() {
    this.dialogVisible.set(true);
    this.dialog().maximize();
  }

  /* the combination of the effect and the host listener allow us to make sure
     that the user does not navigate away from the page by using the browser "back" button
     during the payment creation process
  */
  // eslint-disable-next-line sort-class-members/sort-class-members -- disabling this eslint rule to keep the effect and the listener together in the code
  addCurrentStepToQueryParams = effect(() => {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [queryParamStep]: this.currentStep() || null },
      queryParamsHandling: 'replace',
    });
  });

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    // triggered when the browser "back" button is pressed
    this.goBack.emit();
  }
}
