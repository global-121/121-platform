import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-card-editable',
  imports: [CardModule, ButtonModule],
  templateUrl: './card-editable.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditableComponent {
  readonly title = input.required<string>();
  readonly canEdit = input.required<boolean>();
  readonly isEditing = model.required<boolean>();
  readonly isSaveable = input.required<boolean>();
  readonly save = output();

  readonly rtlHelper = inject(RtlHelperService);
}
