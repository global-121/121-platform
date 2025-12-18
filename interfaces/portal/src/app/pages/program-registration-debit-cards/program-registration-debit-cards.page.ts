import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { VisaCardAction } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-action.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByVisaCardStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PageLayoutRegistrationComponent } from '~/components/page-layout-registration/page-layout-registration.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import {
  FspConfigurationProperty,
  IntersolveVisaFspConfigurationProperties,
} from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { LinkCardDialogComponent } from '~/pages/program-registration-debit-cards/components/link-card-dialog/link-card-dialog.component';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-program-registration-debit-cards',
  imports: [
    CardModule,
    FormsModule,
    DataListComponent,
    ButtonModule,
    AccordionModule,
    ColoredChipComponent,
    FormDialogComponent,
    PageLayoutRegistrationComponent,
    LinkCardDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './program-registration-debit-cards.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramRegistrationDebitCardsPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  // this is injected by the router
  readonly programId = input.required<string>();
  readonly registrationId = input.required<string>();

  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly toastService = inject(ToastService);
  private readonly programApiService = inject(ProgramApiService);
  private readonly fspConfigurationApiService = inject(
    FspConfigurationApiService,
  );

  readonly tokenCode = model('');
  readonly linkCardDialogVisible = model(false);

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.programId,
      this.registrationId,
    ),
  );

  readonly referenceId = computed(() => this.registration.data()?.referenceId);

  walletWithCards = injectQuery(
    this.registrationApiService.getWalletWithCardsByReferenceId(
      this.programId,
      this.referenceId,
    ),
  );

  readonly currentCard = computed(() => this.walletWithCards.data()?.cards[0]);

  readonly currentCardHasAction = computed(
    () => (action: 'pause' | 'reissue' | 'unpause') =>
      this.currentCard()?.actions.includes(VisaCardAction[action]),
  );

  program = injectQuery(this.programApiService.getProgram(this.programId));

  fspConfigurationProperties = injectQuery(
    this.fspConfigurationApiService.getFspConfigurationProperties({
      programId: this.programId,
      configurationName: 'Intersolve-visa',
    }),
  );

  readonly cardDistributionByMailEnabled = computed(() => {
    const props = this.fspConfigurationProperties.data() ?? [];

    const cardDistributionByMailProperty = props.find(
      (property: FspConfigurationProperty) =>
        property.name ===
        (IntersolveVisaFspConfigurationProperties.cardDistributionByMail as string),
    );

    return cardDistributionByMailProperty?.value === 'true';
  });

  readonly showLinkCardOnSite = computed(() => {
    const hasAnyCard = !!this.currentCard() || this.oldCards().length > 0;

    return !this.cardDistributionByMailEnabled() && !hasAnyCard;
  });

  readonly convertCentsToMainUnits = (
    value: null | number | undefined,
  ): number => {
    if (!value) {
      return 0;
    }
    return value / 100;
  };

  readonly walletWithCurrentCardListData = computed(() => {
    const { chipLabel, chipVariant } = getChipDataByVisaCardStatus(
      this.currentCard()?.status,
    );

    const listData: DataListItem[] = [
      {
        label: $localize`:@@debit-card-number:Card number`,
        value: this.currentCard()?.tokenCode,
        type: 'text',
      },
      {
        label: $localize`:@@debit-card-status:Card status`,
        chipLabel,
        chipVariant,
      },
      {
        label: $localize`:@@debit-card-balance:Current balance`,
        value: this.convertCentsToMainUnits(
          this.walletWithCards.data()?.balance,
        ),
        type: 'currency',
        currencyCode: this.currencyCode(),
      },
      {
        label: $localize`:@@debit-card-spent-this-month:Spent this month (max. EUR 150)`,
        value: this.convertCentsToMainUnits(
          this.walletWithCards.data()?.spentThisMonth,
        ),
        type: 'currency',
        currencyCode: this.currencyCode(),
      },
      {
        label: $localize`:@@debit-card-issued-on:Issued on`,
        value: this.currentCard()?.issuedDate,
        type: 'date',
      },
      {
        label: $localize`:@@debit-card-last-used:Last used`,
        value: this.walletWithCards.data()?.lastUsedDate,
        type: 'date',
      },
    ];

    if (this.currentCard()?.explanation) {
      listData.push({
        label: $localize`:@@debit-card-explanation:Explanation`,
        value: this.currentCard()?.explanation,
        type: 'text',
      });
    }

    return listData.map((item) => ({
      ...item,
      loading: this.walletWithCards.isLoading(),
    }));
  });

  readonly oldCards = computed(() => {
    const allCards = this.walletWithCards.data()?.cards;

    if (!allCards) {
      return [];
    }

    // remove first card (current card) and create clone of the rest
    const oldCards = allCards.slice(1);

    return oldCards.map((card) => {
      const { chipVariant, chipLabel } = getChipDataByVisaCardStatus(
        card.status,
      );
      return {
        tokenCode: card.tokenCode,
        chipVariant,
        chipLabel,
        dataList: [
          {
            label: $localize`:@@debit-card-number:Card number`,
            value: card.tokenCode,
            type: 'text',
          },
          {
            label: $localize`:@@debit-card-explanation:Explanation`,
            value: card.explanation,
            type: 'text',
          },
          {
            label: $localize`:@@debit-card-issued-on:Issued on`,
            value: card.issuedDate,
            type: 'date',
          },
        ] satisfies DataListItem[],
      };
    });
  });

  changeCardPauseStatusMutation = injectMutation(() => ({
    mutationFn: ({ pauseStatus }: { pauseStatus: boolean }) => {
      const referenceId = this.referenceId();
      const tokenCode = this.currentCard()?.tokenCode;

      if (!referenceId || !tokenCode) {
        this.toastService.showGenericError();
        throw new Error('ReferenceId or tokenCode is missing');
      }

      return this.registrationApiService.changeCardPauseStatus({
        programId: this.programId,
        referenceId,
        tokenCode,
        pauseStatus,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card successfully updated`,
      });
    },
  }));

  replaceCardByMailMutation = injectMutation(() => ({
    mutationFn: () => {
      const referenceId = this.referenceId();

      if (!referenceId) {
        this.toastService.showGenericError();
        throw new Error('ReferenceId is missing');
      }

      return this.registrationApiService.replaceCardByMail({
        programId: this.programId,
        referenceId,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card successfully replaced`,
      });
    },
  }));
  readonly currencyCode = computed(() => this.program.data()?.currency);
}
