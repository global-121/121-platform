import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-action.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByVisaCardStatus } from '~/components/colored-chip/colored-chip.helper';
import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { PageLayoutRegistrationComponent } from '~/components/page-layout-registration/page-layout-registration.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-registration-debit-cards',
  imports: [
    CardModule,
    FormsModule,
    DataListComponent,
    ButtonModule,
    AccordionModule,
    ColoredChipComponent,
    ConfirmationDialogComponent,
    PageLayoutRegistrationComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-registration-debit-cards.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationDebitCardsPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  // this is injected by the router
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly toastService = inject(ToastService);
  private readonly queryClient = inject(QueryClient);
  private readonly projectApiService = inject(ProjectApiService);

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  readonly referenceId = computed(() => this.registration.data()?.referenceId);

  walletWithCards = injectQuery(
    this.registrationApiService.getWalletWithCardsByReferenceId(
      this.projectId,
      this.referenceId,
    ),
  );

  readonly currentCard = computed(() => this.walletWithCards.data()?.cards[0]);

  readonly currentCardHasAction = computed(
    () => (action: 'pause' | 'reissue' | 'unpause') =>
      this.currentCard()?.actions.includes(VisaCardAction[action]),
  );

  project = injectQuery(this.projectApiService.getProject(this.projectId));

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
        projectId: this.projectId,
        referenceId,
        tokenCode,
        pauseStatus,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card successfully updated`,
      });
      this.invalidateWalletQuery();
    },
  }));

  reissueCardMutation = injectMutation(() => ({
    mutationFn: () => {
      const referenceId = this.referenceId();

      if (!referenceId) {
        this.toastService.showGenericError();
        throw new Error('ReferenceId is missing');
      }

      return this.registrationApiService.reissueCard({
        projectId: this.projectId,
        referenceId,
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card successfully replaced`,
      });
      this.invalidateWalletQuery();
    },
  }));

  readonly currencyCode = computed(() => this.project.data()?.currency);

  private invalidateWalletQuery() {
    void this.queryClient.invalidateQueries({
      queryKey: this.registrationApiService.getWalletWithCardsByReferenceId(
        this.projectId,
        this.referenceId,
      )().queryKey,
    });
  }
}
