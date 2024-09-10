import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewChild,
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

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
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
  @ViewChild('confirmationDialog')
  private confirmationDialog: ConfirmationDialogComponent;
  projectId = input.required<number>();
  registrationId = input.required<number>();
  dialogContentText: string;

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
  referenceId = computed(() => this.registration.data()?.referenceId!);
  walletWithCardsData = injectQuery(
    this.registrationApiService.getWalletWithCardsByReferenceId(
      this.projectId,
      this.referenceId,
    ),
  );
  walletWithCurrentCard = computed(() => {
    const { chipLabel, chipVariant } = getChipDataByVisaCardStatus(
      this.walletWithCardsData.data()?.cards[0].status,
    );
    const listData: DataListItem[] = [
      {
        label: $localize`:@@debit-card-number:Card number`,
        value: this.walletWithCardsData.data()?.cards[0].tokenCode,
      },
      {
        label: $localize`:@@debit-card-status:Card status`,
        chipLabel,
        chipVariant,
      },
      {
        label: $localize`:@@debit-card-balance:Current balance`,
        value: this.walletWithCardsData.data()?.balance,
        type: 'currency',
      },
      {
        label: $localize`:@@debit-card-spent-this-month:Spent this month (max. EUR 150)`,
        value: this.walletWithCardsData.data()?.spentThisMonth,
        type: 'currency',
      },
      {
        label: $localize`:@@debit-card-issued-on:Issued on`,
        value: this.walletWithCardsData.data()?.cards[0].issuedDate,
        type: 'date',
      },
      {
        label: $localize`:@@debit-card-last-used:Last used`,
        value: this.walletWithCardsData.data()?.lastUsedDate,
        type: 'date',
      },
    ];

    return listData.map((item) => ({
      ...item,
      loading: this.walletWithCardsData.isLoading(),
    }));
  });
  oldCardsData = computed(() => {
    const result: {
      tokenCode: string;
      chipVariant: ChipVariant;
      chipLabel: string;
      data: DataListItem[];
    }[] = [];
    this.walletWithCardsData.data()?.cards.forEach((card, index) => {
      // Always skip the first card because this is the current card.
      if (index === 0) return;

      const { chipVariant, chipLabel } = getChipDataByVisaCardStatus(
        card.status,
      );
      result.push({
        tokenCode: card.tokenCode,
        chipVariant,
        chipLabel,
        data: [
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
        ] as DataListItem[],
      });
    });
    return result;
  });
  pauseCardMutation = injectMutation(() => ({
    mutationFn: () =>
      this.registrationApiService.pauseCard({
        projectId: this.projectId,
        referenceId: this.referenceId(),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        tokenCode: this.walletWithCardsData.data()?.cards[0].tokenCode!,
        pause: true,
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card is paused`,
      });
      this.invalidateWalletQuery();
    },
    onError: () => {
      // TODO: Show a more specific error message.
      this.toastService.showGenericError();
    },
  }));
  unpauseCardMutation = injectMutation(() => ({
    mutationFn: () =>
      this.registrationApiService.pauseCard({
        projectId: this.projectId,
        referenceId: this.referenceId(),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        tokenCode: this.walletWithCardsData.data()?.cards[0].tokenCode!,
        pause: false,
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card is unpaused`,
      });
      this.invalidateWalletQuery();
    },
    onError: () => {
      // TODO: Show a more specific error message.
      this.toastService.showGenericError();
    },
  }));
  reissueCardMutation = injectMutation(() => ({
    mutationFn: () =>
      this.registrationApiService.reissueCard({
        projectId: this.projectId,
        referenceId: this.referenceId(),
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Card is replaced`,
      });
      this.invalidateWalletQuery();
    },
    onError: () => {
      // TODO: Show a more specific error message.
      this.toastService.showGenericError();
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

  pauseCard(tokenCode: string) {
    this.dialogContentText = $localize`You're about to pause debit card number ${tokenCode}. \n A message will be sent to the registration about this update.`;
    this.confirmationDialog.confirm({
      header: $localize`Pause card`,
      acceptLabel: $localize`Pause card`,
      accept: () => {
        this.pauseCardMutation.mutate();
      },
    });
  }

  unpauseCard(tokenCode: string) {
    this.dialogContentText = $localize`You're about to unpause debit card number ${tokenCode}. \n A message will be sent to the registration about this update.`;
    this.confirmationDialog.confirm({
      header: $localize`Unpause card`,
      acceptLabel: $localize`Unpause card`,
      accept: () => {
        this.unpauseCardMutation.mutate();
      },
    });
  }

  reissueCard(tokenCode: string) {
    this.dialogContentText = $localize`You're about to replace debit card number ${tokenCode}. This will block the current card and a new card will be issued. \n A message will be sent to the registration about this update.`;
    this.confirmationDialog.confirm({
      header: $localize`Replace card`,
      acceptLabel: $localize`Replace card`,
      accept: () => {
        this.reissueCardMutation.mutate();
      },
    });
  }
}
