import { UseGuards, Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';
import { RolesGuard } from '../../roles.guard';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('payments/transactions')
@Controller('payments/transactions')
export class TransactionsController {
  public constructor() {}
}
