import { Paginated } from 'nestjs-paginate';

import { VisaCardOrderResponseDto } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/dto/visa-card-order-response.dto';
import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';

export type FindAllVisaCardOrdersResultDto = Omit<
  Paginated<VisaCardOrderEntity>,
  'data'
> & { data: VisaCardOrderResponseDto[] };
