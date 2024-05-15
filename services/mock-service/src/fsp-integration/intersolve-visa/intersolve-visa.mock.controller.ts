import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
//import { IntersolveCreateCustomerDto } from '../../../../121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer.dto';
import { IntersolveVisaMockService } from './intersolve-visa.mock.service';

@ApiTags('fsp/intersolve-visa')
@Controller('fsp/intersolve-visa')
export class IntersolveVisaMockController {
  public constructor(
    private readonly intersolveVisaMockService: IntersolveVisaMockService,
  ) {}

  @ApiOperation({ summary: 'Create customer' })
  @Post('transfer')
  public createCustomer(@Body() _dto: any): object {
    return this.intersolveVisaMockService.createCustomer();
  }

  @ApiOperation({ summary: 'Transfer' })
  @Post('transfer')
  public transfer(@Body() transferDto: any): any {
    console.log(
      '🚀 ~ IntersolveVisaMockController ~ transfer ~ transferDto:',
      transferDto,
    );
    // return this.intersolveVisaMockService.transfer(transferDto);
  }
}
