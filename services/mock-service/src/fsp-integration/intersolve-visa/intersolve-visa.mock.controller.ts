import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntersolveCreateCustomerDto } from '../../../../121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer.dto';
import { IntersolveCreateWalletResponseDto } from '../../../../121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveCreateWalletDto } from '../../../../121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet.dto';
import { IntersolveVisaMockService } from './intersolve-visa.mock.service';

@ApiTags('fsp/intersolve-visa')
@Controller('fsp/intersolve-visa/v1')
export class IntersolveVisaMockController {
  public constructor(
    private readonly intersolveVisaMockService: IntersolveVisaMockService,
  ) {}

  @ApiOperation({ summary: 'Create customer' })
  @Post('customers/create-individual')
  public createCustomer(@Body() dto: IntersolveCreateCustomerDto): object {
    return this.intersolveVisaMockService.createCustomerMock(dto);
  }

  @ApiOperation({ summary: 'Create wallet' })
  @Post('brand-types/:brandType/issue-token') // Did not add includeBalances here as query param as we always use it with true
  public createWallet(
    @Body() payload: IntersolveCreateWalletDto,
    @Param('brandType') _brandType: string,
  ): IntersolveCreateWalletResponseDto {
    return this.intersolveVisaMockService.createWalletMock(payload.reference);
  }

  @ApiOperation({ summary: 'Get wallet' })
  @ApiOperation({ summary: 'Transfer' })
  @Post('brand-types/:brandType/issue-token') // Did not add includeBalances here as query param as we always use it with true
  public getWallet(
    @Body() payload: IntersolveCreateWalletDto,
    @Param('brandType') _brandType: string,
  ): IntersolveCreateWalletResponseDto {
    return this.intersolveVisaMockService.createWalletMock(payload.reference);
  }
}
