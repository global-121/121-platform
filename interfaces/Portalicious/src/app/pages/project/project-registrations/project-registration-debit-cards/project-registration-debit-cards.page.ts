import { CommonModule } from '@angular/common';
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
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabMenuModule } from 'primeng/tabmenu';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByVisaCardStatus } from '~/components/colored-chip/colored-chip.helper';
import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-registration-debit-cards',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    TabMenuModule,
    CommonModule,
    FormsModule,
    DataListComponent,
    ButtonModule,
    AccordionModule,
    ColoredChipComponent,
    ConfirmationDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-registration-debit-cards.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationDebitCardsPageComponent {
  private readonly registrationApiService = inject(RegistrationApiService);
  private readonly toastService = inject(ToastService);
  private readonly queryClient = injectQueryClient();

  projectId = input.required<number>();
  registrationId = input.required<number>();

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );
  referenceId = computed(() => this.registration.data()?.referenceId);
  walletWithCards = injectQuery(
    this.registrationApiService.getWalletWithCardsByReferenceId(
      this.projectId,
      this.referenceId,
    ),
  );
  currentCard = computed(() => this.walletWithCards.data()?.cards[0]);
  walletWithCurrentCardData = computed(() => {
    const { chipLabel, chipVariant } = getChipDataByVisaCardStatus(
      this.currentCard()?.status,
    );
    const listData: DataListItem[] = [
      {
        label: $localize`:@@debit-card-number:Card number`,
        value: this.currentCard()?.tokenCode,
      },
      {
        label: $localize`:@@debit-card-status:Card status`,
        chipLabel,
        chipVariant,
      },
      {
        label: $localize`:@@debit-card-balance:Current balance`,
        value: this.walletWithCards.data()?.balance,
        type: 'currency',
      },
      {
        label: $localize`:@@debit-card-spent-this-month:Spent this month (max. EUR 150)`,
        value: this.walletWithCards.data()?.spentThisMonth,
        type: 'currency',
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

    return listData.map((item) => ({
      ...item,
      loading: this.walletWithCards.isLoading(),
    }));
  });
  oldCards = computed(() => {
    const allCards = this.walletWithCards.data()?.cards ?? [];

    // remove first card and create clone of the rest
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
        detail: $localize`Card has been successfully updated`,
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
        detail: $localize`Card is replaced`,
      });
      this.invalidateWalletQuery();
    },
  }));

  private invalidateWalletQuery() {
    void this.queryClient.invalidateQueries({
      queryKey: this.registrationApiService.getWalletWithCardsByReferenceId(
        this.projectId,
        this.referenceId,
      )().queryKey,
    });
  }
}
