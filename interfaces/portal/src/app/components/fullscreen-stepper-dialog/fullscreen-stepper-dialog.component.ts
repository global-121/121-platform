import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  effect,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { Subscription } from 'rxjs';

import { FullscreenSpinnerComponent } from '~/components/fullscreen-spinner/fullscreen-spinner.component';

@Component({
  selector: 'app-fullscreen-stepper-dialog',
  imports: [
    DialogModule,
    NgTemplateOutlet,
    FullscreenSpinnerComponent,
    ButtonModule,
    NgClass,
  ],
  templateUrl: './fullscreen-stepper-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenStepperDialogComponent implements OnInit, OnDestroy {
  readonly dialogVisible = model.required<boolean>();
  readonly currentStep = input.required<number>();
  readonly proceedLabel = input.required<string>();
  readonly cannotProceed = input.required<boolean>();
  readonly queryParamStep = input.required<string>();
  readonly isPending = input(false);
  readonly proceed = output();
  readonly goBack = output();

  readonly header = contentChild<TemplateRef<unknown>>('header');
  readonly steps = contentChildren<TemplateRef<unknown>>('step');

  readonly dialogVisible$ = toObservable(this.dialogVisible);

  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  readonly dialog = viewChild.required<Dialog>('dialog');

  readonly totalSteps = computed(() => this.steps().length);

  dialogVisibilityChangesSubscription: Subscription;

  ngOnInit() {
    this.dialogVisibilityChangesSubscription = this.dialogVisible$.subscribe(
      (visible) => {
        if (visible) {
          this.dialog().maximize();
        }
      },
    );
  }

  ngOnDestroy() {
    this.dialogVisibilityChangesSubscription.unsubscribe();
  }

  /* the combination of the effect and the host listener allow us to make sure
     that the user does not navigate away from the page by using the browser "back" button
     during the payment creation process
  */
  // eslint-disable-next-line sort-class-members/sort-class-members -- disabling this eslint rule to keep the effect and the listener together in the code
  addCurrentStepToQueryParams = effect(() => {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [this.queryParamStep()]: this.currentStep() || null },
      queryParamsHandling: 'replace',
    });
  });

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    // triggered when the browser "back" button is pressed
    this.goBack.emit();
  }
}
