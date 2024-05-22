import {
  IntersolveBlockWalletDto,
  IntersolveBlockWalletResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-block.dto';
import { IntersolveLinkWalletCustomerResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer-response.dto';
import {
  IntersolveAddressDto,
  IntersolveCreateCustomerDto,
  IntersolveTypeValue,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-customer.dto';
import {
  IntersolveCreateDebitCardDto,
  IntersolveCreateDebitCardResponseDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-debit-card.dto';
import { IntersolveCreateWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';
import { IntersolveCreateWalletDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet.dto';
import { IntersolveGetCardResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-card-details.dto';
import { IntersolveGetWalletResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-details.dto';
import { GetTransactionsDetailsResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-transactions.dto';
import { IntersolveLoadResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load-response.dto';
import { IntersolveLoadDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-load.dto';
import { IntersolveVisaTransformInterceptor } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa-transform-intercepter';
import { IntersolveVisaMockService } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('fsp/intersolve-visa')
@UseInterceptors(IntersolveVisaTransformInterceptor)
@Controller('fsp/intersolve-visa')
export class IntersolveVisaMockController {
  public constructor(
    private readonly intersolveVisaMockService: IntersolveVisaMockService,
  ) {}

  @ApiOperation({ summary: 'Create customer' })
  @Post('customer/v1/customers/create-individual')
  public createCustomer(@Body() dto: IntersolveCreateCustomerDto): any {
    const result = this.intersolveVisaMockService.createCustomerMock(dto);
    return result;
  }

  @ApiOperation({ summary: 'Create wallet' })
  @Post('pointofsale/v1/brand-types/:brandType/issue-token') // Did not add includeBalances here as query param as we always use it with true
  public createWallet(
    @Body() payload: IntersolveCreateWalletDto,
    @Param('brandType') _brandType: string,
  ): IntersolveCreateWalletResponseDto {
    return this.intersolveVisaMockService.createWalletMock(payload.reference);
  }

  @ApiOperation({ summary: 'Get wallet' })
  @Get('pointofsale/v1/tokens/:tokenCode') // Did not add includeBalances here as query param as we always use it with true
  public getWallet(
    @Param('tokenCode') tokenCode: string,
  ): IntersolveGetWalletResponseDto {
    return this.intersolveVisaMockService.getWalletMock(tokenCode);
  }

  @ApiOperation({ summary: 'Get card' })
  @Get('/payment-instrument-payment/v1/tokens/:tokenCode/physical-card-data') // Did not add includeBalances here as query param as we always use it with true
  public getCard(
    @Param('tokenCode') tokenCode: string,
  ): IntersolveGetCardResponseDto {
    return this.intersolveVisaMockService.getCardMock(tokenCode);
  }

  @ApiOperation({ summary: 'Get transactions' })
  @Get('/wallet/v1/tokens/:tokenCode/transactions')
  public getTransactions(
    @Param('tokenCode') tokenCode: string,
  ): GetTransactionsDetailsResponseDto {
    return this.intersolveVisaMockService.getTransactionsMock(tokenCode);
  }

  @ApiOperation({ summary: 'Link customer to wallet' })
  @Post('wallet/v1/tokens/:tokenCode/register-holder')
  public linkCustomerToWallet(
    @Body() _payload: IntersolveCreateWalletDto,
    @Param('tokenCode') tokenCode: string,
  ): IntersolveLinkWalletCustomerResponseDto {
    return this.intersolveVisaMockService.linkCustomerToWalletMock(tokenCode);
  }

  @ApiOperation({ summary: 'Create debit card' })
  @Post('/payment-instrument-payment/v1/tokens/:tokenCode/create-physical-card')
  public createDebitCard(
    @Body() _payload: IntersolveCreateDebitCardDto,
    @Param('tokenCode') tokenCode: string,
  ): IntersolveCreateDebitCardResponseDto {
    return this.intersolveVisaMockService.createDebitCardMock(tokenCode);
  }

  @ApiOperation({ summary: 'Load balance' }) // This will be depricated after the new visa flow is implemented, it has been added for the current flow to make that one work and mergable
  @Post('/pointofsale/v1/tokens/:tokenCode/load')
  public loadBalanceCard(
    @Body() _payload: IntersolveLoadDto,
    @Param('tokenCode') tokenCode: string,
  ): IntersolveLoadResponseDto {
    return this.intersolveVisaMockService.loadBalanceCardMock(tokenCode);
  }

  @ApiOperation({ summary: 'Unload balance' }) // This will be depricated after the new visa flow is implemented, it has been added for the current flow to make that one work and mergable
  @Post('/pointofsale/v1/tokens/:tokenCode/unload')
  public unloadBalanceCard(
    @Body() _payload: IntersolveLoadDto,
    @Param('tokenCode') _tokenCode: string,
  ): IntersolveLoadResponseDto {
    return this.intersolveVisaMockService.unloadBalanceCardMock();
  }

  @ApiOperation({ summary: 'Block wallet' })
  @Post('/pointofsale/v1/tokens/:tokenCode/block')
  public blockWallet(
    @Body() _payload: IntersolveBlockWalletDto,
    @Param('tokenCode') _tokenCode: string,
  ): IntersolveBlockWalletResponseDto {
    return this.intersolveVisaMockService.toggleBlockWalletMock();
  }

  @ApiOperation({ summary: 'Unblock wallet' })
  @Post('/pointofsale/v1/tokens/:tokenCode/unblock')
  public unblockWallet(
    @Body() _payload: IntersolveBlockWalletDto,
    @Param('tokenCode') _tokenCode: string,
  ): IntersolveBlockWalletResponseDto {
    return this.intersolveVisaMockService.toggleBlockWalletMock();
  }

  @ApiOperation({ summary: 'Update customer phonnumber' })
  @Put('/customer/v1/customers/:holderId/contact-info/phone-numbers')
  public updateCustomerPhoneNumber(
    @Body() _payload: IntersolveTypeValue,
    @Param('tokenCode') _holderId: string,
  ): { status: number } {
    return this.intersolveVisaMockService.updateCustomerPhoneNumber();
  }

  @ApiOperation({ summary: 'Update customer phonnumber' })
  @Put('/customer/v1/customers/:holderId/contact-info/addresses')
  public updateCustomerAddress(
    @Body() _payload: IntersolveAddressDto,
    @Param('tokenCode') _holderId: string,
  ): { status: number } {
    return this.intersolveVisaMockService.updateCustomerAddress();
  }
}
