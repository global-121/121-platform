import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';

export type SplitPaymentListDto = Partial<Record<Fsps, PaPaymentDataDto[]>>;
