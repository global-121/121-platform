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
import { IntersolveVisaApiService } from '~/domains/fsp-account-management/intersolve-visa.api.service';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import {
  FspConfigurationProperty,
  IntersolveVisaFspConfigurationProperties,
} from '~/domains/fsp-configuration/fsp-configuration.model';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { LinkCardDialogComponent } from '~/pages/program-registration-debit-cards/components/link-card-on-site-dialog/link-card-dialog.component';
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
  private readonly intersolveVisaApiService = inject(IntersolveVisaApiService);
  private readonly toastService = inject(ToastService);
  private readonly programApiService = inject(ProgramApiService);
  private readonly fspConfigurationApiService = inject(
    FspConfigurationApiService,
  );

  readonly linkCardDialogVisible = model(false);

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.programId,
      this.registrationId,
    ),
  );

  readonly referenceId = computed(() => this.registration.data()?.referenceId);

  walletWithCards = injectQuery(
    this.intersolveVisaApiService.getWalletWithCardsByReferenceId(
      this.programId,
      this.referenceId,
    ),
  );

  readonly currentCard = computed(() => this.walletWithCards.data()?.cards[0]);
  readonly previousTokenCodes = computed<string[]>(() => {
    if (!this.walletWithCards.isSuccess()) {
      return [];
    }

    const allTokenCodes = this.walletWithCards
      .data()
      .cards.map((card) => card.tokenCode);
    return allTokenCodes.filter(
      (tokenCode) => tokenCode !== this.currentCard()?.tokenCode,
    );
  });

  readonly currentCardHasAction = computed(
    () => (action: 'pause' | 'replace' | 'unpause') =>
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
    // TODO: this is a temporary patch until we fixed permission issues in getFspConfigurationProperties
    if (!this.fspConfigurationProperties.isSuccess()) {
      return true;
    }

    const props: FspConfigurationProperty[] =
      this.fspConfigurationProperties.data();

    const distributionByMailEnabled = props.find(
      (property) =>
        property.name ===
        (IntersolveVisaFspConfigurationProperties.cardDistributionByMail as string),
    );
    // TODO: this is a temporary patch until we fixed permission issues in getFspConfigurationProperties
    if (distributionByMailEnabled === undefined) {
      return true;
    }

    return distributionByMailEnabled.value === 'true';
  });

  readonly cardByMailDisabledAndNoCurrentCards = computed(() => {
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

      return this.intersolveVisaApiService.changeCardPauseStatus({
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

      return this.intersolveVisaApiService.replaceCardByMail({
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
