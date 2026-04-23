import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { ExportVisaWalletClosure } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/export-visa-wallet-closure.interface';

import { Dto } from '~/utils/dto-type';

export type WalletWithCards = Dto<IntersolveVisaWalletDto>;
export type RefundedDebitCardsExport = Dto<ExportVisaWalletClosure>;
