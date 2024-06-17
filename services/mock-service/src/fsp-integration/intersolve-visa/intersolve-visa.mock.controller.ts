import { IntersolveVisaMockResponseDto } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa-mock-response.dto';
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
  public createCustomer(@Body() dto: Record<string, any>): Record<string, any> {
    const result = this.intersolveVisaMockService.createCustomerMock(dto);
    return result;
  }

  @ApiOperation({ summary: 'Create wallet' })
  @Post('pointofsale/v1/brand-types/:brandType/issue-token') // Did not add includeBalances here as query param as we always use it with true
  public createWallet(
    @Body() payload: Record<string, any>,
    @Param('brandType') _brandType: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.createWalletMock(payload.reference);
  }

  @ApiOperation({ summary: 'Get wallet' })
  @Get('pointofsale/v1/tokens/:tokenCode') // Did not add includeBalances here as query param as we always use it with true
  public getWallet(
    @Param('tokenCode') tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.getWalletMock(tokenCode);
  }

  @ApiOperation({ summary: 'Get card' })
  @Get('/payment-instrument-payment/v1/tokens/:tokenCode/physical-card-data') // Did not add includeBalances here as query param as we always use it with true
  public getCard(
    @Param('tokenCode') tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.getCardMock(tokenCode);
  }

  @ApiOperation({ summary: 'Get transactions' })
  @Get('/wallet/v1/tokens/:tokenCode/transactions')
  public getTransactions(
    @Param('tokenCode') tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.getTransactionsMock(tokenCode);
  }

  @ApiOperation({ summary: 'Link customer to wallet' })
  @Post('wallet/v1/tokens/:tokenCode/register-holder')
  public linkCustomerToWallet(
    @Body() _payload: Record<string, unknown>,
    @Param('tokenCode') tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.linkCustomerToWalletMock(tokenCode);
  }

  @ApiOperation({ summary: 'Create debit card' })
  @Post('/payment-instrument-payment/v1/tokens/:tokenCode/create-physical-card')
  public createDebitCard(
    @Body() _payload: Record<string, unknown>,
    @Param('tokenCode') tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.createDebitCardMock(tokenCode);
  }

  @ApiOperation({ summary: 'Load balance' }) // This will be depricated after the new visa flow is implemented, it has been added for the current flow to make that one work and mergable
  @Post('/pointofsale/v1/tokens/:tokenCode/load')
  public loadBalanceCard(
    @Body() _payload: Record<string, unknown>,
    @Param('tokenCode') tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.loadBalanceCardMock(tokenCode);
  }

  @ApiOperation({ summary: 'Unload balance' }) // This will be depricated after the new visa flow is implemented, it has been added for the current flow to make that one work and mergable
  @Post('/pointofsale/v1/tokens/:tokenCode/unload')
  public unloadBalanceCard(
    @Body() _payload: Record<string, unknown>,
    @Param('tokenCode') _tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.unloadBalanceCardMock();
  }

  @ApiOperation({ summary: 'Block wallet' })
  @Post('/pointofsale/v1/tokens/:tokenCode/block')
  public blockWallet(
    @Body() _payload: Record<string, unknown>,
    @Param('tokenCode') _tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.toggleBlockWalletMock();
  }

  @ApiOperation({ summary: 'Unblock wallet' })
  @Post('/pointofsale/v1/tokens/:tokenCode/unblock')
  public unblockWallet(
    @Body() _payload: Record<string, unknown>,
    @Param('tokenCode') _tokenCode: string,
  ): IntersolveVisaMockResponseDto {
    return this.intersolveVisaMockService.toggleBlockWalletMock();
  }

  @ApiOperation({ summary: 'Update customer phonenumber' })
  @Put('/customer/v1/customers/:holderId/contact-info/phone-numbers')
  public updateCustomerPhoneNumber(
    @Body() _payload: Record<string, unknown>,
    @Param('holderId') _holderId: string,
  ): { status: number } {
    return this.intersolveVisaMockService.updateCustomerPhoneNumber();
  }

  @ApiOperation({ summary: 'Update customer address' })
  @Put('/customer/v1/customers/:holderId/contact-info/addresses')
  public updateCustomerAddress(
    @Body() _payload: Record<string, unknown>,
    @Param('holderId') _holderId: string,
  ): { status: number } {
    return this.intersolveVisaMockService.updateCustomerAddress();
  }

  @ApiOperation({ summary: 'Update customer phonnumber' })
  @Post('/wallet/v1/tokens/:childTokenCode/link-token')
  public linkToken(
    @Body() payload: Record<string, string>,
    @Param('childTokenCode') childTokenCode: string,
  ): { status: number } {
    return this.intersolveVisaMockService.linkToken(
      childTokenCode,
      payload.tokenCode,
    );
  }
}
