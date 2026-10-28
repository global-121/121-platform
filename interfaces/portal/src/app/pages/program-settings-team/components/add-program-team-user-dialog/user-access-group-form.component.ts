import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import {
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import {
  InfoTooltipComponent,
  InfoTooltipData,
} from '~/components/info-tooltip/info-tooltip.component';
import { SelectNoResultsMessageComponent } from '~/components/select-empty-message/select-no-results-message.component';
import { AccessGroupAttribute } from '~/pages/program-settings-team/components/add-program-team-user-dialog/add-program-team-user-dialog.component';
import { InfoTooltipTrackingName } from '~/services/tracking/tracking.enums';

@Component({
  selector: 'app-user-access-group-form',
  styles: ``,
  templateUrl: './user-access-group-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    FormFieldWrapperComponent,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectNoResultsMessageComponent,
    InfoTooltipComponent,
  ],
})
export class UserAccessGroupFormComponent implements OnInit {
  readonly programId = input.required<string>();
  readonly accessGroupAttributes = input.required<AccessGroupAttribute[]>();
  readonly userIsUpdatingItself = input.required<boolean>();

  private rootFormGroup = inject(FormGroupDirective);

  form!: FormGroup;

  readonly accessGroupTooltip: InfoTooltipData = {
    message: $localize`Choose which registrations this user can access, from broadest to narrowest level. “All” includes everything in the level above. For example, selecting Region A and leaving District on “All” gives access to every district in Region A.`,
    trackingName: InfoTooltipTrackingName.userSettingsAccessGroup,
  };

  ngOnInit(): void {
    this.form = this.rootFormGroup.control;
  }
}
